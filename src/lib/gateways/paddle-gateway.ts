/**
 * Paddle (Merchant-of-Record) gateway — used by the global/USD deployment.
 *
 * Webhook: Paddle signs the RAW body with HMAC-SHA256. The `Paddle-Signature`
 * header is `ts=<unix>;h1=<hex>` where h1 = HMAC(secret, `${ts}:${rawBody}`).
 * `verifyAndParse` verifies that (constant-time) then normalizes the event.
 *
 * Our order id (mnjt_<uuid>) is round-tripped through Paddle `custom_data` so
 * settlement stays idempotent per order_id — Paddle's own transaction id is
 * recorded in the raw payload but is never the idempotency key.
 *
 * NOTE (validate before go-live): arbitrary-amount checkout. Paddle Billing is
 * catalog-oriented; creating a transaction with a per-order custom unit price
 * (grip = board-top + 1 minor unit) must be confirmed against the current
 * Paddle API. Until PADDLE_API_KEY is set the checkout falls back to a local
 * mock page, so the flow is exercisable offline exactly like Midtrans mock.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { MARKET } from "@/lib/market";
import type { SnapClient } from "@/lib/midtrans";
import type { NormalizedNotification, RawWebhook, WebhookGateway } from "./types";

const SUCCESS_EVENTS = new Set(["transaction.completed", "transaction.paid"]);
const FAILURE_EVENTS = new Set(["transaction.canceled", "transaction.payment_failed"]);

interface PaddleEvent {
  event_type?: string;
  data?: {
    id?: string;
    status?: string;
    custom_data?: { order_id?: string } | null;
    details?: { totals?: { subtotal?: string; grand_total?: string; currency_code?: string } };
    payments?: Array<{ method_details?: { type?: string } }>;
  };
}

/** Compute Paddle's HMAC-SHA256 over `${ts}:${body}` (also used by tests). */
export function signPaddle(ts: string, body: string, secret: string): string {
  return createHmac("sha256", secret).update(`${ts}:${body}`).digest("hex");
}

/**
 * Verify the `Paddle-Signature` header (`ts=<unix>;h1=<hex>[;h1=<hex>…]`).
 * During a webhook-secret rotation Paddle sends MULTIPLE `h1` values (one per
 * active secret), so accept if ANY matches our secret (constant-time per
 * candidate) — checking only the last would reject every webhook mid-rotation.
 */
function verifyPaddleSignature(raw: RawWebhook, secret: string): boolean {
  const header = raw.headers.get("paddle-signature");
  if (!header) return false;
  let ts = "";
  const h1s: string[] = [];
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k === "ts") ts = v;
    else if (k === "h1") h1s.push(v);
  }
  if (!ts || h1s.length === 0) return false;
  const expected = Buffer.from(signPaddle(ts, raw.body, secret), "utf8");
  return h1s.some((h1) => {
    const b = Buffer.from(h1, "utf8");
    return b.length === expected.length && timingSafeEqual(expected, b);
  });
}

export const paddleWebhookGateway: WebhookGateway = {
  verifyAndParse(raw: RawWebhook): NormalizedNotification | null {
    const secret = process.env.PADDLE_WEBHOOK_SECRET?.trim() ?? "";
    if (!secret || !verifyPaddleSignature(raw, secret)) return null;

    let evt: PaddleEvent;
    try {
      evt = JSON.parse(raw.body) as PaddleEvent;
    } catch {
      return null;
    }
    const orderId = evt.data?.custom_data?.order_id;
    if (!orderId) return null; // no idempotency key → cannot settle safely

    const type = evt.event_type ?? "";
    const status = SUCCESS_EVENTS.has(type)
      ? "success"
      : FAILURE_EVENTS.has(type)
        ? "failure"
        : "pending";

    // Match on the TAX-EXCLUSIVE subtotal — that's the unit price we set at
    // checkout (= transaksi.nominal). Paddle is a Merchant-of-Record, so
    // grand_total adds VAT/sales tax on top and would make settle()'s exact
    // amount-match reject every taxed payment. Fall back to grand_total only if
    // subtotal is absent. Amounts are integer minor-unit strings ("500" = $5.00).
    const totals = evt.data?.details?.totals;
    const amountStr = totals?.subtotal ?? totals?.grand_total ?? "";
    const amountMinor = Math.round(Number(amountStr) || 0);

    return {
      orderId,
      amountMinor,
      status,
      rawStatus: type,
      method: evt.data?.payments?.[0]?.method_details?.type,
      raw: evt,
    };
  },
};

const PADDLE_MOCK: SnapClient = {
  async createTransaction({ orderId, grossAmount }) {
    return {
      token: `paddle-mock-${orderId}`,
      redirectUrl: `/manjat/bayar-mock?order_id=${encodeURIComponent(orderId)}&nominal=${grossAmount}`,
    };
  },
};

/** Real Paddle checkout: create a transaction with our order id in custom_data. */
export const paddleCheckoutClient: SnapClient = {
  async createTransaction({ orderId, grossAmount, email }) {
    const apiKey = process.env.PADDLE_API_KEY?.trim();
    const productId = process.env.PADDLE_PRODUCT_ID?.trim();
    if (!apiKey || !productId) return PADDLE_MOCK.createTransaction({ orderId, grossAmount, email });

    const base =
      process.env.PADDLE_ENV === "production"
        ? "https://api.paddle.com"
        : "https://sandbox-api.paddle.com";

    // Create a transaction with a NON-CATALOG custom price (arbitrary amount) and
    // our order_id in custom_data. The transaction id is then handed to the
    // client-side Paddle.js overlay (Paddle.Checkout.open({ transactionId })).
    const res = await fetch(`${base}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        items: [
          {
            quantity: 1,
            price: {
              product_id: productId,
              description: `Manjat ${orderId}`,
              unit_price: { amount: String(grossAmount), currency_code: MARKET.currency },
            },
          },
        ],
        custom_data: { order_id: orderId },
        ...(email ? { customer: { email } } : {}),
      }),
    });
    if (!res.ok) {
      throw new Error(`Paddle transaction error ${res.status}: ${await res.text()}`);
    }
    const json = (await res.json()) as { data?: { id?: string } };
    const id = json.data?.id;
    if (!id) throw new Error("Paddle: transaction created without an id");
    // Empty redirectUrl signals the client to open the Paddle.js overlay with `token`.
    return { token: id, redirectUrl: "" };
  },
};
