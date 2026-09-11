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
    details?: { totals?: { grand_total?: string; currency_code?: string } };
    payments?: Array<{ method_details?: { type?: string } }>;
  };
}

/** Parse the `Paddle-Signature` header into { ts, h1 }. */
function parseSignatureHeader(header: string | null): { ts: string; h1: string } | null {
  if (!header) return null;
  const parts = Object.fromEntries(
    header.split(";").map((kv) => {
      const i = kv.indexOf("=");
      return [kv.slice(0, i).trim(), kv.slice(i + 1).trim()];
    }),
  );
  if (!parts.ts || !parts.h1) return null;
  return { ts: parts.ts, h1: parts.h1 };
}

/** Compute Paddle's HMAC-SHA256 over `${ts}:${body}` (also used by tests). */
export function signPaddle(ts: string, body: string, secret: string): string {
  return createHmac("sha256", secret).update(`${ts}:${body}`).digest("hex");
}

function verifyPaddleSignature(raw: RawWebhook, secret: string): boolean {
  const sig = parseSignatureHeader(raw.headers.get("paddle-signature"));
  if (!sig) return false;
  const expected = signPaddle(sig.ts, raw.body, secret);
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(sig.h1, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
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

    // Paddle amounts are already integer minor-unit strings (e.g. "500" = $5.00).
    const grand = evt.data?.details?.totals?.grand_total ?? "";
    const amountMinor = Math.round(Number(grand) || 0);

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
