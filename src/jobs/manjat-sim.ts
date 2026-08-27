/**
 * Offline end-to-end simulation of the manjat + webhook flow (no real Midtrans).
 * Injects a fake SnapClient and crafts notifications signed with the configured
 * MIDTRANS_SERVER_KEY, then asserts DB effects. Run after `pnpm db:seed`.
 */
import { and, eq } from "drizzle-orm";
import { db, pool } from "@/db";
import { listing, moderasiLog, peganganLedger, transaksi } from "@/db/schema";
import { createOrTopUp } from "@/domain/manjat";
import { reconcileGrips } from "@/domain/ledger";
import { applyNotification } from "@/domain/webhook";
import {
  signNotification,
  type MidtransNotification,
  type SnapClient,
} from "@/lib/midtrans";

const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY ?? "";
const URL = "https://simtest.id";
const URL_NORMAL = "simtest.id";

const fakeSnap: SnapClient = {
  async createTransaction() {
    return { token: "fake-snap-token", redirectUrl: "https://sandbox/fake" };
  },
};

function makeNotif(
  orderId: string,
  gross: string,
  transactionStatus = "settlement",
  extra: Partial<MidtransNotification> = {},
): MidtransNotification {
  const base = { order_id: orderId, status_code: "200", gross_amount: gross };
  return {
    ...base,
    transaction_status: transactionStatus,
    signature_key: signNotification(base, SERVER_KEY),
    payment_type: "qris",
    ...extra,
  };
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
  if (!SERVER_KEY) throw new Error("MIDTRANS_SERVER_KEY belum diset (lihat .env.example)");
  if (await listingByUrl()) {
    throw new Error(`${URL_NORMAL} sudah ada — jalankan 'pnpm db:seed' dulu`);
  }

  console.log("A. naik tiang (new URL, Rp30.000)");
  const a = await createOrTopUp(db, fakeSnap, {
    url: URL,
    email: "sim@example.id",
    nama: "Sim Test",
    nominal: 30_000,
  });
  check("mode is naik", a.mode === "naik");
  check("snap token returned", a.token === "fake-snap-token");
  let l = await listingByUrl();
  check("listing is menunggu_bayar", l.status === "menunggu_bayar");
  check("transaksi is pending", (await trxStatus(a.orderId)) === "pending");
  check("no grip granted yet", (await bayarRowCount(l.id)) === 0);

  console.log("B. settlement webhook (valid signature)");
  const b = await applyNotification(db, makeNotif(a.orderId, "30000.00"), SERVER_KEY);
  check("outcome settled", b.status === "settled");
  l = await listingByUrl();
  check("listing now tayang", l.status === "tayang");
  check("pegangan_cached = 30000", l.grip === 30_000);
  check("one bayar ledger row", (await bayarRowCount(l.id)) === 1);
  check("transaksi settlement", (await trxStatus(a.orderId)) === "settlement");

  console.log("C. idempotent replay");
  const c = await applyNotification(db, makeNotif(a.orderId, "30000.00"), SERVER_KEY);
  check("outcome ignored/replay", c.status === "ignored");
  check("still one bayar row", (await bayarRowCount(l.id)) === 1);
  check("grip unchanged", (await listingByUrl()).grip === 30_000);

  console.log("D. rejected notifications");
  const badSig = makeNotif(a.orderId, "30000.00");
  badSig.signature_key = "deadbeef";
  check("bad signature rejected", (await applyNotification(db, badSig, SERVER_KEY)).status === "rejected");
  const unknown = await applyNotification(db, makeNotif("mnjt_ghost", "1000.00"), SERVER_KEY);
  check("unknown order rejected", unknown.status === "rejected");

  console.log("E. amount mismatch → held for review");
  const e = await createOrTopUp(db, fakeSnap, {
    url: URL,
    email: "sim@example.id",
    nominal: 5000,
  });
  check("mode is manjat_lagi", e.mode === "manjat_lagi");
  const held = await applyNotification(db, makeNotif(e.orderId, "9999.00"), SERVER_KEY);
  check("outcome held", held.status === "held");
  check("transaksi perlu_review", (await trxStatus(e.orderId)) === "perlu_review");
  const mlog = await db
    .select({ id: moderasiLog.id })
    .from(moderasiLog)
    .where(eq(moderasiLog.listingId, l.id));
  check("moderasi_log recorded", mlog.length === 1);
  check("no grip from mismatch", (await listingByUrl()).grip === 30_000);

  console.log("F. manjat lagi settles → grip accrues");
  const f = await createOrTopUp(db, fakeSnap, {
    url: URL,
    email: "sim@example.id",
    nominal: 5000,
  });
  const fOut = await applyNotification(db, makeNotif(f.orderId, "5000.00"), SERVER_KEY);
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
