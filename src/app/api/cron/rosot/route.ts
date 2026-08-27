import { NextResponse } from "next/server";
import { db } from "@/db";
import { assertCron } from "@/lib/cron";
import { notifyDrops } from "@/domain/notifikasi";
import { applyHourlyRosot } from "@/domain/rosot-run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Hourly rosot (§6, non-negotiable). Decay is chosen by each listing's current
 * position and applied server-side; idempotent per hour (skips if already run).
 * Schedule: `0 * * * *` (see vercel.json).
 */
export async function GET(req: Request) {
  const auth = assertCron(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const now = new Date();
  const res = await applyHourlyRosot(db, now);
  if (res.skipped) {
    return NextResponse.json({ ok: true, skipped: true, ref: res.ref });
  }

  // "Kamu disalip" notifications run outside the board transaction (R3).
  let notified = { sent: 0, suppressed: 0 };
  if (res.drops.length > 0) {
    notified = await notifyDrops(db, res.drops, undefined, now);
  }
  return NextResponse.json({
    ok: true,
    ref: res.ref,
    listings: res.listings,
    totalDecayed: res.totalDecayed,
    notified,
  });
}
