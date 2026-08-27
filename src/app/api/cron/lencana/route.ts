import { NextResponse } from "next/server";
import { db } from "@/db";
import { assertCron } from "@/lib/cron";
import { computeBadges } from "@/domain/lencana";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Nightly: compute + award sponsor badges from position history (R17).
 * Schedule: `0 18 * * *` (01:00 WIB, see vercel.json).
 */
export async function GET(req: Request) {
  const auth = assertCron(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { awarded } = await computeBadges(db);
  return NextResponse.json({ ok: true, awarded });
}
