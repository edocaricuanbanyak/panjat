/**
 * Offline end-to-end simulation of the Polar webhook -> settle flow (no real
 * Polar, no tunnel, no payment). Creates an order, then feeds a Standard-Webhooks
 * signed `order.paid` through the SAME code the live route uses
 * (polarWebhookGateway.verifyAndParse -> settle) and asserts DB effects. Run
 * after `pnpm db:seed`.
 *
 * Writes test data to the dev DB (a `polarsim.id` listing + its ledger/transaksi
 * rows), so it errors if that listing already exists — re-run `pnpm db:seed` to
 * reset the dev DB before running again (and to clean up afterward).
 *
 * Scope: this proves OUR verify+normalize+settle logic (signature check, order_id
 * idempotency, amount-match, grip grant). It does NOT prove Polar's real signature
 * matches — it signs with the same key it verifies. That last mile is validated by
 * one real sandbox webhook (see docs/DEPLOY-GLOBAL.md, code-validation checklist).
 *
 * POLAR_WEBHOOK_SECRET is used if set (so you can point it at your real secret);
 * otherwise a self-consistent test secret is used.
 */
import { and, eq } from "drizzle-orm";
import { db, pool } from "@/db";
import { listing, moderasiLog, peganganLedger, transaksi } from "@/db/schema";
import { reconcileGrips } from "@/domain/ledger";
import { createOrTopUp } from "@/domain/manjat";
import { settle, type WebhookOutcome } from "@/domain/webhook";
import { polarWebhookGateway, signPolar } from "@/lib/gateways/polar-gateway";
import type { RawWebhook } from "@/lib/gateways/types";
import type { SnapClient } from "@/lib/midtrans";

const PROVIDED_SECRET = process.env.POLAR_WEBHOOK_SECRET?.trim();
const SECRET = PROVIDED_SECRET || `whsec_${Buffer.from("polar-sim-secret").toString("base64")}`;
// verifyAndParse reads POLAR_WEBHOOK_SECRET from the env — make it the same key we
// sign with, so the sim is self-consistent whether or not one was already set.
process.env.POLAR_WEBHOOK_SECRET = SECRET;
const URL = "https://polarsim.id";
const URL_NORMAL = "polarsim.id";

// createOrTopUp needs a checkout client; the return isn't asserted (grip only ever
// activates via the webhook below).
const fakePolarSnap: SnapClient = {
  async createTransaction() {
    return { token: "polar-sim-token", redirectUrl: "" };
  },
};

/** A Polar `order.paid` (or other) event body, with our order_id in metadata. */
function eventBody(orderId: string, amountMinor: number, type = "order.paid"): string {
  return JSON.stringify({
    type,
    data: {
      id: `ord_${orderId}`,
      status: "paid",
      amount: amountMinor,
      metadata: { order_id: orderId },
      payment_processor: "stripe",
    },
  });
}

