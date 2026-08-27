/**
 * Admin auth (§18.5) — separate from sponsor sessions, its own cookie. Password
 * from ADMIN_PASSWORD → short-lived signed cookie. NOTE: 2FA is required before
 * public launch (deferred); this is single-factor for operating the queue.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { verifyTotp } from "./totp";

export const ADMIN_COOKIE = "panjat_admin";
const MAX_AGE_S = 60 * 60 * 12; // 12 hours

const secret = () => process.env.ADMIN_SECRET ?? "dev-admin-secret";
const password = () => process.env.ADMIN_PASSWORD ?? "admin";
const totpSecret = () => process.env.ADMIN_TOTP_SECRET ?? "";

/** 2FA is enforced when ADMIN_TOTP_SECRET is set. Required before public launch. */
export function totpEnabled(): boolean {
  return totpSecret().length > 0;
}

export function checkPassword(input: string): boolean {
  const a = Buffer.from(input);
  const b = Buffer.from(password());
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Full admin login check: password + (TOTP code if 2FA enabled). */
export function checkAdminLogin(inputPassword: string, code: string): boolean {
  if (!checkPassword(inputPassword)) return false;
  if (!totpEnabled()) return true;
  return verifyTotp(totpSecret(), code);
}

export function signAdmin(now = Date.now()): string {
  const payload = Buffer.from(JSON.stringify({ exp: now + MAX_AGE_S * 1000 })).toString("base64url");
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyAdmin(token: string | undefined, now = Date.now()): boolean {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  const x = Buffer.from(sig);
  const y = Buffer.from(expected);
  if (x.length !== y.length || !timingSafeEqual(x, y)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof exp === "number" && exp >= now;
  } catch {
    return false;
  }
}

export const adminCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_S,
};

export async function currentAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifyAdmin(store.get(ADMIN_COOKIE)?.value);
}
