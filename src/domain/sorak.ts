/**
 * Sorak (R16, M2) — 3 free upvotes/day/visitor for Kaki Tiang (Rp0) listings.
 * Scarcity is the point: they don't stack. Sorak orders the Kaki Tiang tier and
 * never lifts a free listing above a paid one. Anonymous gamification: never
 * touches money, paid ranking, or clicks (§7.5.2).
 */
import { and, count, desc, eq, sql } from "drizzle-orm";
import type { Database } from "@/db";
import { listing, pengunjungAnon, sorak } from "@/db/schema";
import { wibDate } from "./papan-hari-ini";

export const SORAK_PER_DAY = 3;

export class SorakError extends Error {}

export async function sorakRemaining(db: Database, anonId: string | null, now: Date): Promise<number> {
  if (!anonId) return SORAK_PER_DAY;
  const [row] = await db
    .select({ n: count() })
    .from(sorak)
    .where(and(eq(sorak.anonId, anonId), eq(sorak.tanggal, wibDate(now))));
  return Math.max(0, SORAK_PER_DAY - row.n);
}

/** Give one Sorak. Kaki Tiang only, ≤3/day, once per listing/day. */
export async function recordSorak(
  db: Database,
  anonId: string,
  listingId: string,
  now: Date,
): Promise<void> {
  const [l] = await db
    .select({ status: listing.status, pegangan: listing.peganganCached })
    .from(listing)
    .where(eq(listing.id, listingId))
    .limit(1);
  if (!l || l.status !== "tayang" || l.pegangan > 0) {
    throw new SorakError("Sorak hanya untuk listing Kaki Tiang.");
  }

  const tanggal = wibDate(now);
  const [used] = await db
    .select({ n: count() })
    .from(sorak)
    .where(and(eq(sorak.anonId, anonId), eq(sorak.tanggal, tanggal)));
  if (used.n >= SORAK_PER_DAY) throw new SorakError("Sorak hari ini sudah habis.");

  await db.insert(pengunjungAnon).values({ id: anonId }).onConflictDoNothing();
  try {
    await db.insert(sorak).values({ anonId, listingId, tanggal });
  } catch {
    throw new SorakError("Kamu sudah menyorak listing ini hari ini.");
  }
}

export interface KakiTiangEntry {
  id: string;
  nama: string;
  urlNormal: string;
  deskripsi: string | null;
  sorak: number;
}

/** Free listings, ordered by Sorak (never above paid — a separate tier). */
export async function getKakiTiang(db: Database): Promise<KakiTiangEntry[]> {
  const sorakCount = sql<number>`(select count(*)::int from ${sorak} where ${sorak.listingId} = ${listing.id})`;
  return db
    .select({
      id: listing.id,
      nama: listing.nama,
      urlNormal: listing.urlNormal,
      deskripsi: listing.deskripsi,
      sorak: sorakCount,
    })
    .from(listing)
    .where(and(eq(listing.status, "tayang"), eq(listing.peganganCached, 0)))
    .orderBy(desc(sorakCount), desc(listing.createdAt))
    .limit(30);
}
