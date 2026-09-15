/**
 * Webhook settlement (R2, §18.3) — the ONLY place grip is granted. Matches the
 * invoice amount, is idempotent per order_id, and runs serial per board (shared
 * advisory lock with rosot). Signature verification happens per-gateway BEFORE
 * settle() is reached; settle() itself is gateway-agnostic.
 */
import { eq, sql } from "drizzle-orm";
import type { Database } from "@/db";
import { listing, moderasiLog, transaksi } from "@/db/schema";
import {
  parseGrossAmount,
  verifySignature,
  type MidtransNotification,
} from "@/lib/midtrans";
import type { GatewayStatus, NormalizedNotification } from "@/lib/gateways/types";
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
  | { status: "settled"; drops: Drop[]; listingId: string; nama: string | null; rank: number | null }
  | { status: "refunded"; listingId: string; amount: number }
  | { status: "failed"; transactionStatus: string };

const FAILURE_STATUSES = new Set(["expire", "cancel", "deny", "failure"]);

/** Map a Midtrans transaction_status to a provider-neutral status. */
function midtransStatus(ts: string, fraud?: string): GatewayStatus {
  if (ts === "settlement" || (ts === "capture" && fraud === "accept")) return "success";
  if (FAILURE_STATUSES.has(ts)) return "failure";
  return "pending";
}

/** Normalize a verified Midtrans notification into the gateway-neutral shape. */
export function normalizeMidtrans(notif: MidtransNotification): NormalizedNotification {
  return {
    orderId: notif.order_id,
    amountMinor: parseGrossAmount(notif.gross_amount),
    status: midtransStatus(notif.transaction_status, notif.fraud_status),
    rawStatus: notif.transaction_status,
    method: notif.payment_type,
    raw: notif,
  };
}

/**
 * Midtrans entry point (unchanged signature): verify signature, then settle.
 * Existing callers (webhook route, dev/settle, jaga, sims) keep working as-is.
 */
export async function applyNotification(
  db: Database,
  notif: MidtransNotification,
  serverKey: string,
): Promise<WebhookOutcome> {
  if (!verifySignature(notif, serverKey)) {
    return { status: "rejected", reason: "bad_signature" };
  }
  return settle(db, normalizeMidtrans(notif));
}

/**
 * Gateway-agnostic settlement core. Signature must already be verified by the
 * caller (the gateway). Preserves every non-negotiable: advisory-lock serial,
 * idempotent per order_id, amount-match-or-hold, grip only on success.
 */
export async function settle(
  db: Database,
  n: NormalizedNotification,
): Promise<WebhookOutcome> {
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
      .where(eq(transaksi.orderId, n.orderId))
      .limit(1);

    if (!trx) return { status: "rejected", reason: "unknown_order" };

    // Refund reverses a settled order's grip via an append-only `refund` row.
    // Handled BEFORE the replay + amount-match gates: a refund's precondition IS
    // that the order is settled, and it carries a different amount than the grant.
    // Idempotent — a replay sees status "refund" (no longer "settlement").
    if (n.status === "refunded") {
      if (trx.status !== "settlement") return { status: "ignored", reason: "replay" };
      const grip = await gripFromLedger(tx, trx.listingId);
      // Clamp so grip never goes negative (cache must equal the ledger sum).
      const refundAmt = Math.min(trx.nominal, grip);
      if (refundAmt > 0) {
        await appendLedger(tx, {
          listingId: trx.listingId,
          jenis: "refund",
          nominalSigned: -refundAmt,
          ref: n.orderId,
        });
      }
      const newGrip = await gripFromLedger(tx, trx.listingId);
      await tx
        .update(listing)
        .set({ peganganCached: newGrip })
        .where(eq(listing.id, trx.listingId));
      await tx
        .update(transaksi)
        .set({ status: "refund", webhookAt: sql`now()`, rawPayload: n.raw })
        .where(eq(transaksi.orderId, n.orderId));
      await tx.insert(moderasiLog).values({
        listingId: trx.listingId,
        aktor: "sistem",
        keputusan: "refund_gateway",
        alasan: `gateway refund order ${n.orderId}: grip ${grip} − ${refundAmt} → ${newGrip}`,
        sebelum: "settlement",
        sesudah: "refund",
      });
      return { status: "refunded", listingId: trx.listingId, amount: refundAmt };
    }

    // Replay window: a settled invoice is never reprocessed (§18.3).
    if (trx.status === "settlement") return { status: "ignored", reason: "replay" };

    // Amount must match the invoice — otherwise hold for a human, never grant grip.
    const gross = n.amountMinor;
    if (gross !== trx.nominal) {
      await tx
        .update(transaksi)
        .set({ status: "perlu_review", webhookAt: sql`now()`, rawPayload: n.raw })
        .where(eq(transaksi.orderId, n.orderId));
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

    if (n.status === "success") {
      // Board ranks before this payment — to detect who gets pushed down (R3).
      const before = new Map(
        (await getRanking(tx)).map((r) => [r.listing.id, r.rank]),
      );
      // Grip enters the ledger; cache is re-derived from the ledger sum.
      await appendLedger(tx, {
        listingId: trx.listingId,
        jenis: "bayar",
        nominalSigned: trx.nominal,
        ref: n.orderId,
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
          metode: n.method,
          webhookAt: sql`now()`,
          rawPayload: n.raw,
        })
        .where(eq(transaksi.orderId, n.orderId));
      // Layer-1 moderation screen — risky content never stays publicly tayang (R8).
      if (l) {
        await screenListing(tx, {
          listingId: trx.listingId,
          nama: l.nama,
          deskripsi: l.deskripsi,
          urlNormal: l.urlNormal,
          grip,
          baru,
          orderId: n.orderId,
        });
      }
      // Ranks after the payment + screen; who fell out of a threshold (R3).
      const cfg = await loadRosotConfig(tx);
      const after = new Map((await getRanking(tx)).map((r) => [r.listing.id, r.rank]));
      return {
        status: "settled",
        drops: detectDrops(before, after, cfg.ambang),
        listingId: trx.listingId,
        nama: l?.nama ?? null,
        rank: after.get(trx.listingId) ?? null,
      };
    }

    if (n.status === "failure") {
      await tx
        .update(transaksi)
        .set({ status: n.rawStatus, webhookAt: sql`now()`, rawPayload: n.raw })
        .where(eq(transaksi.orderId, n.orderId));
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
      return { status: "failed", transactionStatus: n.rawStatus };
    }

    // pending / capture-challenge / anything else non-terminal: record, no grip.
    await tx
      .update(transaksi)
      .set({ webhookAt: sql`now()`, rawPayload: n.raw })
      .where(eq(transaksi.orderId, n.orderId));
    return { status: "ignored", reason: "pending" };
  });
}
