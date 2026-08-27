import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { listing } from "@/db/schema";
import { ownsListing } from "@/domain/dashboard";
import { rateLimit } from "@/lib/ratelimit";
import { captureAndStore } from "@/lib/screenshot";
import { currentKontak } from "@/lib/session";

export const runtime = "nodejs";

/** POST /api/dasbor/[listing]/screenshot — owner refreshes the site preview (R21, max 1×/day). */
export async function POST(_req: Request, { params }: { params: Promise<{ listing: string }> }) {
  const kontakId = await currentKontak();
  if (!kontakId) return NextResponse.json({ error: "Tidak sah" }, { status: 401 });

  const { listing: id } = await params;
  if (!(await ownsListing(db, id, kontakId))) {
    return NextResponse.json({ error: "Tidak sah" }, { status: 403 });
  }

  const rl = await rateLimit(`shot:${id}`, 1, 86_400);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Pratinjau bisa disegarkan maksimal sekali sehari. Coba lagi besok." },
      { status: 429 },
    );
  }

  const [l] = await db
    .select({ urlNormal: listing.urlNormal })
    .from(listing)
    .where(eq(listing.id, id))
    .limit(1);
  if (!l) return NextResponse.json({ error: "Listing tidak ditemukan" }, { status: 404 });

  const url = await captureAndStore(id, l.urlNormal);
  if (url) {
    await db
      .update(listing)
      .set({ screenshotUrl: url, screenshotAt: sql`now()` })
      .where(eq(listing.id, id));
  }
  return NextResponse.json({ ok: Boolean(url), screenshotUrl: url });
}
