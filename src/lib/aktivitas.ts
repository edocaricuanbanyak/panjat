/**
 * Recent-activity feed for the Spotlight ticker — a capped Redis list of live
 * events (vote, dukung, naik/salip). Cosmetic and best-effort: a down Redis just
 * yields an empty feed. Never money-critical; kept off the ledger path.
 */
import { redis } from "./redis";

const KEY = "aktivitas:recent";
const MAX = 30;
const TTL_S = 60 * 60 * 24 * 3;

export type AktivitasJenis = "vote" | "dukung" | "naik";
export interface Aktivitas {
  jenis: AktivitasJenis;
  nama: string;
  id: string;
  rank?: number;
}

/** Record one event at the head of the feed. Best-effort. */
export async function pushAktivitas(a: Aktivitas): Promise<void> {
  const r = redis();
  if (!r) return;
  try {
    await r.lpush(KEY, JSON.stringify(a));
    await r.ltrim(KEY, 0, MAX - 1);
    await r.expire(KEY, TTL_S);
  } catch {
    /* feed is best-effort */
  }
}

/** Newest-first recent events. */
export async function recentAktivitas(n = 20): Promise<Aktivitas[]> {
  const r = redis();
  if (!r) return [];
  try {
    const raw = await r.lrange(KEY, 0, n - 1);
    const out: Aktivitas[] = [];
    for (const s of raw) {
      try {
        out.push(JSON.parse(s) as Aktivitas);
      } catch {
        /* skip corrupt entry */
      }
    }
    return out;
  } catch {
    return [];
  }
}