/** Wrap a body as a Standard-Webhooks signed request (fresh id/timestamp each call). */
function sign(body: string): RawWebhook {
  const id = `msg_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const ts = String(Math.floor(Date.now() / 1000));
  const h1 = signPolar(id, ts, body, SECRET);
  return {
    body,
    headers: new Headers({
      "webhook-id": id,
      "webhook-timestamp": ts,
      "webhook-signature": `v1,${h1}`,
    }),
  };
}

/** The exact live path: verify+normalize the signed webhook, then settle. */
async function deliver(body: string, opts: { tamper?: boolean } = {}): Promise<WebhookOutcome> {
  const raw = sign(body);
  const finalRaw = opts.tamper ? { body: `${raw.body} `, headers: raw.headers } : raw;
  const n = polarWebhookGateway.verifyAndParse(finalRaw);
  if (!n) return { status: "rejected", reason: "bad_signature" };
  return settle(db, n);
}

let passed = 0;
function check(name: string, cond: boolean) {
  if (!cond) throw new Error(`FAIL: ${name}`);
  passed++;
  console.log(`  ✓ ${name}`);
}

async function listingByUrl() {
  const [l] = await db
    .select({ id: listing.id, status: listing.status, grip: listing.peganganCached })
    .from(listing)
    .where(eq(listing.urlNormal, URL_NORMAL))
    .limit(1);
  return l;
}

async function bayarRowCount(listingId: string) {
  const rows = await db
    .select({ id: peganganLedger.id })
    .from(peganganLedger)
    .where(and(eq(peganganLedger.listingId, listingId), eq(peganganLedger.jenis, "bayar")));
  return rows.length;
}

async function trxStatus(orderId: string) {
  const [t] = await db
    .select({ status: transaksi.status })
    .from(transaksi)
    .where(eq(transaksi.orderId, orderId))
    .limit(1);
  return t?.status;
}

async function main() {
  console.log(
    `Using webhook secret: ${PROVIDED_SECRET ? "POLAR_WEBHOOK_SECRET (env)" : "built-in test secret"}`,
  );
  if (await listingByUrl()) {
    throw new Error(`${URL_NORMAL} sudah ada — jalankan 'pnpm db:seed' dulu`);
  }

  console.log("A. naik tiang (new URL, 30000)");
  const a = await createOrTopUp(db, fakePolarSnap, {
    url: URL,
    email: "sim@example.id",
    nama: "Polar Sim",
    nominal: 30_000,
  });
  check("mode is naik", a.mode === "naik");
  let l = await listingByUrl();
  check("listing is menunggu_bayar", l.status === "menunggu_bayar");
  check("transaksi is pending", (await trxStatus(a.orderId)) === "pending");
  check("no grip granted yet", (await bayarRowCount(l.id)) === 0);

  console.log("B. signed order.paid webhook (valid signature)");
  const b = await deliver(eventBody(a.orderId, 30_000));
  check("outcome settled", b.status === "settled");
  l = await listingByUrl();
  check("listing now tayang", l.status === "tayang");
  check("pegangan_cached = 30000", l.grip === 30_000);
  check("one bayar ledger row", (await bayarRowCount(l.id)) === 1);
  check("transaksi settlement", (await trxStatus(a.orderId)) === "settlement");

  console.log("C. idempotent replay (same order paid again)");
  const c = await deliver(eventBody(a.orderId, 30_000));
  check("outcome ignored/replay", c.status === "ignored");
  check("still one bayar row", (await bayarRowCount(l.id)) === 1);
  check("grip unchanged", (await listingByUrl()).grip === 30_000);

  console.log("D. rejected webhooks");
  const tampered = await deliver(eventBody(a.orderId, 30_000), { tamper: true });
  check("tampered body → bad signature", tampered.status === "rejected");
  const ghost = await deliver(eventBody("mnjt_ghost", 1000));
  check("unknown order → rejected", ghost.status === "rejected");

  console.log("E. amount mismatch → held for review");
  const e = await createOrTopUp(db, fakePolarSnap, {
    url: URL,
    email: "sim@example.id",
    nominal: 5000,
  });
  check("mode is manjat_lagi", e.mode === "manjat_lagi");
  const held = await deliver(eventBody(e.orderId, 9999));
  check("outcome held", held.status === "held");
  check("transaksi perlu_review", (await trxStatus(e.orderId)) === "perlu_review");
  const mlog = await db
    .select({ id: moderasiLog.id })
    .from(moderasiLog)
    .where(and(eq(moderasiLog.listingId, l.id), eq(moderasiLog.keputusan, "tahan_transaksi")));
  check("moderasi_log recorded", mlog.length === 1);
  check("no grip from mismatch", (await listingByUrl()).grip === 30_000);

  console.log("F. manjat lagi settles → grip accrues");
  const f = await createOrTopUp(db, fakePolarSnap, {
    url: URL,
    email: "sim@example.id",
    nominal: 5000,
  });
  const fOut = await deliver(eventBody(f.orderId, 5000));
  check("outcome settled", fOut.status === "settled");
  l = await listingByUrl();
  check("pegangan_cached = 35000", l.grip === 35_000);
  check("two bayar rows", (await bayarRowCount(l.id)) === 2);
  check("listing still tayang", l.status === "tayang");

  console.log("G. ledger integrity");
  const mismatches = await reconcileGrips(db);
  check("0 reconcile mismatches", mismatches.length === 0);

  console.log(`\nAll ${passed} checks passed.`);
  await pool.end();
}

main().catch(async (err) => {
  console.error(`\n${err instanceof Error ? err.message : err}`);
  await pool.end();
  process.exit(1);
});
