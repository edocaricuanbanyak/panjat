/**
 * Fixed-window rate limiting (§18.4). Anti-abuse, not auth — so it FAILS OPEN:
 * if Redis is unavailable, the request is allowed (an infra blip must not take
 * the app down). Keys are namespaced per route + identifier (IP/anon id).
 */
import { redis } from "./redis";

export interface RateResult {
  ok: boolean;
  remaining: number;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number,
): Promise<RateResult> {
  const r = redis();
  if (!r) return { ok: true, remaining: limit };
  try {
    const k = `rl:${key}`;
    const n = await r.incr(k);
    if (n === 1) await r.expire(k, windowSec);
    return { ok: n <= limit, remaining: Math.max(0, limit - n) };
  } catch {
    // Redis down → allow (fail open).
    return { ok: true, remaining: limit };
  }
}
