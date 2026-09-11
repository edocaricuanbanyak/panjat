import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { paddleWebhookGateway, signPaddle } from "@/lib/gateways/paddle-gateway";
import type { RawWebhook } from "@/lib/gateways/types";

const SECRET = "pdl_ntfset_testsecret";

function event(over: Record<string, unknown> = {}) {
  return {
    event_type: "transaction.completed",
    data: {
      id: "txn_123",
      status: "completed",
      custom_data: { order_id: "mnjt_abc" },
      details: { totals: { grand_total: "500", currency_code: "USD" } },
      payments: [{ method_details: { type: "card" } }],
      ...over,
    },
  };
}

function raw(body: string, secret = SECRET, ts = "1700000000"): RawWebhook {
  const h1 = signPaddle(ts, body, secret);
  return { body, headers: new Headers({ "Paddle-Signature": `ts=${ts};h1=${h1}` }) };
}

beforeEach(() => {
  process.env.PADDLE_WEBHOOK_SECRET = SECRET;
});
afterEach(() => {
  delete process.env.PADDLE_WEBHOOK_SECRET;
});

describe("paddleWebhookGateway.verifyAndParse", () => {
  it("accepts a correctly signed completed transaction and normalizes it", () => {
    const body = JSON.stringify(event());
    const n = paddleWebhookGateway.verifyAndParse(raw(body));
    expect(n).not.toBeNull();
    expect(n!.orderId).toBe("mnjt_abc");
    expect(n!.amountMinor).toBe(500); // $5.00 in cents, already minor units
    expect(n!.status).toBe("success");
    expect(n!.method).toBe("card");
  });

  it("rejects a tampered body (signature no longer matches)", () => {
    const good = raw(JSON.stringify(event()));
    const tampered: RawWebhook = { body: good.body + " ", headers: good.headers };
    expect(paddleWebhookGateway.verifyAndParse(tampered)).toBeNull();
  });

  it("rejects the wrong secret", () => {
    const body = JSON.stringify(event());
    expect(paddleWebhookGateway.verifyAndParse(raw(body, "pdl_ntfset_other"))).toBeNull();
  });

  it("rejects an event missing our order_id (no idempotency key)", () => {
    const body = JSON.stringify(event({ custom_data: {} }));
    expect(paddleWebhookGateway.verifyAndParse(raw(body))).toBeNull();
  });

  it("maps failure and pending events", () => {
    const failBody = JSON.stringify(event({}));
    const failEvt = JSON.parse(failBody);
    failEvt.event_type = "transaction.payment_failed";
    const fail = paddleWebhookGateway.verifyAndParse(raw(JSON.stringify(failEvt)));
    expect(fail!.status).toBe("failure");

    const pendEvt = JSON.parse(failBody);
    pendEvt.event_type = "transaction.updated";
    const pend = paddleWebhookGateway.verifyAndParse(raw(JSON.stringify(pendEvt)));
    expect(pend!.status).toBe("pending");
  });

  it("rejects when no secret is configured", () => {
    delete process.env.PADDLE_WEBHOOK_SECRET;
    const body = JSON.stringify(event());
    expect(paddleWebhookGateway.verifyAndParse(raw(body))).toBeNull();
  });
});
