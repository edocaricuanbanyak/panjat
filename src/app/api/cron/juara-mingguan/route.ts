import { NextResponse } from "next/server";
import { db } from "@/db";
import { simpanJuaraMingguan } from "@/domain/juara-mingguan";
import { assertCron } from "@/lib/cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Weekly at the Friday 00:00 WIB cut-off: snapshot the week's champions (board
 * #1/#2/#3, Terfavorit, Kaki Tiang) into the archive (H); the card is posted to
 * Threads/TikTok each Friday. WIB is UTC+7, so schedule this on cron-job.org at
 * 17:05 UTC Thursday (`5 17 * * 4`) — a few minutes past the cut-off.
 */
export async function GET(req: Request) {
  const auth = assertCron(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const res = await simpanJuaraMingguan(db, new Date());
  return NextResponse.json({ ok: true, ...res });
}
