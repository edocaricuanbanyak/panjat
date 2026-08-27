/**
 * Jaga Posisi (§13.1, F4) — auto top-up to keep a listing at a target tier. The
 * DECISION is deterministic and auditable (never AI): how much extra grip is
 * needed to restore the target, capped by the remaining budget and the minimum
 * top-up. Money still enters ONLY via the verified settle path (applyNotification
 * / webhook) — this never mutates the ledger directly.
 *
 * The recurring charge itself uses a saved Midtrans token in production; that
 * tokenization needs real Midtrans setup, so here the executor drives the mock
 * settle path (demoable end-to-end) and leaves a clear seam for the real charge.
 */
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import type { Database } from "@/db";
import { jagaPosisi, listing, transaksi } from "@/db/schema";
import {
  isMock,
  midtransConfig,
  signNotification,
  type MidtransNotification,
} from "@/lib/midtrans";
import { loadManjatConfig } from "./config";
import { nominalForTarget, type Target } from "./manjat";
import { getRanking } from "./ranking";
import { applyNotification } from "./webhook";

export type JagaTarget = "top1" | "top3" | "top10";
const TARGET_RANK: Record<JagaTarget, number> = { top1: 1, top3: 3, top10: 10 };
const TARGET_QUOTE: Record<JagaTarget, Target> = { top1: "#1", top3: "top3", top10: "top10" };

/**
 * Pure: additional grip to restore the target tier. Returns 0 when already at
 * target or the budget can't cover even the minimum top-up (→ config pauses).
 */
export function topUpAmount(
  currentGrip: number,
  targetGrip: number,
  budgetSisa: number,
  minTopUp: number,
): number {
  const needed = targetGrip - currentGrip;
  if (needed <= 0) return 0;
  const amount = Math.max(needed, minTopUp);
  return amount <= budgetSisa ? amount : 0;
}

export interface JagaPlan {
  listingId: string;
  nominal: number;
  target: JagaTarget;
  token: string | null;
}

/** Which active configs are below target, and by how much. Deterministic. */
export async function planJaga(db: Database): Promise<JagaPlan[]> {
  const configs = await db
    .select({
      listingId: jagaPosisi.listingId,
      target: jagaPosisi.target,
      budgetSisa: jagaPosisi.budgetSisa,
      token: jagaPosisi.token,
      grip: listing.peganganCached,
    })
    .from(jagaPosisi)
    .innerJoin(listing, eq(listing.id, jagaPosisi.listingId))
    .where(and(eq(jagaPosisi.aktif, true), eq(listing.status, "tayang")));
  if (configs.length === 0) return [];

  const [ranking, cfg] = await Promise.all([getRanking(db), loadManjatConfig(db)]);
  const gripsDesc = ranking.map((r) => r.listing.peganganCached);
  const rankById = new Map(ranking.map((r) => [r.listing.id, r.rank]));

  const plans: JagaPlan[] = [];
  for (const c of configs) {
    const target = c.target as JagaTarget;
    const rank = rankById.get(c.listingId);
    if (rank == null || rank <= TARGET_RANK[target]) continue; // already at/above target
    const targetGrip = nominalForTarget(TARGET_QUOTE[target], gripsDesc, cfg.minimumNaik);
    const nominal = topUpAmount(c.grip, targetGrip, c.budgetSisa, cfg.minimumManjatLagi);
    if (nominal > 0) plans.push({ listingId: c.listingId, nominal, target, token: c.token });
  }
  return plans;
}

/**
 * Charge one planned top-up. Grip activates only via applyNotification (the same
 * verified path a real webhook uses). Mock/no-token → simulate the settlement;
 * with a real token, production issues a Midtrans recurring charge and the real
 * webhook settles. Decrements the budget by the charged amount.
 */
export async function executeJaga(db: Database, plan: JagaPlan): Promise<boolean> {
  const orderId = `jaga-${plan.listingId.slice(0, 8)}-${randomUUID().slice(0, 8)}`;
  await db.insert(transaksi).values({
    orderId,
    listingId: plan.listingId,
    nominal: plan.nominal,
    status: "pending",
  });

  const { serverKey } = midtransConfig();
  if (isMock() || !plan.token) {
    const fields = { order_id: orderId, status_code: "200", gross_amount: `${plan.nominal}.00` };
    const notif: MidtransNotification = {
      ...fields,
      transaction_status: "settlement",
      payment_type: "qris",
      signature_key: signNotification(fields, serverKey),
    };
    const outcome = await applyNotification(db, notif, serverKey);
    if (outcome.status !== "settled") return false;
  } else {
    // Production seam: Midtrans Core recurring charge with plan.token; the real
    // webhook then settles this order. Left unimplemented until tokenization ships.
    return false;
  }

  await db
    .update(jagaPosisi)
    .set({ budgetSisa: sql`${jagaPosisi.budgetSisa} - ${plan.nominal}` })
    .where(eq(jagaPosisi.listingId, plan.listingId));
  return true;
}
