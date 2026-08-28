/**
 * Read models for the Momen Puncak celebration (MI-1) and the flex/OG card (R5).
 * Rank is taken from the live board so the card reflects the moment.
 */
import { eq } from "drizzle-orm";
import type { Database } from "@/db";
import { listing, transaksi } from "@/db/schema";
import { getBoard } from "./board";

export interface Momen {
  listingId: string;
  nama: string;
  rank: number;
  pegangan: number;
  /** How many climbers sit below — "kamu menyalip N pemanjat". */
  overtaken: number;
  /** Reached the very top? */
  puncak: boolean;
  /** Whether a site screenshot already exists (else the share card triggers one). */
  hasScreenshot: boolean;
}

export async function getMomen(db: Database, orderId: string): Promise<Momen | null> {
  const [t] = await db
    .select({ listingId: transaksi.listingId })
    .from(transaksi)
    .where(eq(transaksi.orderId, orderId))
    .limit(1);
  if (!t) return null;
  return getMomenForListing(db, t.listingId);
}

export async function getMomenForListing(
  db: Database,
  listingId: string,
): Promise<Momen | null> {
  const { entries } = await getBoard(db);
  const e = entries.find((x) => x.id === listingId);
  if (!e) return null;
  const [shot] = await db
    .select({ screenshotUrl: listing.screenshotUrl })
    .from(listing)
    .where(eq(listing.id, listingId))
    .limit(1);
  return {
    listingId: e.id,
    nama: e.nama,
    rank: e.rank,
    pegangan: e.pegangan,
    overtaken: entries.length - e.rank,
    puncak: e.rank === 1,
    hasScreenshot: Boolean(shot?.screenshotUrl),
  };
}
