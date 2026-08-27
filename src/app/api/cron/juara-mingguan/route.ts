import { NextResponse } from "next/server";
import { db } from "@/db";
import { simpanJuaraMingguan } from "@/domain/juara-mingguan";
import { assertCron } from "@/lib/cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Weekly at the Monday 00:00 WIB reset: snapshot the week's champions (board
 * #1/#2/#3, Terfavorit, Kaki Tiang) into the archive (H). WIB is UTC+7, so run
 * at 17:05 UTC Sunday (`5 17 * * 0`, see vercel.json).
 */
export async function GET(req: Request) {
  const auth = assertCron(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const res = await simpanJuaraMingguan(db, new Date());
  return NextResponse.json({ ok: true, ...res });
}
