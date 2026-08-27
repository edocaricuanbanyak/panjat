/**
 * Board read model — ranking is strictly by grip (§5: "tidak ada algoritma
 * tersembunyi").
 */
import { eq } from "drizzle-orm";
import type { DbOrTx } from "@/db";
import { listing } from "@/db/schema";

export interface Rankable {
  id: string;
  peganganCached: number;
  createdAt: Date;
}

export interface Ranked<T extends Rankable> {
  rank: number; // 1-based
  listing: T;
}

/**
 * Pure ranking. Order by grip DESC, tie-broken by earlier createdAt ASC.
 *
 * §5's "seri → yang lebih dulu mencapai nominal menang" is enforced at the
 * money-entry/webhook layer (serial-per-board commit order, a later slice).
 * For the read model, createdAt is the deterministic secondary key; genuine
 * ties only occur among floored (Rp1.000) or Rp0 listings.
 */
export function computeRanks<T extends Rankable>(listings: readonly T[]): Ranked<T>[] {
  return [...listings]
    .sort((a, b) => {
      if (b.peganganCached !== a.peganganCached) {
        return b.peganganCached - a.peganganCached;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    })
    .map((l, i) => ({ rank: i + 1, listing: l }));
}

/** The paid board: `tayang` listings ranked by grip. */
export async function getRanking(db: DbOrTx) {
  const rows = await db
    .select({
      id: listing.id,
      nama: listing.nama,
      peganganCached: listing.peganganCached,
      createdAt: listing.createdAt,
    })
    .from(listing)
    .where(eq(listing.status, "tayang"));
  return computeRanks(rows);
}
