import { inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { listing } from "@/db/schema";
import { weekBucket, weekStartWIB } from "@/lib/favorit";
import { redis } from "@/lib/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * TEMPORARY favorit-vote diagnostic — remove after confirming the weekly reset.
 * Shows which week the server is in and the raw tally for THIS week vs LAST week,
 * so we can verify the votes now showing are post-Wednesday-17:00 (current bucket)
 * and not leftovers. Read-only; no secrets.
 */
async function tallyFor(bucket: number) {
  const r = redis();
  if (!r) return { redis: false, rows: [] };
  const raw = await r.zrevrange(`favorit:tally:w${bucket}`, 0, -1, "WITHSCORES");
  const votes = new Map<string, number>();
  for (let i = 0; i < raw.length; i += 2) votes.set(raw[i], Number(raw[i + 1]));
  const ids = [...votes.keys()];
  const names = ids.length
    ? await db.select({ id: listing.id, nama: listing.nama }).from(listing).where(inArray(listing.id, ids))
    : [];
  const byId = new Map(names.map((n) => [n.id, n.nama]));
  return {
    redis: true,
    total: ids.length,
    rows: ids.map((id) => ({ votes: votes.get(id) ?? 0, nama: byId.get(id) ?? "(?)", id: id.slice(0, 8) })),
  };
}

export async function GET() {
  const now = new Date();
  const wb = weekBucket(now);
  return NextResponse.json({
    serverNowUTC: now.toISOString(),
    currentWeek: {
      bucket: wb,
      opensWIB: `${weekStartWIB(now)} 17:00`, // the Wed cutoff that started this week
      tally: await tallyFor(wb),
    },
    lastWeek: {
      bucket: wb - 1,
      tally: await tallyFor(wb - 1),
    },
  });
}
