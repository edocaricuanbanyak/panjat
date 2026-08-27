import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { transaksi } from "@/db/schema";
import { applyNotification } from "@/domain/webhook";
import {
  isMock,
  midtransConfig,
  signNotification,
  type MidtransNotification,
} from "@/lib/midtrans";

export const runtime = "nodejs";

/**
 * DEV ONLY (MIDTRANS_MOCK=true). Simulates a Midtrans settlement notification for
 * an order — crafts a correctly-signed payload server-side and runs it through
 * the real webhook path, so the full manjat flow is demoable without Midtrans.
 */
export async function POST(req: Request) {
  if (!isMock()) return NextResponse.json({ error: "not found" }, { status: 404 });

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

  const { serverKey } = midtransConfig();
  const fields = { order_id: orderId, status_code: "200", gross_amount: `${t.nominal}.00` };
  const notif: MidtransNotification = {
    ...fields,
    transaction_status: "settlement",
    payment_type: "qris",
    signature_key: signNotification(fields, serverKey),
  };

  const outcome = await applyNotification(db, notif, serverKey);
  return NextResponse.json(outcome);
}
