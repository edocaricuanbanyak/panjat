/**
 * Sorak (R16, M2) — 3 free upvotes/day/visitor for Kaki Tiang (Rp0) listings.
 * Scarcity is the point: they don't stack. Sorak orders the Kaki Tiang tier and
 * never lifts a free listing above a paid one. Anonymous gamification: never
 * touches money, paid ranking, or clicks (§7.5.2).
 */
import { and, count, desc, eq, sql } from "drizzle-orm";
import type { Database } from "@/db";
import { listing, pengunjungAnon, sorak } from "@/db/schema";
import { weekStartWIB } from "@/lib/favorit";
import { wibDate } from "./papan-hari-ini";

export const SORAK_PER_DAY = 5;

export class SorakError extends Error {}

export async function sorakRemaining(db: Database, anonId: string | null, now: Date): Promise<number> {
  if (!anonId) return SORAK_PER_DAY;
  const [row] = await db
    .select({ n: count() })
    .from(sorak)
    .where(and(eq(sorak.anonId, anonId), eq(sorak.tanggal, wibDate(now))));
  return Math.max(0, SORAK_PER_DAY - row.n);
}

/** Give one Sorak. Kaki Tiang only, ≤5/day; may stack all 5 on one listing. */
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
  await db.insert(sorak).values({ anonId, listingId, tanggal });
}

export interface KakiTiangEntry {
  id: string;
  nama: string;
  urlNormal: string;
  deskripsi: string | null;
  sorak: number;
}

export interface JuaraKakiTiang {
  id: string;
  nama: string;
  urlNormal: string;
  deskripsi: string | null;
  /** Sorak earned within the weekly bucket (since the Wed 17:00 WIB cut-off). */
  sorak: number;
  /** Valid clicks delivered within the same weekly bucket. */
  klik: number;
}

/**
 * Weekly Kaki Tiang champion: the free listing with the most Sorak in the current
 * weekly bucket — anchored to the Wednesday 17:00 WIB cut-off (matches Terfavorit),
 * so it resets cleanly each week rather than drifting on a rolling window. Shown as
 * a labelled showcase (never a paid rank — R16). Carries its pitch + weekly clicks
 * so the board can feature it at the top. Null if nobody was cheered this week.
 *
 * `now` picks the bucket: the cron passes the just-closed week's timestamp so the
 * archived champion reflects the week that just ended, not the empty new week.
 */
export async function getJuaraKakiTiangMingguan(
  db: Database,
  now = new Date(),
): Promise<JuaraKakiTiang | null> {
  const weekStart = weekStartWIB(now); // WIB "YYYY-MM-DD" of this week's Wed 17:00 cut-off
  const sorakMinggu = sql<number>`(select count(*)::int from "sorak"
    where "sorak"."listing_id" = "listing"."id" and "sorak"."tanggal" >= ${weekStart})`;
  const klikMinggu = sql<number>`(select coalesce(sum("klik_harian"."jumlah_valid"), 0)::int from "klik_harian"
    where "klik_harian"."listing_id" = "listing"."id" and "klik_harian"."tanggal" >= ${weekStart})`;
  const [row] = await db
    .select({
      id: listing.id,
      nama: listing.nama,
      urlNormal: listing.urlNormal,
      deskripsi: listing.deskripsi,
      sorak: sorakMinggu,
      klik: klikMinggu,
    })
    .from(listing)
    .where(and(eq(listing.status, "tayang"), eq(listing.peganganCached, 0)))
    .orderBy(desc(sorakMinggu), desc(listing.createdAt))
    .limit(1);
  return row && row.sorak > 0 ? row : null;
}

/** Free listings, ordered by Sorak (never above paid — a separate tier). */
export async function getKakiTiang(db: Database): Promise<KakiTiangEntry[]> {
  // Fully-qualified columns: in a SELECT-list sql fragment drizzle strips table
  // qualifiers, so `${listing.id}` would resolve to sorak.id inside the subquery
  // and always count 0. Reference both sides explicitly.
  const sorakCount = sql<number>`(select count(*)::int from "sorak" where "sorak"."listing_id" = "listing"."id")`;
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
