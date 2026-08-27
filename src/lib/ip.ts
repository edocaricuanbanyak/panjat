/**
 * IP/UA hashing for click auditing (R10, §17.1). Raw IPs are NEVER stored.
 *
 * A per-day salt (HMAC of a server secret over the UTC date) is mixed into each
 * hash, so the same IP produces a different hash on a different day — clicks
 * cannot be linked across days (UU PDP), while within a day the hash is stable
 * enough to dedup. The salt is derived, not stored, so it "rotates" for free.
 */
import { createHash, createHmac } from "node:crypto";

function secret(): string {
  return process.env.KLIK_HASH_SECRET ?? "dev-klik-secret";
}

/** UTC calendar date "YYYY-MM-DD" — the salt's rotation boundary. */
export function utcDateKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/** Per-day salt = HMAC-SHA256(secret, utc-date). */
export function dailySalt(now: Date, key = secret()): string {
  return createHmac("sha256", key).update(utcDateKey(now)).digest("hex");
}

/** Opaque hash of an identifier under the given salt. Empty input → empty hash. */
export function hashWith(value: string, salt: string): string {
  if (!value) return "";
  return createHash("sha256").update(`${salt}:${value}`).digest("hex");
}

/** Best-effort client IP from proxy headers (Cloudflare/Vercel set these). */
export function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return headers.get("x-real-ip")?.trim() || "0.0.0.0";
}
