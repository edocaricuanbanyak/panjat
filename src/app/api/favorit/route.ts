import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { listing } from "@/db/schema";
import { voteFavorit } from "@/lib/favorit";
import { VID_COOKIE } from "@/lib/presence";

export const runtime = "nodejs";

/** POST /api/favorit { listingId } — cast this visitor's free favourite vote. */
export async function POST(req: Request) {
  const vid = (await cookies()).get(VID_COOKIE)?.value;
  if (!vid) return NextResponse.json({ error: "Kunjungan belum dikenali" }, { status: 400 });

  let body: { listingId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }
  const listingId = body.listingId;
  if (typeof listingId !== "string") {
    return NextResponse.json({ error: "listingId wajib" }, { status: 400 });
  }

  // Only a live listing can be favourited.
  const [l] = await db
    .select({ id: listing.id })
    .from(listing)
    .where(and(eq(listing.id, listingId), eq(listing.status, "tayang")))
    .limit(1);
  if (!l) return NextResponse.json({ error: "Listing tidak ditemukan" }, { status: 404 });

  const result = await voteFavorit(vid, listingId);
  if (!result.ok) {
    // Already voted today → 409; anything else is a soft failure.
    return NextResponse.json(result, { status: result.reason === "sudah" ? 409 : 200 });
  }
  return NextResponse.json(result);
}
