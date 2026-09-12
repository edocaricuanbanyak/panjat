import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { transaksi } from "@/db/schema";
import { applyNotification, settle, type WebhookOutcome } from "@/domain/webhook";
import { pushAktivitas } from "@/lib/aktivitas";
import { MARKET } from "@/lib/market";
import {
  isMock,
  midtransConfig,
  signNotification,
  type MidtransNotification,
} from "@/lib/midtrans";

export const runtime = "nodejs";

/**
 * True when the active gateway is running in mock mode (no real credentials).
 * A configured WEBHOOK SECRET also disables this endpoint: once real webhook
 * verification exists, grip must come only from the verified webhook — never
 * from this dev shortcut — even if the checkout API key isn't set yet
 * (piecemeal provisioning must not leave a free-grip hole in production).
 */
function checkoutIsMock(): boolean {
  if (MARKET.paymentGateway === "paddle")
    return !process.env.PADDLE_API_KEY?.trim() && !process.env.PADDLE_WEBHOOK_SECRET?.trim();
  if (MARKET.paymentGateway === "polar")
    return !process.env.POLAR_ACCESS_TOKEN?.trim() && !process.env.POLAR_WEBHOOK_SECRET?.trim();
  return isMock(); // Midtrans mock
}

/**
 * DEV ONLY (mock gateway). Simulates a successful settlement for an order and
 * runs it through the real settle path, so the full manjat flow is demoable
 * without a real gateway. Disabled once real credentials are set.
 */
export async function POST(req: Request) {
  if (!checkoutIsMock()) return NextResponse.json({ error: "not found" }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }
  const orderId = (body.order_id ?? body.orderId) as string | undefined;
  if (typeof orderId !== "string") {
    return NextResponse.json({ error: "order_id wajib" }, { status: 400 });
  }

  const [t] = await db
    .select({ nominal: transaksi.nominal })
    .from(transaksi)
    .where(eq(transaksi.orderId, orderId))
    .limit(1);
  if (!t) return NextResponse.json({ error: "order tidak ditemukan" }, { status: 404 });

  let outcome: WebhookOutcome;
  if (MARKET.paymentGateway === "paddle") {
    // Simulate a verified Paddle transaction.completed → gateway-neutral settle.
    outcome = await settle(db, {
      orderId,
      amountMinor: t.nominal,
      status: "success",
      rawStatus: "transaction.completed",
      method: "card",
      raw: { dev: true, event_type: "transaction.completed", order_id: orderId },
    });
  } else if (MARKET.paymentGateway === "polar") {
    // Simulate a verified Polar order.paid → gateway-neutral settle.
    outcome = await settle(db, {
      orderId,
      amountMinor: t.nominal,
      status: "success",
      rawStatus: "order.paid",
      method: "stripe",
      raw: { dev: true, type: "order.paid", data: { metadata: { order_id: orderId } } },
    });
  } else {
    const { serverKey } = midtransConfig();
    const fields = { order_id: orderId, status_code: "200", gross_amount: `${t.nominal}.00` };
    const notif: MidtransNotification = {
      ...fields,
      transaction_status: "settlement",
      payment_type: "qris",
      signature_key: signNotification(fields, serverKey),
    };
    outcome = await applyNotification(db, notif, serverKey);
  }

  if (outcome.status === "settled" && outcome.nama) {
    await pushAktivitas({
      jenis: "naik",
      nama: outcome.nama,
      id: outcome.listingId,
      rank: outcome.rank ?? undefined,
    });
  }
  return NextResponse.json(outcome);
}
