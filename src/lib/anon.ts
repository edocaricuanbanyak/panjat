/**
 * Anonymous visitor identity (R14) — a server-signed httpOnly cookie, 1 year,
 * no personal data. The value is a UUID; the DB row (pengunjung_anon) is created
 * lazily on the first action. Never touches money, ranking, or clicks (§7.5.2).
 * `localStorage` is deliberately avoided — it's editable from the console.
 */
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ANON_COOKIE = "panjat_anon";
const MAX_AGE_S = 60 * 60 * 24 * 365; // 1 year

function secret(): string {
  return process.env.ANON_SECRET ?? "dev-anon-secret";
}

export function signAnon(id: string): string {
  const sig = createHmac("sha256", secret()).update(id).digest("base64url");
  return `${id}.${sig}`;
}

export function verifyAnon(token: string | undefined): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const id = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", secret()).update(id).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return id;
}

export function newAnonId(): string {
  return randomUUID();
}

export const anonCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_S,
};

/** Read the current anon id from request cookies (server components). */
export async function currentAnon(): Promise<string | null> {
  const store = await cookies();
  return verifyAnon(store.get(ANON_COOKIE)?.value);
}
