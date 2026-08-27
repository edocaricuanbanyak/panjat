import { NextResponse } from "next/server";
import { db } from "@/db";
import { executeJaga, planJaga } from "@/domain/jaga";
import { assertCron } from "@/lib/cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Jaga Posisi worker (§13.1, F4). Tops up listings that have slipped below their
 * target tier, within each config's budget. Charges settle via the verified
 * webhook path (grip never mutated directly). Processed serially so tie-ordering
 * stays decided by commit order (R2). Schedule after the hourly rosot.
 */
export async function GET(req: Request) {
  const auth = assertCron(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const plans = await planJaga(db);
  const results: { listingId: string; nominal: number; ok: boolean }[] = [];
  for (const plan of plans) {
    const ok = await executeJaga(db, plan);
    results.push({ listingId: plan.listingId, nominal: plan.nominal, ok });
  }

  const spent = results.filter((r) => r.ok).reduce((s, r) => s + r.nominal, 0);
  return NextResponse.json({ ok: true, topups: results.filter((r) => r.ok).length, spent, results });
}
