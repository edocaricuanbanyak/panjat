import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { listing } from "@/db/schema";
import { SorakError, recordSorak } from "@/domain/sorak";
import { pushAktivitas } from "@/lib/aktivitas";
import { ANON_COOKIE, anonCookieOptions, newAnonId, signAnon, verifyAnon } from "@/lib/anon";
import { clientIp } from "@/lib/ip";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

/** POST /api/sorak (form: listingId) — one Sorak for a Kaki Tiang listing (R16).
 *  Returns JSON when called via fetch (Accept: application/json) so the client can
 *  animate + optimistically update; otherwise redirects (no-JS form fallback). */
export async function POST(req: Request) {
  const wantsJson = req.headers.get("accept")?.includes("application/json") ?? false;
  const fail = (kind: string, status = 400) =>
    wantsJson
      ? NextResponse.json({ ok: false, error: kind }, { status })
      : NextResponse.redirect(new URL(`/?sorak=${kind}#kaki-tiang`, req.url), { status: 303 });

  // Anti-abuse: a burst from one IP is dropped (§R16).
  const rl = await rateLimit(`sorak:${clientIp(req.headers)}`, 10, 60);
  if (!rl.ok) return fail("gagal", 429);

  const form = await req.formData();
  const listingId = String(form.get("listingId") ?? "");

  const store = await cookies();
  let anonId = verifyAnon(store.get(ANON_COOKIE)?.value);
  const setCookie = !anonId;
  if (!anonId) anonId = newAnonId();

  try {
    await recordSorak(db, anonId, listingId, new Date());
    const [l] = await db
      .select({ nama: listing.nama })
      .from(listing)
      .where(eq(listing.id, listingId))
      .limit(1);
    if (l) await pushAktivitas({ jenis: "dukung", nama: l.nama, id: listingId });
  } catch (err) {
    const res = fail(err instanceof SorakError ? "gagal" : "error");
    if (setCookie) res.cookies.set(ANON_COOKIE, signAnon(anonId), anonCookieOptions);
    return res;
  }

  const back = new URL("/", req.url);
  back.searchParams.set("sorak", "ok");
  back.hash = "kaki-tiang";
  const res = wantsJson
    ? NextResponse.json({ ok: true })
    : NextResponse.redirect(back, { status: 303 });
  if (setCookie) res.cookies.set(ANON_COOKIE, signAnon(anonId), anonCookieOptions);
  return res;
}
