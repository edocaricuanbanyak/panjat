/**
 * Visitor presence counters (public "online" + total-since-release). Redis-only,
 * no schema: a sorted set gives a 5-minute sliding "online now" window, and a
 * HyperLogLog approximates unique visitors since launch. Fail-open — a down or
 * absent Redis just yields zeros, never an error (this is a vibe metric, not
 * money-critical; keep it far from the ledger).
 */
import { redis } from "./redis";

export const VID_COOKIE = "panjat_vid";
const ONLINE_KEY = "pengunjung:online";
const TOTAL_KEY = "pengunjung:total";
const WINDOW_S = 300; // "online" = seen in the last 5 minutes

/** Record a heartbeat for this visitor id. Best-effort. */
export async function pingVisitor(vid: string): Promise<void> {
  const r = redis();
  if (!r) return;
  try {
    const now = Math.floor(Date.now() / 1000);
    await Promise.all([r.zadd(ONLINE_KEY, now, vid), r.pfadd(TOTAL_KEY, vid)]);
  } catch {
    /* presence is best-effort */
  }
}

export interface VisitorStats {
  online: number;
  total: number;
}

/** Prune the stale window, then read online + total. Best-effort → zeros. */
export async function visitorStats(): Promise<VisitorStats> {
  const r = redis();
  if (!r) return { online: 0, total: 0 };
  try {
    const now = Math.floor(Date.now() / 1000);
    await r.zremrangebyscore(ONLINE_KEY, 0, now - WINDOW_S);
    const [online, total] = await Promise.all([r.zcard(ONLINE_KEY), r.pfcount(TOTAL_KEY)]);
    return { online: Number(online), total: Number(total) };
  } catch {
    return { online: 0, total: 0 };
  }
}
