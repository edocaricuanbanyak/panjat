/**
 * TOTP (RFC 6238) for admin 2FA (§18.5) — no dependency. Pure + testable.
 */
import { createHmac, randomBytes } from "node:crypto";

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Decode(input: string): Buffer {
  const clean = input.replace(/=+$/, "").replace(/\s/g, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    const idx = B32.indexOf(ch);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((value >> bits) & 0xff);
    }
  }
  return Buffer.from(out);
}

export function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += B32[(value >> bits) & 31];
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

function hotp(key: Buffer, counter: number, digits = 6): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac("sha1", key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const bin =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3];
  return (bin % 10 ** digits).toString().padStart(digits, "0");
}

export interface TotpOpts {
  now?: number; // ms
  step?: number; // seconds
  digits?: number;
  window?: number; // ± steps of clock skew tolerance
}

/** Verify a code against the secret within a small time window. */
export function verifyTotp(secretBase32: string, code: string, opts: TotpOpts = {}): boolean {
  const { now = Date.now(), step = 30, digits = 6, window = 1 } = opts;
  const key = base32Decode(secretBase32);
  const counter = Math.floor(now / 1000 / step);
  const target = code.trim();
  for (let w = -window; w <= window; w++) {
    if (hotp(key, counter + w, digits) === target) return true;
  }
  return false;
}

export function generateSecret(): string {
  return base32Encode(randomBytes(20));
}

export function otpauthUrl(secret: string, label = "admin", issuer = "Panjat"): string {
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(label)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
}
