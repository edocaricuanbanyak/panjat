/**
 * Midtrans Snap integration (§17.4). Signature verification and amount parsing
 * are pure and unit-tested; the HTTP call is isolated behind SnapClient so the
 * manjat flow can be exercised offline with a fake.
 */
import { createHash, timingSafeEqual } from "node:crypto";

/** Fields of a Midtrans HTTP notification we rely on. */
export interface MidtransNotification {
  order_id: string;
  status_code: string;
  gross_amount: string; // e.g. "30000.00"
  signature_key: string;
  transaction_status: string; // settlement | capture | pending | expire | cancel | deny | failure | refund
  fraud_status?: string; // accept | challenge | deny
  payment_type?: string;
  transaction_id?: string;
}

export interface MidtransConfig {
  serverKey: string;
  isProduction: boolean;
  base: string;
}

export function midtransConfig(): MidtransConfig {
  const serverKey = process.env.MIDTRANS_SERVER_KEY ?? "";
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
  return {
    serverKey,
    isProduction,
    base: isProduction ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com",
  };
}

/**
 * §18.3: signature_key = sha512(order_id + status_code + gross_amount + serverKey).
 * Constant-time comparison; false on any length/format mismatch.
 */
export function verifySignature(notif: MidtransNotification, serverKey: string): boolean {
  const expected = createHash("sha512")
    .update(notif.order_id + notif.status_code + notif.gross_amount + serverKey)
    .digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(notif.signature_key ?? "", "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Compute the signature for a notification (used by tests and the offline sim). */
export function signNotification(
  fields: Pick<MidtransNotification, "order_id" | "status_code" | "gross_amount">,
  serverKey: string,
): string {
  return createHash("sha512")
    .update(fields.order_id + fields.status_code + fields.gross_amount + serverKey)
    .digest("hex");
}

/** "30000.00" -> 30000 (integer rupiah). Throws on non-numeric input. */
export function parseGrossAmount(gross: string): number {
  const n = Number(gross);
  if (!Number.isFinite(n)) throw new Error(`gross_amount tidak valid: ${gross}`);
  return Math.round(n);
}

export interface SnapCreateParams {
  orderId: string;
  grossAmount: number;
  email?: string;
  expiryMinutes?: number;
}

export interface SnapResult {
  token: string;
  redirectUrl: string;
}

export interface SnapClient {
  createTransaction(params: SnapCreateParams): Promise<SnapResult>;
}

/** <Rp25.000 → QRIS/e-wallet only; otherwise all methods (R2). */
function enabledPaymentsFor(amount: number): string[] | undefined {
  if (amount < 25_000) return ["qris", "gopay", "shopeepay", "other_qris"];
  return undefined; // all enabled
}

/** Dev-only mock (MIDTRANS_MOCK=true): skip Midtrans, point at a local mock-pay page. */
export function isMock(): boolean {
  return process.env.MIDTRANS_MOCK === "true";
}

export const mockSnapClient: SnapClient = {
  async createTransaction({ orderId, grossAmount }) {
    return {
      token: `mock-${orderId}`,
      redirectUrl: `/manjat/bayar-mock?order_id=${encodeURIComponent(orderId)}&nominal=${grossAmount}`,
    };
  },
};

/** Default client: real Snap API (sandbox unless MIDTRANS_IS_PRODUCTION=true). */
export const midtransSnapClient: SnapClient = {
  async createTransaction({ orderId, grossAmount, email, expiryMinutes = 60 }) {
    const { serverKey, base } = midtransConfig();
    if (!serverKey) throw new Error("MIDTRANS_SERVER_KEY belum diset");
    const auth = Buffer.from(`${serverKey}:`).toString("base64");
    const enabled = enabledPaymentsFor(grossAmount);

    const res = await fetch(`${base}/snap/v1/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        transaction_details: { order_id: orderId, gross_amount: grossAmount },
        ...(email ? { customer_details: { email } } : {}),
        expiry: { unit: "minutes", duration: expiryMinutes },
        ...(enabled ? { enabled_payments: enabled } : {}),
      }),
    });
    if (!res.ok) {
      throw new Error(`Midtrans Snap error ${res.status}: ${await res.text()}`);
    }
    const json = (await res.json()) as { token: string; redirect_url: string };
    return { token: json.token, redirectUrl: json.redirect_url };
  },
};
