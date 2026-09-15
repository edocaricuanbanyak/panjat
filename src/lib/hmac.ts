import { timingSafeEqual } from "node:crypto";

/**
 * Constant-time string comparison. Buffers both as UTF-8 and length-checks first
 * (timingSafeEqual throws when the two buffers differ in length). One audited
 * implementation for every signature/HMAC check — Midtrans + the MoR gateways —
 * so the security-critical compare lives in exactly one place.
 */
export function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
