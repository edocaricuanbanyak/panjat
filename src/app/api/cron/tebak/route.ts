import { NextResponse } from "next/server";
import { db } from "@/db";
import { assertCron } from "@/lib/cron";
import { resolveDay, todayWIB } from "@/domain/tebakan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Daily at the 00:00 WIB reset: archive the day's Tebak Juara champion (R7/R16).
 * WIB is UTC+7, so schedule at 17:00 UTC (`0 17 * * *`, see vercel.json).
 */
export async function GET(req: Request) {
  const auth = assertCron(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const tanggal = todayWIB(new Date());
  const championId = await resolveDay(db, tanggal);
  return NextResponse.json({ ok: true, tanggal, championId });
}
