/**
 * Polar (Merchant-of-Record) gateway — the global/USD deployment's payment
 * gateway (the default when MARKET=global). Selected with PAYMENT_GATEWAY=polar.
 *
 * Webhook: verified with Polar's OFFICIAL validator, `validateEvent` from
 * `@polar-sh/sdk/webhooks` (Standard Webhooks / svix) — so the signature +
 * timestamp check is Polar's own reference implementation, not a hand-rolled one.
 * It throws `WebhookVerificationError` on a bad/forged/stale signature and returns
 * the parsed event otherwise. Note: Standard Webhooks enforces a ±5-min timestamp
 * tolerance; a retry delivered long after the original send (same signed payload)
 * is rejected — settle()'s per-order idempotency remains the replay guard.
 *
 * Our order id (mnjt_<uuid>) is round-tripped through Polar `metadata` so
 * settlement stays idempotent per order_id — Polar's own order id is recorded in
 * the raw payload but is never the idempotency key.
 *
 * Polar returns a HOSTED checkout URL — we surface it as `redirectUrl`, so the
 * wizard just navigates (the same branch Midtrans uses); no client-side JS SDK ships.
 *
 * NOTE (validate before go-live):
 *  - Arbitrary amount: grip = board-top + 1 minor unit, so the Polar product
 *    must allow a custom / "pay what you want" price passed as `amount` at
 *    checkout creation. Confirm against the current Polar API.
 *  - Field names: `POST /v1/checkouts/` body (`products`/`amount`/`metadata`/
 *    `success_url`/`customer_email`), which order field equals the grip we set
 *    (`data.amount`, tax-exclusive), and that checkout `metadata` propagates onto
 *    the order — all to be verified.
 *  Until POLAR_ACCESS_TOKEN + POLAR_PRODUCT_ID are set, checkout falls back to a
 *  local mock page, so the flow is exercisable offline exactly like Midtrans.
 */
import { createHmac } from "node:crypto";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import type { SnapClient } from "@/lib/midtrans";
import { BASE_URL } from "@/lib/site";
import type { RawWebhook, VerifyResult, WebhookGateway } from "./types";

// Only a paid order confirms money. `order.refunded` reverses grip (settle handles
// it). Everything else normalizes to "pending" (Polar has no distinct "payment
// failed" order event — failed checkouts simply never produce a paid order).
const SUCCESS_EVENTS = new Set(["order.paid"]);
const REFUND_EVENTS = new Set(["order.refunded"]);

interface PolarEvent {
  type?: string;
  data?: {
    id?: string;
    status?: string;
    /** Net product amount in minor units — the price we set (the grip). */
    amount?: number;
    metadata?: { order_id?: string } | null;
    payment_processor?: string;
  };
}

/** Sign a payload the way `@polar-sh/sdk`'s `validateEvent` verifies it — base64
 *  HMAC-SHA256 over `${id}.${ts}.${body}` with the key = the UTF-8 bytes of the
 *  raw secret string (the SDK does `Webhook(base64(utf8(secret)))`). Used only by
 *  tests / `polar:sim` to produce signatures the SDK accepts — never on the
 *  receive path (Polar signs live webhooks). */
export function signPolar(msgId: string, ts: string, body: string, secret: string): string {
  const key = Buffer.from(secret, "utf8");
  return createHmac("sha256", key).update(`${msgId}.${ts}.${body}`).digest("base64");
}

/** Incoming request headers as a plain record for the SDK validator. */
function headersRecord(h: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  h.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

export const polarWebhookGateway: WebhookGateway = {
  verifyAndParse(raw: RawWebhook): VerifyResult {
    const secret = process.env.POLAR_WEBHOOK_SECRET?.trim() ?? "";
    if (!secret) return { status: "invalid" };

    // Verify with Polar's official validator (authoritative signature + timestamp).
    try {
      validateEvent(raw.body, headersRecord(raw.headers), secret);
    } catch (e) {
      if (e instanceof WebhookVerificationError) return { status: "invalid" };
      // Signature verified, but the SDK's strict schema parse failed (a future
      // payload shape or a non-order event). The webhook is authentic — extract
      // what we need from the raw JSON below rather than dropping it.
    }

    let evt: PolarEvent;
    try {
      evt = JSON.parse(raw.body) as PolarEvent;
    } catch {
      return { status: "ignored" }; // authentic but unusable payload
    }
    const orderId = evt.data?.metadata?.order_id;
    if (!orderId) return { status: "ignored" }; // no idempotency key → nothing to settle

    const type = evt.type ?? "";
    const status = SUCCESS_EVENTS.has(type)
      ? "success"
      : REFUND_EVENTS.has(type)
        ? "refunded"
        : "pending";

    // Polar amounts are integer minor units (e.g. 500 = $5.00).
    const amountMinor = Math.round(Number(evt.data?.amount) || 0);

    return {
      status: "ok",
      notification: {
        orderId,
        amountMinor,
        status,
        rawStatus: type,
        method: evt.data?.payment_processor,
        raw: evt,
      },
    };
  },
};

const POLAR_MOCK: SnapClient = {
  async createTransaction({ orderId, grossAmount }) {
    return {
      token: `polar-mock-${orderId}`,
      redirectUrl: `/manjat/bayar-mock?order_id=${encodeURIComponent(orderId)}&nominal=${grossAmount}`,
    };
  },
};

/** Real Polar checkout: create a hosted checkout session carrying our order id
 *  in metadata and a custom amount (the grip). Returns the hosted URL to redirect
 *  to — no client SDK. */
export const polarCheckoutClient: SnapClient = {
  async createTransaction({ orderId, grossAmount, email }) {
    const token = process.env.POLAR_ACCESS_TOKEN?.trim();
    const productId = process.env.POLAR_PRODUCT_ID?.trim();
    if (!token || !productId) return POLAR_MOCK.createTransaction({ orderId, grossAmount, email });

    const base =
      process.env.POLAR_ENV === "production"
        ? "https://api.polar.sh"
        : "https://sandbox-api.polar.sh";

    const res = await fetch(`${base}/v1/checkouts/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        products: [productId],
        // Custom per-order amount (grip). The product's price must be "pay what
        // you want" / custom for this to be accepted.
        amount: grossAmount,
        metadata: { order_id: orderId },
        // Polar redirects here after payment; grip still activates only via the
        // verified webhook, exactly like the other gateways.
        success_url: `${BASE_URL}/manjat/selesai?order=${orderId}`,
        ...(email ? { customer_email: email } : {}),
      }),
    });
    if (!res.ok) {
      throw new Error(`Polar checkout error ${res.status}: ${await res.text()}`);
    }
    const json = (await res.json()) as { id?: string; url?: string };
    if (!json.id || !json.url) throw new Error("Polar: checkout created without id/url");
    // Non-empty redirectUrl → the wizard navigates to Polar's hosted checkout (no overlay).
    return { token: json.id, redirectUrl: json.url };
  },
};
