import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { listing } from "@/db/schema";
import { isBot, recordClick, withUtm } from "@/domain/klik";
import { clientIp, dailySalt, hashWith } from "@/lib/ip";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /k/{listingId} — server-side click redirect (R10). Counts the click
 * (best-effort; never blocks the redirect), then 302s to the listing's URL with
 * leaderboard UTM params.
 */
export async function GET(req: Request, ctx: { params: Promise<{ listing: string }> }) {
  const { listing: listingId } = await ctx.params;
  const home = new URL("/", req.url);

  if (!UUID.test(listingId)) return NextResponse.redirect(home);

  const [l] = await db
    .select({ urlNormal: listing.urlNormal })
    .from(listing)
    .where(eq(listing.id, listingId))
    .limit(1);
  if (!l) return NextResponse.redirect(home);

  // Count the click, but the redirect must always succeed even if counting fails.
  try {
    const ua = req.headers.get("user-agent") ?? "";
    const now = new Date();
    const salt = dailySalt(now);
    await recordClick(db, {
      listingId,
      ipHash: hashWith(clientIp(req.headers), salt),
      uaHash: hashWith(ua, salt),
      referer: req.headers.get("referer"),
      isBot: isBot(ua),
      now,
    });
  } catch (err) {
    console.error("klik count failed", err);
  }

  return NextResponse.redirect(withUtm(l.urlNormal), 302);
}
