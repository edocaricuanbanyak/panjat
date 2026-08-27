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

/** POST /api/sorak (form: listingId) — one Sorak for a Kaki Tiang listing (R16). */
export async function POST(req: Request) {
  // Anti-abuse: a burst from one IP is dropped (§R16).
  const rl = await rateLimit(`sorak:${clientIp(req.headers)}`, 10, 60);
  if (!rl.ok) return NextResponse.redirect(new URL("/?sorak=gagal", req.url), { status: 303 });

  const form = await req.formData();
  const listingId = String(form.get("listingId") ?? "");

  const store = await cookies();
  let anonId = verifyAnon(store.get(ANON_COOKIE)?.value);
  const setCookie = !anonId;
  if (!anonId) anonId = newAnonId();

  const back = new URL("/", req.url);
  try {
    await recordSorak(db, anonId, listingId, new Date());
    back.searchParams.set("sorak", "ok");
    const [l] = await db
      .select({ nama: listing.nama })
      .from(listing)
      .where(eq(listing.id, listingId))
      .limit(1);
    if (l) await pushAktivitas({ jenis: "dukung", nama: l.nama, id: listingId });
  } catch (err) {
    back.searchParams.set("sorak", err instanceof SorakError ? "gagal" : "error");
  }
  back.hash = "kaki-tiang";

  const res = NextResponse.redirect(back, { status: 303 });
  if (setCookie) res.cookies.set(ANON_COOKIE, signAnon(anonId), anonCookieOptions);
  return res;
}
