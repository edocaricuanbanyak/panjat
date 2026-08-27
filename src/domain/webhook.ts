/**
 * Midtrans webhook processing (R2, §18.3) — the ONLY place grip is granted.
 * Verifies the signature, matches the invoice amount, is idempotent per
 * order_id, and runs serial per board (shared advisory lock with rosot).
 */
import { eq, sql } from "drizzle-orm";
import type { Database } from "@/db";
import { listing, moderasiLog, transaksi } from "@/db/schema";
import {
  parseGrossAmount,
  verifySignature,
  type MidtransNotification,
} from "@/lib/midtrans";
import { loadRosotConfig } from "./config";
import { BOARD_LOCK_KEY } from "./constants";
import { appendLedger, gripFromLedger } from "./ledger";
import { screenListing } from "./moderasi";
import { detectDrops, type Drop } from "./notifikasi";
import { getRanking } from "./ranking";

export type WebhookOutcome =
  | { status: "rejected"; reason: "bad_signature" | "unknown_order" }
  | { status: "ignored"; reason: "replay" | "pending" }
  | { status: "held"; reason: "amount_mismatch" }
  | { status: "settled"; drops: Drop[] }
  | { status: "failed"; transactionStatus: string };

const FAILURE_STATUSES = new Set(["expire", "cancel", "deny", "failure"]);

export async function applyNotification(
  db: Database,
  notif: MidtransNotification,
  serverKey: string,
): Promise<WebhookOutcome> {
  if (!verifySignature(notif, serverKey)) {
    return { status: "rejected", reason: "bad_signature" };
  }

  return db.transaction(async (tx) => {
    // Serial per board — mutually exclusive with the rosot job (§17.2).
    await tx.execute(sql`select pg_advisory_xact_lock(${sql.raw(BOARD_LOCK_KEY.toString())})`);

    const [trx] = await tx
      .select({
        orderId: transaksi.orderId,
        listingId: transaksi.listingId,
        nominal: transaksi.nominal,
        status: transaksi.status,
      })
      .from(transaksi)
      .where(eq(transaksi.orderId, notif.order_id))
      .limit(1);

    if (!trx) return { status: "rejected", reason: "unknown_order" };

    // Replay window: a settled invoice is never reprocessed (§18.3).
    if (trx.status === "settlement") return { status: "ignored", reason: "replay" };

    // Amount must match the invoice — otherwise hold for a human, never grant grip.
    const gross = parseGrossAmount(notif.gross_amount);
    if (gross !== trx.nominal) {
      await tx
        .update(transaksi)
        .set({ status: "perlu_review", webhookAt: sql`now()`, rawPayload: notif })
        .where(eq(transaksi.orderId, notif.order_id));
      await tx.insert(moderasiLog).values({
        listingId: trx.listingId,
        aktor: "sistem",
        keputusan: "tahan_transaksi",
        alasan: `gross_amount ${gross} != nominal invoice ${trx.nominal}`,
        sebelum: trx.status,
        sesudah: "perlu_review",
      });
      return { status: "held", reason: "amount_mismatch" };
    }

    const ts = notif.transaction_status;
    const isSuccess = ts === "settlement" || (ts === "capture" && notif.fraud_status === "accept");

    if (isSuccess) {
      // Board ranks before this payment — to detect who gets pushed down (R3).
      const before = new Map(
        (await getRanking(tx)).map((r) => [r.listing.id, r.rank]),
      );
      // Grip enters the ledger; cache is re-derived from the ledger sum.
      await appendLedger(tx, {
        listingId: trx.listingId,
        jenis: "bayar",
        nominalSigned: trx.nominal,
        ref: notif.order_id,
      });
      const grip = await gripFromLedger(tx, trx.listingId);
      const [l] = await tx
        .select({
          status: listing.status,
          nama: listing.nama,
          deskripsi: listing.deskripsi,
          urlNormal: listing.urlNormal,
        })
        .from(listing)
        .where(eq(listing.id, trx.listingId))
        .limit(1);
      const baru = l?.status === "menunggu_bayar";
      await tx
        .update(listing)
        .set({
          peganganCached: grip,
          ...(baru ? { status: "tayang" as const } : {}),
        })
        .where(eq(listing.id, trx.listingId));
      await tx
        .update(transaksi)
        .set({
          status: "settlement",
          metode: notif.payment_type,
          webhookAt: sql`now()`,
          rawPayload: notif,
        })
        .where(eq(transaksi.orderId, notif.order_id));
      // Layer-1 moderation screen — risky content never stays publicly tayang (R8).
      if (l) {
        await screenListing(tx, {
          listingId: trx.listingId,
          nama: l.nama,
          deskripsi: l.deskripsi,
          urlNormal: l.urlNormal,
          grip,
          baru,
          orderId: notif.order_id,
        });
      }
      // Ranks after the payment + screen; who fell out of a threshold (R3).
      const cfg = await loadRosotConfig(tx);
      const after = new Map((await getRanking(tx)).map((r) => [r.listing.id, r.rank]));
      return { status: "settled", drops: detectDrops(before, after, cfg.ambang) };
    }

    if (FAILURE_STATUSES.has(ts)) {
      await tx
        .update(transaksi)
        .set({ status: ts, webhookAt: sql`now()`, rawPayload: notif })
        .where(eq(transaksi.orderId, notif.order_id));
      // A never-activated listing whose invoice failed expires (§17.2).
      const [l] = await tx
        .select({ status: listing.status })
        .from(listing)
        .where(eq(listing.id, trx.listingId))
        .limit(1);
      if (l?.status === "menunggu_bayar") {
        await tx
          .update(listing)
          .set({ status: "kedaluwarsa" })
          .where(eq(listing.id, trx.listingId));
      }
      return { status: "failed", transactionStatus: ts };
    }

    // pending / capture-challenge / anything else non-terminal: record, no grip.
    await tx
      .update(transaksi)
      .set({ webhookAt: sql`now()`, rawPayload: notif })
      .where(eq(transaksi.orderId, notif.order_id));
    return { status: "ignored", reason: "pending" };
  });
}
