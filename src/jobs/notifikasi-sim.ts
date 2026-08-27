/**
 * Offline simulation of disalip notifications (R3): guardrails + webhook-driven
 * detection. Run after db:seed. Uses fake senders (no email/WA provider).
 */
import { and, eq } from "drizzle-orm";
import { db, pool } from "@/db";
import { listing, notifikasiLog, sponsorKontak } from "@/db/schema";
import { createOrTopUp } from "@/domain/manjat";
import { notifyDrops, type Drop } from "@/domain/notifikasi";
import { applyNotification } from "@/domain/webhook";
import {
  midtransConfig,
  signNotification,
  type MidtransNotification,
  type SnapClient,
} from "@/lib/midtrans";
import { signUnsub, verifyUnsub, type Senders } from "@/lib/notify";

const KEY = midtransConfig().serverKey;
const fakeSnap: SnapClient = { async createTransaction() { return { token: "t", redirectUrl: "/x" }; } };

let emailCount = 0;
let waCount = 0;
const fake: Senders = {
  email: { async send() { emailCount++; return { ok: true }; } },
  wa: { async send() { waCount++; return { ok: true }; } },
};

const DAY = new Date("2026-08-27T05:00:00Z"); // 12:00 WIB
const NIGHT = new Date("2026-08-27T16:00:00Z"); // 23:00 WIB

let passed = 0;
function check(name: string, cond: boolean) {
  if (!cond) throw new Error(`FAIL: ${name}`);
  passed++;
  console.log(`  ✓ ${name}`);
}

async function idFor(url: string) {
  const [l] = await db.select({ id: listing.id, kontakId: listing.kontakId }).from(listing).where(eq(listing.urlNormal, url)).limit(1);
  return l;
}
async function logRows(kontakId: string) {
  const rows = await db.select({ id: notifikasiLog.id }).from(notifikasiLog).where(and(eq(notifikasiLog.kontakId, kontakId), eq(notifikasiLog.jenis, "disalip")));
  return rows.length;
}
const drop = (listingId: string): Drop => ({ listingId, fromRank: 1, toRank: 2, thresholdLost: 1 });

async function main() {
  const [existing] = await db
    .select({ id: notifikasiLog.id })
    .from(notifikasiLog)
    .where(eq(notifikasiLog.jenis, "disalip"))
    .limit(1);
  if (existing) throw new Error("sudah ada data sim — jalankan 'pnpm db:seed' dulu");

  console.log("guardrails:");
  const warung = await idFor("warungku.app");
  const r1 = await notifyDrops(db, [drop(warung.id)], fake, DAY);
  check("day drop → sent", r1.sent === 1 && emailCount === 1 && waCount === 1);
  check("2 notifikasi_log rows (email+wa)", (await logRows(warung.kontakId!)) === 2);

  const r2 = await notifyDrops(db, [drop(warung.id)], fake, DAY);
  check("1/24h cap → suppressed", r2.sent === 0 && r2.suppressed === 1);
  check("no new rows, no new sends", (await logRows(warung.kontakId!)) === 2 && emailCount === 1);

  const sinta = await idFor("sinta.ai");
  const r3 = await notifyDrops(db, [drop(sinta.id)], fake, NIGHT);
  check("night pause → suppressed", r3.sent === 0 && (await logRows(sinta.kontakId!)) === 0);

  const ngoding = await idFor("ngoding.id");
  const kontakId = verifyUnsub(signUnsub(ngoding.kontakId!));
  check("unsub token round-trips", kontakId === ngoding.kontakId);
  await db.update(sponsorKontak).set({ notifOptOut: true }).where(eq(sponsorKontak.id, ngoding.kontakId!));
  const r4 = await notifyDrops(db, [drop(ngoding.id)], fake, DAY);
  check("opt-out → suppressed", r4.sent === 0 && (await logRows(ngoding.kontakId!)) === 0);

  console.log("webhook-driven (top-up overtake):");
  const nyala = await idFor("nyala.id");
  // A top-up on an existing listing (baru=false) can instantly take #1 — a brand
  // new ≥Rp100k listing would be held for review instead (§R8), overtaking no one.
  const c = await createOrTopUp(db, fakeSnap, { url: "https://warungku.app", nama: "Warungku POS", email: "warungkuapp@example.id", nominal: 45_000 });
  const fields = { order_id: c.orderId, status_code: "200", gross_amount: "45000.00" };
  const notif: MidtransNotification = { ...fields, transaction_status: "settlement", signature_key: signNotification(fields, KEY) };
  const outcome = await applyNotification(db, notif, KEY);
  check("settled", outcome.status === "settled");
  check(
    "top-up drops the old #1 (Nyala lost puncak)",
    outcome.status === "settled" && outcome.drops.some((d) => d.listingId === nyala.id && d.thresholdLost === 1),
  );
  const before = emailCount;
  if (outcome.status === "settled") await notifyDrops(db, outcome.drops, fake, DAY);
  check("notified the demoted sponsor(s)", emailCount > before);

  console.log(`\nAll ${passed} checks passed.`);
  await pool.end();
}

main().catch(async (err) => {
  console.error(`\n${err instanceof Error ? err.message : err}`);
  await pool.end();
  process.exit(1);
});
