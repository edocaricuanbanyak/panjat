import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { sponsorKontak } from "@/db/schema";
import { consumeToken } from "@/lib/magiclink";
import { SESSION_COOKIE, sessionCookieOptions, signSession } from "@/lib/session";

export const runtime = "nodejs";

/** GET /api/dasbor/verifikasi?token=… — single-use → verify ownership → session. */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const kontakId = token ? await consumeToken(db, token) : null;

  if (!kontakId) {
    return NextResponse.redirect(new URL("/dasbor/masuk?e=kadaluarsa", req.url));
  }

  // First successful login verifies ownership of the email (§18.2); keep the
  // original verification timestamp on later logins.
  await db
    .update(sponsorKontak)
    .set({ verifiedAt: sql`coalesce(${sponsorKontak.verifiedAt}, now())` })
    .where(eq(sponsorKontak.id, kontakId));

  const res = NextResponse.redirect(new URL("/dasbor", req.url));
  res.cookies.set(SESSION_COOKIE, signSession(kontakId), sessionCookieOptions);
  return res;
}
