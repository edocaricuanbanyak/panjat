/**
 * Polar (Merchant-of-Record) gateway — the global/USD deployment's payment
 * gateway (the default when MARKET=global). Selected with PAYMENT_GATEWAY=polar.
 *
 * Webhook: Polar follows the Standard Webhooks spec (svix-style). Three headers
 * carry the proof — `webhook-id`, `webhook-timestamp`, `webhook-signature` —
 * and the signed content is `${id}.${timestamp}.${rawBody}`. The secret is a
 * base64 value (usually `whsec_…`); the signature is base64(HMAC-SHA256) and the
 * header holds a space-delimited list of `v1,<sig>` entries. `verifyAndParse`
 * checks that (constant-time) then normalizes the event.
 *
 * Our order id (mnjt_<uuid>) is round-tripped through Polar `metadata` so
 * settlement stays idempotent per order_id — Polar's own order id is recorded
 * in the raw payload but is never the idempotency key. We do NOT range-check the
 * timestamp: a replayed webhook maps to the same order_id and settle() is
 * idempotent (same contract the Midtrans path relies on).
 *
 * Polar returns a HOSTED checkout URL — we surface it as `redirectUrl`, so the
 * wizard just navigates (the same branch Midtrans uses); no client-side JS SDK ships.
 *
 * NOTE (validate before go-live):
 *  - Secret encoding: this decodes the base64 secret per the Standard Webhooks
 *    spec (stripping a `whsec_` prefix). Confirm against Polar's live signature.
 *  - Arbitrary amount: grip = board-top + 1 minor unit, so the Polar product
 *    must allow a custom / "pay what you want" price passed as `amount` at
 *    checkout creation. Confirm against the current Polar API.
 *  - Field names: `POST /v1/checkouts/` body (`products`/`amount`/`metadata`/
 *    `success_url`/`customer_email`), the success event name (`order.paid`),
 *    which order field equals the grip we set (`data.amount`, tax-exclusive),
 *    and that checkout `metadata` propagates onto the order — all to be verified.
 *  Until POLAR_ACCESS_TOKEN + POLAR_PRODUCT_ID are set, checkout falls back to a
 *  local mock page, so the flow is exercisable offline exactly like Midtrans.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import type { SnapClient } from "@/lib/midtrans";
import { BASE_URL } from "@/lib/site";
import type { NormalizedNotification, RawWebhook, WebhookGateway } from "./types";

// Only a paid order confirms money. Everything else normalizes to "pending"
// (Polar has no distinct "payment failed" order event — failed checkouts simply
// never produce a paid order). Kept as a set so more success aliases can be added.
const SUCCESS_EVENTS = new Set(["order.paid"]);

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

/** Compute the Standard Webhooks base64(HMAC-SHA256) over `${id}.${ts}.${body}`
 *  (also used by tests). The secret is base64 (with an optional `whsec_` prefix). */
export function signPolar(msgId: string, ts: string, body: string, secret: string): string {
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  return createHmac("sha256", key).update(`${msgId}.${ts}.${body}`).digest("base64");
}

function verifyPolarSignature(raw: RawWebhook, secret: string): boolean {
  const id = raw.headers.get("webhook-id");
  const ts = raw.headers.get("webhook-timestamp");
  const header = raw.headers.get("webhook-signature");
  if (!id || !ts || !header) return false;

  const expected = signPolar(id, ts, raw.body, secret);
  const expBuf = Buffer.from(expected, "utf8");
  // The header is a space-delimited list of `v<version>,<base64sig>` entries;
  // accept if ANY entry matches (constant-time per candidate).
  return header.split(" ").some((part) => {
    const comma = part.indexOf(",");
    const sig = comma >= 0 ? part.slice(comma + 1) : part;
    const sigBuf = Buffer.from(sig, "utf8");
    return sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf);
  });
}

export const polarWebhookGateway: WebhookGateway = {
  verifyAndParse(raw: RawWebhook): NormalizedNotification | null {
    const secret = process.env.POLAR_WEBHOOK_SECRET?.trim() ?? "";
    if (!secret || !verifyPolarSignature(raw, secret)) return null;

    let evt: PolarEvent;
    try {
      evt = JSON.parse(raw.body) as PolarEvent;
    } catch {
      return null;
    }
    const orderId = evt.data?.metadata?.order_id;
    if (!orderId) return null; // no idempotency key → cannot settle safely

    const type = evt.type ?? "";
    const status = SUCCESS_EVENTS.has(type) ? "success" : "pending";

    // Polar amounts are integer minor units (e.g. 500 = $5.00).
    const amountMinor = Math.round(Number(evt.data?.amount) || 0);

    return {
      orderId,
      amountMinor,
      status,
      rawStatus: type,
      method: evt.data?.payment_processor,
      raw: evt,
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
