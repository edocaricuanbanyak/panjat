import { NextResponse } from "next/server";
import { db } from "@/db";
import { getWebhookGateway } from "@/lib/gateways";
import { notifyDrops } from "@/domain/notifikasi";
import { settle } from "@/domain/webhook";
import { pushAktivitas } from "@/lib/aktivitas";

export const runtime = "nodejs";

/**
 * POST /api/webhook/polar — Polar (Merchant-of-Record) webhook. Polar signs the
 * RAW body (Standard Webhooks), so we must read text() before verifying (never
 * req.json()). Grip is granted only via settle(), same contracts as the
 * Midtrans path.
 */
export async function POST(req: Request) {
  const gateway = getWebhookGateway();
  if (!gateway) {
    // This deployment is not configured for a generic-webhook gateway (Polar).
    return NextResponse.json({ error: "gateway tidak aktif" }, { status: 404 });
  }

  const body = await req.text();
  const n = gateway.verifyAndParse({ body, headers: req.headers });
  if (!n) {
    return NextResponse.json({ status: "rejected", reason: "bad_signature" }, { status: 401 });
  }

  const outcome = await settle(db, n);

  if (outcome.status === "rejected") {
    // settle only returns rejected for an unknown order (signature already ok).
    return NextResponse.json(outcome, { status: 404 });
  }
  // Notify anyone pushed out of a threshold by this payment (R3), post-commit.
  if (outcome.status === "settled") {
    if (outcome.drops.length > 0) await notifyDrops(db, outcome.drops);
    if (outcome.nama) {
      await pushAktivitas({
        jenis: "naik",
        nama: outcome.nama,
        id: outcome.listingId,
        rank: outcome.rank ?? undefined,
      });
    }
  }
  return NextResponse.json(outcome, { status: 200 });
}
