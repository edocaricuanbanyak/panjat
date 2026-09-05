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
const CACHE_KEY = "ga4:stats:v8:alltime"; // bumped to bypass any stale empty cache while diagnosing
const CACHE_TTL = 3600; // 1h — GA4 numbers aren't real-time anyway.

const TAK_DIKETAHUI = "(tidak diketahui)";
/** GA4 returns "(not set)"/"" when a city or OS can't be determined. */
const cleanLabel = (v: string) => (!v || v === "(not set)" ? TAK_DIKETAHUI : v);

/**
 * Accept the service-account key as raw JSON *or* base64-encoded JSON. Base64 is
 * the robust way to store it in an env var: a pasted private_key's `\n` escapes
 * and quotes routinely get mangled, breaking JSON.parse (that's the failure we
 * hit in prod). `GA4_SA_JSON = base64(sa.json)` sidesteps all of it.
 */
export function parseSaCredentials(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) {
    try {
      return JSON.parse(trimmed);
    } catch {
      /* not plain JSON — try base64 below */
    }
  }
  try {
    const decoded = Buffer.from(trimmed, "base64").toString("utf8").trim();
    if (decoded.startsWith("{")) return JSON.parse(decoded);
  } catch {
    /* not base64-encoded JSON either */
  }
  return null;
}

let client: BetaAnalyticsDataClient | null = null;
function ga4Client(): BetaAnalyticsDataClient | null {
  if (client) return client;
  const raw = process.env.GA4_SA_JSON;
  if (!raw) {
    console.error("[ga4] GA4_SA_JSON is empty/unset at runtime"); // TEMP debug — remove after diagnosing
    return null;
  }
  const creds = parseSaCredentials(raw);
  if (!creds) {
    // TEMP debug — remove after diagnosing. Set GA4_SA_JSON to the raw one-line
    // JSON or its base64 (`base64 -i sa.json | tr -d '\n'`).
    console.error("[ga4] GA4_SA_JSON is not valid JSON nor base64-encoded JSON");
    return null;
  }
  try {
    client = new BetaAnalyticsDataClient({ credentials: creds });
    return client;
  } catch (e) {
    console.error("[ga4] client init failed:", e instanceof Error ? e.message : e); // TEMP debug
    return null;
  }
}

const num = (v: string | null | undefined) => Number(v ?? 0) || 0;

export async function getGa4Stats(): Promise<Ga4Stats | null> {
  const propertyId = process.env.GA4_PROPERTY_ID;
  const c = ga4Client();
  if (!propertyId || !c) {
    // TEMP debug — remove after diagnosing. Booleans only (never log the SA/id value).
    console.error(
      "[ga4] unconfigured at runtime — propertyIdSet=%s clientReady=%s",
      Boolean(propertyId),
      Boolean(c),
    );
    return null;
  }

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

    // TEMP debug — remove after diagnosing. Distinguishes "API ok but no data"
    // (both 0 → the block still hides) from a thrown error (logged below).
    console.error("[ga4] runReport ok — city rows=%d, os rows=%d", stats.lokasi.length, stats.perangkat.length);

    if (r) {
      try {
        await r.set(CACHE_KEY, JSON.stringify(stats), "EX", CACHE_TTL);
      } catch {
        /* cache write is best-effort */
      }
    }
    return stats;
  } catch (e) {
    // Quota, auth, or network error — hide the block rather than break the page.
    // TEMP debug — remove after diagnosing. The GA4 API error message names the
    // cause (PERMISSION_DENIED = SA not a Viewer; INVALID_ARGUMENT = bad property id).
    console.error("[ga4] runReport failed:", e instanceof Error ? (e.stack ?? e.message) : e);
    return null;
  }
}
