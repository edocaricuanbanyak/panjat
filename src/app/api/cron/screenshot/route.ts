import { NextResponse } from "next/server";
import { and, eq, isNull, lt, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { listing } from "@/db/schema";
import { assertCron } from "@/lib/cron";
import { captureAndStore } from "@/lib/screenshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Chromium is heavy — cap captures per run; the rest wait for the next tick.
const MAX_PER_RUN = 5;
const STALE_DAYS = 7;

/**
 * Screenshot worker (R21). Captures live listings that have no screenshot yet or
 * whose screenshot is older than a week. Best-effort — a failed capture leaves
 * the listing without one (UI falls back to og:image/logo); never blocks the
 * board. Schedule hourly (see vercel.json).
 */
export async function GET(req: Request) {
  const auth = assertCron(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const pending = await db
    .select({ id: listing.id, urlNormal: listing.urlNormal })
    .from(listing)
    .where(
      and(
        eq(listing.status, "tayang"),
        or(
          isNull(listing.screenshotUrl),
          lt(listing.screenshotAt, sql`now() - interval '${sql.raw(String(STALE_DAYS))} days'`),
        ),
      ),
    )
    .orderBy(sql`${listing.screenshotAt} asc nulls first`)
    .limit(MAX_PER_RUN);

  const results: { id: string; ok: boolean }[] = [];
  for (const l of pending) {
    const url = await captureAndStore(l.id, l.urlNormal);
    if (url) {
      await db
        .update(listing)
        .set({ screenshotUrl: url, screenshotAt: sql`now()` })
        .where(eq(listing.id, l.id));
    } else {
      // Stamp the attempt so a permanently-failing URL isn't retried every run.
      await db.update(listing).set({ screenshotAt: sql`now()` }).where(eq(listing.id, l.id));
    }
    results.push({ id: l.id, ok: Boolean(url) });
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
