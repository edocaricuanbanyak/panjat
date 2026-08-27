import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/db";
import { GuessError, recordGuess } from "@/domain/tebakan";
import { ANON_COOKIE, anonCookieOptions, newAnonId, signAnon, verifyAnon } from "@/lib/anon";

export const runtime = "nodejs";

/** POST /api/tebak (form: listingId) — record today's guess; ensures anon (R14). */
export async function POST(req: Request) {
  const form = await req.formData();
  const listingId = String(form.get("listingId") ?? "");

  const store = await cookies();
  let anonId = verifyAnon(store.get(ANON_COOKIE)?.value);
  const setCookie = !anonId;
  if (!anonId) anonId = newAnonId();

  const back = new URL("/", req.url);
  try {
    await recordGuess(db, anonId, listingId, new Date());
    back.searchParams.set("tebak", "ok");
  } catch (err) {
    back.searchParams.set("tebak", err instanceof GuessError ? "gagal" : "error");
  }

  const res = NextResponse.redirect(back, { status: 303 });
  if (setCookie) res.cookies.set(ANON_COOKIE, signAnon(anonId), anonCookieOptions);
  return res;
}
