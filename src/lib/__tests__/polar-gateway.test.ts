import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { polarWebhookGateway, signPolar } from "@/lib/gateways/polar-gateway";
import type { RawWebhook } from "@/lib/gateways/types";

// A Standard-Webhooks secret: `whsec_` + base64 key material.
const SECRET = `whsec_${Buffer.from("polar-test-secret").toString("base64")}`;

function event(over: Record<string, unknown> = {}) {
  return {
    type: "order.paid",
    data: {
      id: "ord_123",
      status: "paid",
      amount: 500,
      metadata: { order_id: "mnjt_abc" },
      payment_processor: "stripe",
      ...over,
    },
  };
}

function raw(body: string, secret = SECRET, id = "msg_1", ts = "1700000000"): RawWebhook {
  const sig = signPolar(id, ts, body, secret);
  return {
    body,
    headers: new Headers({
      "webhook-id": id,
      "webhook-timestamp": ts,
      "webhook-signature": `v1,${sig}`,
    }),
  };
}

beforeEach(() => {
  process.env.POLAR_WEBHOOK_SECRET = SECRET;
});
afterEach(() => {
  delete process.env.POLAR_WEBHOOK_SECRET;
});

describe("polarWebhookGateway.verifyAndParse", () => {
  it("accepts a correctly signed order.paid and normalizes it", () => {
    const body = JSON.stringify(event());
    const n = polarWebhookGateway.verifyAndParse(raw(body));
    expect(n).not.toBeNull();
    expect(n!.orderId).toBe("mnjt_abc");
    expect(n!.amountMinor).toBe(500); // $5.00 in cents, already minor units
    expect(n!.status).toBe("success");
    expect(n!.method).toBe("stripe");
  });

  it("accepts a signature header carrying multiple space-delimited versions", () => {
    const body = JSON.stringify(event());
    const sig = signPolar("msg_1", "1700000000", body, SECRET);
    const req: RawWebhook = {
      body,
      headers: new Headers({
        "webhook-id": "msg_1",
        "webhook-timestamp": "1700000000",
        "webhook-signature": `v1,bogus v1,${sig}`,
      }),
    };
    expect(polarWebhookGateway.verifyAndParse(req)).not.toBeNull();
  });

  it("rejects a tampered body (signature no longer matches)", () => {
    const good = raw(JSON.stringify(event()));
    const tampered: RawWebhook = { body: `${good.body} `, headers: good.headers };
    expect(polarWebhookGateway.verifyAndParse(tampered)).toBeNull();
  });

  it("rejects the wrong secret", () => {
    const body = JSON.stringify(event());
    const other = `whsec_${Buffer.from("other-secret").toString("base64")}`;
    expect(polarWebhookGateway.verifyAndParse(raw(body, other))).toBeNull();
  });

  it("rejects an event missing our order_id (no idempotency key)", () => {
    const body = JSON.stringify(event({ metadata: {} }));
    expect(polarWebhookGateway.verifyAndParse(raw(body))).toBeNull();
  });

  it("maps a non-paid event to pending", () => {
    const evt = event();
    evt.type = "checkout.updated";
    const n = polarWebhookGateway.verifyAndParse(raw(JSON.stringify(evt)));
    expect(n!.status).toBe("pending");
  });

  it("rejects when required headers are absent", () => {
    const body = JSON.stringify(event());
    expect(polarWebhookGateway.verifyAndParse({ body, headers: new Headers() })).toBeNull();
  });

  it("rejects when no secret is configured", () => {
    delete process.env.POLAR_WEBHOOK_SECRET;
    const body = JSON.stringify(event());
    expect(polarWebhookGateway.verifyAndParse(raw(body))).toBeNull();
  });
});
