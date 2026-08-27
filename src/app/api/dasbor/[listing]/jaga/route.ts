import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { jagaPosisi } from "@/db/schema";
import { ownsListing } from "@/domain/dashboard";
import { currentKontak } from "@/lib/session";

export const runtime = "nodejs";

const TARGETS = new Set(["top1", "top3", "top10"]);

/**
 * POST /api/dasbor/[listing]/jaga — set/update Jaga Posisi (§13.1). Owner picks a
 * target tier and adds to the budget cap; toggles on/off. The auto top-up itself
 * runs from /api/cron/jaga-posisi and settles via the verified webhook.
 */
export async function POST(req: Request, { params }: { params: Promise<{ listing: string }> }) {
  const kontakId = await currentKontak();
  if (!kontakId) return NextResponse.json({ error: "Tidak sah" }, { status: 401 });

  const { listing: id } = await params;
  if (!(await ownsListing(db, id, kontakId))) {
    return NextResponse.json({ error: "Tidak sah" }, { status: 403 });
  }

  let body: { target?: unknown; tambahBudget?: unknown; aktif?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }
  const target = String(body.target ?? "");
  if (!TARGETS.has(target)) {
    return NextResponse.json({ error: "Target tidak dikenal" }, { status: 400 });
  }
  const tambah = Math.max(0, Math.floor(Number(body.tambahBudget) || 0));
  const aktif = body.aktif !== false;

  await db
    .insert(jagaPosisi)
    .values({ listingId: id, target, budgetSisa: tambah, aktif })
    .onConflictDoUpdate({
      target: jagaPosisi.listingId,
      set: { target, aktif, budgetSisa: sql`${jagaPosisi.budgetSisa} + ${tambah}` },
    });

  return NextResponse.json({ ok: true });
}
