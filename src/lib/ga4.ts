/**
 * GA4 breakdowns for /statistik — first-party (no iframe, no CSP change).
 * Reads the GA4 Data API server-side with a service account, cached in Redis so
 * we stay well within the API quota. Returns null when unconfigured (env unset)
 * or on any error, so the page degrades gracefully (the block just hides).
 *
 * Setup (in your Google account):
 *   1. Google Cloud → create a service account, enable "Google Analytics Data API".
 *   2. GA4 → Admin → Property → Access Management → add the SA email as "Viewer".
 *   3. Set env:
 *        GA4_PROPERTY_ID = numeric property id (GA4 Admin → Property Settings)
 *        GA4_SA_JSON     = the whole service-account key JSON (one line)
 */
import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { redis } from "./redis";

export interface Ga4Row {
  label: string;
  users: number;
}

export interface Ga4Stats {
  /** Active users by city, most first. */
  lokasi: Ga4Row[];
  /** Active users by operating system (Android/iOS/Windows/…), most first. */
  perangkat: Ga4Row[];
}

// All-time: GA4 has no data before it existed, so this start reads from the
// property's very first day onward (the API just returns what exists).
const ALL_TIME_START = "2020-01-01";
const CACHE_KEY = "ga4:stats:v7:alltime";
const CACHE_TTL = 3600; // 1h — GA4 numbers aren't real-time anyway.

const TAK_DIKETAHUI = "(tidak diketahui)";
/** GA4 returns "(not set)"/"" when a city or OS can't be determined. */
const cleanLabel = (v: string) => (!v || v === "(not set)" ? TAK_DIKETAHUI : v);

let client: BetaAnalyticsDataClient | null = null;
function ga4Client(): BetaAnalyticsDataClient | null {
  if (client) return client;
  const raw = process.env.GA4_SA_JSON;
  if (!raw) return null;
  try {
    client = new BetaAnalyticsDataClient({ credentials: JSON.parse(raw) });
    return client;
  } catch {
    return null; // malformed JSON → treat as unconfigured
  }
}

const num = (v: string | null | undefined) => Number(v ?? 0) || 0;

export async function getGa4Stats(): Promise<Ga4Stats | null> {
  const propertyId = process.env.GA4_PROPERTY_ID;
  const c = ga4Client();
  if (!propertyId || !c) return null;

  const r = redis();
  if (r) {
    try {
      const hit = await r.get(CACHE_KEY);
      if (hit) return JSON.parse(hit) as Ga4Stats;
    } catch {
      /* cache read is best-effort */
    }
  }

  try {
    const property = `properties/${propertyId}`;
    const dateRanges = [{ startDate: ALL_TIME_START, endDate: "today" }];
    const byUsers = [{ metric: { metricName: "activeUsers" }, desc: true }];

    const [byCity] = await c.runReport({
      property,
      dateRanges,
      dimensions: [{ name: "city" }],
      metrics: [{ name: "activeUsers" }],
      orderBys: byUsers,
      limit: 6,
    });
    const [byOs] = await c.runReport({
      property,
      dateRanges,
      dimensions: [{ name: "operatingSystem" }],
      metrics: [{ name: "activeUsers" }],
      orderBys: byUsers,
      limit: 6,
    });

    const rows = (rep: typeof byCity): Ga4Row[] =>
      (rep.rows ?? []).map((row) => ({
        label: cleanLabel(row.dimensionValues?.[0]?.value ?? ""),
        users: num(row.metricValues?.[0]?.value),
      }));

    const stats: Ga4Stats = { lokasi: rows(byCity), perangkat: rows(byOs) };

    if (r) {
      try {
        await r.set(CACHE_KEY, JSON.stringify(stats), "EX", CACHE_TTL);
      } catch {
        /* cache write is best-effort */
      }
    }
    return stats;
  } catch {
    // Quota, auth, or network error — hide the block rather than break the page.
    return null;
  }
}
