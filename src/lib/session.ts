/**
 * Stateless dashboard session (§18.2) — a signed cookie, no session table.
 * Payload {kontakId, exp} is HMAC-SHA256 signed with SESSION_SECRET; 30 days.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "panjat_sesi";
const MAX_AGE_S = 60 * 60 * 24 * 30; // 30 days

function secret(): string {
  return process.env.SESSION_SECRET ?? "dev-session-secret";
}

function sign(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

/** Sign a session token for a kontak. */
export function signSession(kontakId: string, now = Date.now()): string {
  const payload = Buffer.from(
    JSON.stringify({ k: kontakId, exp: now + MAX_AGE_S * 1000 }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Verify a session token; returns kontakId or null. */
export function verifySession(token: string | undefined, now = Date.now()): string | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;

  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const { k, exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof k !== "string" || typeof exp !== "number" || exp < now) return null;
    return k;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_S,
};

/** Read the current kontakId from the request cookies (server components). */
export async function currentKontak(): Promise<string | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}
