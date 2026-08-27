import { NextResponse } from "next/server";
import { db } from "@/db";
import { assertCron } from "@/lib/cron";
import { reconcileGrips } from "@/domain/ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Nightly drift alarm (§17.2, non-negotiable): every listing's `pegangan_cached`
 * must equal the sum of its append-only ledger. Any mismatch returns 500 so the
 * scheduler surfaces it as a failed run — the cache is only a sort cache, the
 * ledger is truth. Schedule: `0 19 * * *` (02:00 WIB, see vercel.json).
 */
export async function GET(req: Request) {
  const auth = assertCron(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const mismatches = await reconcileGrips(db);
  if (mismatches.length > 0) {
    console.error(`reconcile: ${mismatches.length} mismatch(es)`, mismatches);
    return NextResponse.json({ ok: false, mismatches }, { status: 500 });
  }
  return NextResponse.json({ ok: true, mismatches: 0 });
}
