import { NextResponse } from "next/server";
import { db } from "@/db";
import { notifyDrops } from "@/domain/notifikasi";
import { applyNotification } from "@/domain/webhook";
import { midtransConfig, type MidtransNotification } from "@/lib/midtrans";

export const runtime = "nodejs";

/** POST /api/webhook/midtrans — Midtrans HTTP notification (settlement etc.). */
export async function POST(req: Request) {
  let notif: MidtransNotification;
  try {
    notif = (await req.json()) as MidtransNotification;
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const { serverKey } = midtransConfig();
  const outcome = await applyNotification(db, notif, serverKey);

  if (outcome.status === "rejected") {
    // 401 for a forged signature, 404 for an unknown order.
    const code = outcome.reason === "bad_signature" ? 401 : 404;
    return NextResponse.json(outcome, { status: code });
  }
  // Notify anyone pushed out of a threshold by this payment (R3), post-commit.
  if (outcome.status === "settled" && outcome.drops.length > 0) {
    await notifyDrops(db, outcome.drops);
  }
  // Handled (settled/held/ignored/failed) → 200 so Midtrans stops retrying.
  return NextResponse.json(outcome, { status: 200 });
}
