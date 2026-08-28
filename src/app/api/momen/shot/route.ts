import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { listing, transaksi } from "@/db/schema";
import { rateLimit } from "@/lib/ratelimit";
import { captureAndStore } from "@/lib/screenshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/momen/shot — capture a freshly-paid listing's screenshot on demand so
 * the Momen Puncak share card can show the real product before the hourly worker
 * runs. Anonymous but safe: keyed to a paid order, tayang-only, no-ops when a
 * screenshot already exists, rate-limited (1×/hour/listing), and the capture
 * itself is SSRF-guarded (lib/screenshot). Cosmetic — never touches money/ranking.
 */
export async function POST(req: Request) {
  const { order } = (await req.json().catch(() => ({}))) as { order?: string };
  if (!order) return NextResponse.json({ ready: false }, { status: 400 });

  const [t] = await db
    .select({ listingId: transaksi.listingId })
    .from(transaksi)
    .where(eq(transaksi.orderId, order))
    .limit(1);
  if (!t) return NextResponse.json({ ready: false }, { status: 404 });

  const [l] = await db
    .select({ status: listing.status, urlNormal: listing.urlNormal, screenshotUrl: listing.screenshotUrl })
    .from(listing)
    .where(eq(listing.id, t.listingId))
    .limit(1);
  if (!l || l.status !== "tayang") return NextResponse.json({ ready: false }, { status: 404 });
  if (l.screenshotUrl) return NextResponse.json({ ready: true });

  const rl = await rateLimit(`momen-shot:${t.listingId}`, 1, 3600);
  if (!rl.ok) return NextResponse.json({ ready: false, throttled: true });

  const url = await captureAndStore(t.listingId, l.urlNormal);
  if (url) {
    await db
      .update(listing)
      .set({ screenshotUrl: url, screenshotAt: sql`now()` })
      .where(eq(listing.id, t.listingId));
    return NextResponse.json({ ready: true });
  }
  return NextResponse.json({ ready: false });
}
