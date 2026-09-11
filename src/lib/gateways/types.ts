/**
 * Payment gateway abstraction. The domain layer (settle()) is gateway-agnostic:
 * it consumes a NormalizedNotification and never knows which provider produced
 * it. Each gateway is responsible for (a) creating a checkout and (b) verifying
 * a raw webhook and normalizing it — signature verification lives in the
 * gateway, everything money-critical (idempotency, amount-match, grip grant,
 * advisory-lock serialization) stays in the domain.
 */

/** Provider-neutral outcome of a payment event. */
export type GatewayStatus = "success" | "failure" | "pending" | "unknown";

/** A webhook normalized to the fields the domain needs. */
export interface NormalizedNotification {
  /** Our order id (mnjt_<uuid>) — the idempotency + replay key. */
  orderId: string;
  /** Gross amount as integer minor units of the deployment currency. */
  amountMinor: number;
  /** Provider-neutral status. */
  status: GatewayStatus;
  /** The provider's raw status string, kept for audit/logging. */
  rawStatus: string;
  /** Payment method, stored in transaksi.metode (optional). */
  method?: string;
  /** The full raw payload, stored in transaksi.raw_payload. */
  raw: unknown;
}

/** A raw inbound webhook: raw body bytes (for HMAC) + headers. */
export interface RawWebhook {
  body: string;
  headers: Headers;
}

/** Verifies + normalizes a webhook. Returns null on a bad/forged signature. */
export interface WebhookGateway {
  verifyAndParse(raw: RawWebhook): NormalizedNotification | null;
}
