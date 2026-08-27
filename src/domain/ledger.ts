/**
 * Grip ledger (§17.2 Prinsip 1). `pegangan` is reconstructable from append-only
 * events; `listing.pegangan_cached` is only a sort cache and must always equal
 * SUM(nominal_signed). The DB trigger blocks UPDATE/DELETE — only inserts here.
 */
import { eq, sql } from "drizzle-orm";
import type { DbOrTx } from "@/db";
import { listing, peganganLedger } from "@/db/schema";

type Jenis = (typeof peganganLedger.jenis.enumValues)[number];

export interface LedgerEntry {
  listingId: string;
  jenis: Jenis;
  /** Signed rupiah: bayar/koreksi may be +, rosot/refund are −. */
  nominalSigned: number;
  /** Midtrans order_id, rosot run ref, or moderation ref. */
  ref?: string;
}

export async function appendLedger(db: DbOrTx, entry: LedgerEntry): Promise<void> {
  await db.insert(peganganLedger).values({
    listingId: entry.listingId,
    jenis: entry.jenis,
    nominalSigned: entry.nominalSigned,
    ref: entry.ref,
  });
}

/** Authoritative grip for one listing, summed from the ledger. */
export async function gripFromLedger(db: DbOrTx, listingId: string): Promise<number> {
  const [row] = await db
    .select({
      sum: sql<number>`coalesce(sum(${peganganLedger.nominalSigned}), 0)::bigint`,
    })
    .from(peganganLedger)
    .where(eq(peganganLedger.listingId, listingId));
  return Number(row?.sum ?? 0);
}

export interface GripMismatch {
  listingId: string;
  cached: number;
  ledgerSum: number;
}

/**
 * §17.2 integrity check: every listing's cached grip must equal its ledger sum.
 * Returns the offending listings (empty = healthy). Intended for a nightly job.
 */
export async function reconcileGrips(db: DbOrTx): Promise<GripMismatch[]> {
  const rows = await db
    .select({
      listingId: listing.id,
      cached: listing.peganganCached,
      ledgerSum: sql<number>`coalesce(sum(${peganganLedger.nominalSigned}), 0)::bigint`,
    })
    .from(listing)
    .leftJoin(peganganLedger, eq(peganganLedger.listingId, listing.id))
    .groupBy(listing.id, listing.peganganCached);

  return rows
    .map((r) => ({
      listingId: r.listingId,
      cached: Number(r.cached),
      ledgerSum: Number(r.ledgerSum),
    }))
    .filter((r) => r.cached !== r.ledgerSum);
}
