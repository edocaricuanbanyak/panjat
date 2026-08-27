import { describe, expect, it } from "vitest";
import {
  parseGrossAmount,
  signNotification,
  verifySignature,
  type MidtransNotification,
} from "@/lib/midtrans";

const KEY = "SB-Mid-server-testkey";

function notif(over: Partial<MidtransNotification> = {}): MidtransNotification {
  const base = {
    order_id: "mnjt_abc",
    status_code: "200",
    gross_amount: "30000.00",
    transaction_status: "settlement",
    ...over,
  };
  return {
    ...base,
    signature_key: over.signature_key ?? signNotification(base, KEY),
  } as MidtransNotification;
}

describe("verifySignature", () => {
  it("accepts a correctly signed notification", () => {
    expect(verifySignature(notif(), KEY)).toBe(true);
  });

  it("rejects a tampered amount", () => {
    const n = notif();
    n.gross_amount = "1.00"; // signature no longer matches
    expect(verifySignature(n, KEY)).toBe(false);
  });

  it("rejects the wrong server key", () => {
    expect(verifySignature(notif(), "SB-Mid-server-otherkey")).toBe(false);
  });

  it("rejects a missing/empty signature", () => {
    expect(verifySignature(notif({ signature_key: "" }), KEY)).toBe(false);
  });
});

describe("parseGrossAmount", () => {
  it("parses Midtrans decimal strings to integer rupiah", () => {
    expect(parseGrossAmount("30000.00")).toBe(30000);
    expect(parseGrossAmount("1000")).toBe(1000);
  });
  it("throws on non-numeric input", () => {
    expect(() => parseGrossAmount("abc")).toThrow();
  });
});
