/**
 * Offline simulation of moderation (R8). Exercises layer-1 screening on settle
 * and the layer-2 AI pass with an injected fake moderator. Run after db:seed.
 */
import { eq, and } from "drizzle-orm";
import { db, pool } from "@/db";
import { listing, moderasiLog, peganganLedger } from "@/db/schema";
import { createOrTopUp } from "@/domain/manjat";
import { approveListing, moderateWithAI } from "@/domain/moderasi";
import { applyNotification } from "@/domain/webhook";
import {
  midtransConfig,
  signNotification,
  type MidtransNotification,
  type SnapClient,
} from "@/lib/midtrans";
import type { AiModerator } from "@/lib/anthropic";

const KEY = midtransConfig().serverKey;
const fakeSnap: SnapClient = {
  async createTransaction() {
    return { token: "t", redirectUrl: "/x" };
  },
};
const alwaysTolak: AiModerator = { async classify() { return { verdict: "tolak", alasan: "uji" }; } };
const alwaysLolos: AiModerator = { async classify() { return { verdict: "lolos", alasan: "uji" }; } };

let passed = 0;
function check(name: string, cond: boolean) {
  if (!cond) throw new Error(`FAIL: ${name}`);
  passed++;
  console.log(`  ✓ ${name}`);
}

async function settle(orderId: string, nominal: number) {
  const fields = { order_id: orderId, status_code: "200", gross_amount: `${nominal}.00` };
  const notif: MidtransNotification = {
    ...fields,
    transaction_status: "settlement",
    signature_key: signNotification(fields, KEY),
  };
  return applyNotification(db, notif, KEY);
}

async function create(url: string, nama: string, nominal: number) {
  const r = await createOrTopUp(db, fakeSnap, { url, nama, email: "mod@example.id", nominal });
  await settle(r.orderId, nominal);
  return r.listingId;
}

async function statusOf(id: string) {
  const [l] = await db.select({ s: listing.status, g: listing.peganganCached }).from(listing).where(eq(listing.id, id)).limit(1);
  return l;
}
async function refundCount(id: string) {
  const rows = await db.select({ id: peganganLedger.id }).from(peganganLedger).where(and(eq(peganganLedger.listingId, id), eq(peganganLedger.jenis, "refund")));
  return rows.length;
}
async function logCount(id: string, aktor: "ai" | "sistem" | "manusia", keputusan: string) {
  const rows = await db.select({ id: moderasiLog.id }).from(moderasiLog).where(and(eq(moderasiLog.listingId, id), eq(moderasiLog.aktor, aktor), eq(moderasiLog.keputusan, keputusan)));
  return rows.length;
}

async function main() {
  const [dup] = await db.select({ id: listing.id }).from(listing).where(eq(listing.urlNormal, "slotsim.id")).limit(1);
  if (dup) throw new Error("sudah ada data sim — jalankan 'pnpm db:seed' dulu");

  console.log("layer 1 (on settle):");
  const bersih1 = await create("https://bersihsatu.id", "Bersih Satu", 10_000);
  check("clean → tayang", (await statusOf(bersih1)).s === "tayang");
  check("clean → lolos logged", (await logCount(bersih1, "sistem", "lolos")) === 1);

  const judi = await create("https://slotsim.id", "Slot Gacor Maxwin", 10_000);
  const js = await statusOf(judi);
  check("judi → ditolak", js.s === "ditolak");
  check("judi → grip refunded to 0", js.g === 0);
  check("judi → refund ledger row", (await refundCount(judi)) === 1);
  check("judi → sistem tolak logged", (await logCount(judi, "sistem", "tolak")) === 1);

  const pinjol = await create("https://pinjolsim.id", "Pinjaman Online Kilat", 10_000);
  check("pinjol → ditahan (ragu)", (await statusOf(pinjol)).s === "ditahan");

  const sultan = await create("https://sultansim.id", "Sultan Corp", 120_000);
  check("clean ≥Rp100k baru → ditahan (manual)", (await statusOf(sultan)).s === "ditahan");

  console.log("layer 2 (AI pass):");
  const bersih2 = await create("https://bersihdua.id", "Bersih Dua", 10_000);
  check("AI lolos → stays tayang", (await moderateWithAI(db, bersih2, alwaysLolos)) === "lolos" && (await statusOf(bersih2)).s === "tayang");
  check("AI lolos logged", (await logCount(bersih2, "ai", "lolos")) === 1);

  check("AI tolak → ditolak", (await moderateWithAI(db, bersih1, alwaysTolak)) === "tolak" && (await statusOf(bersih1)).s === "ditolak");
  check("AI tolak → grip refunded", (await statusOf(bersih1)).g === 0);

  console.log("human queue:");
  await approveListing(db, sultan);
  check("approve ditahan → tayang", (await statusOf(sultan)).s === "tayang");

  console.log(`\nAll ${passed} checks passed.`);
  await pool.end();
}

main().catch(async (err) => {
  console.error(`\n${err instanceof Error ? err.message : err}`);
  await pool.end();
  process.exit(1);
});
