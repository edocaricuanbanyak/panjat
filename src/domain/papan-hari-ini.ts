/**
 * Papan Hari Ini (R7, §6.3 Lapis 3) — a second board that counts only payments
 * made since the 00:00 WIB reset. "Uang kemarin tidak berlaku." Anyone with
 * Rp20.000 has a real shot at champion, without touching the main board's
 * economy. It's a read model over the append-only ledger, so any past day is
 * recomputed deterministically — no archive table needed (§17.3).
 */
import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import type { Database } from "@/db";
import { kategori, listing, peganganLedger } from "@/db/schema";

/** WIB calendar date "YYYY-MM-DD" for an instant. */
export function wibDate(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(now);
}

/** The [start, end) UTC instants of a WIB calendar day. */
export function wibDayWindow(tanggal: string): { start: Date; end: Date } {
  const start = new Date(`${tanggal}T00:00:00+07:00`);
  return { start, end: new Date(start.getTime() + 24 * 3600_000) };
}

export interface HariIniEntry {
  rank: number;
  id: string;
  nama: string;
  urlNormal: string;
  kategoriNama: string | null;
  kategoriSlug: string | null;
  todayGrip: number;
}

/**
 * Standings for a WIB day: listings ranked by payments (`bayar`) made in the
 * window. `until` caps a still-running day to "now"; omit for a full past day.
 */
export async function getPapanHariIni(
  db: Database,
  start: Date,
  end: Date,
): Promise<HariIniEntry[]> {
  const grip = sql<number>`sum(${peganganLedger.nominalSigned})::bigint`;
  const rows = await db
    .select({
      id: listing.id,
      nama: listing.nama,
      urlNormal: listing.urlNormal,
      kategoriNama: kategori.nama,
      kategoriSlug: kategori.slug,
      todayGrip: grip,
    })
    .from(peganganLedger)
    .innerJoin(listing, eq(listing.id, peganganLedger.listingId))
    .leftJoin(kategori, eq(kategori.id, listing.kategoriId))
    .where(
      and(
        eq(peganganLedger.jenis, "bayar"),
        gte(peganganLedger.createdAt, start),
        lt(peganganLedger.createdAt, end),
        eq(listing.status, "tayang"),
      ),
    )
    .groupBy(listing.id, listing.nama, listing.urlNormal, kategori.nama, kategori.slug)
    .orderBy(desc(grip));

  return rows.map((r, i) => ({ ...r, todayGrip: Number(r.todayGrip), rank: i + 1 }));
}

/** The day's champion listing id (Papan Hari Ini #1), or null if no one paid. */
export async function papanHariIniChampion(
  db: Database,
  start: Date,
  end: Date,
): Promise<string | null> {
  const entries = await getPapanHariIni(db, start, end);
  return entries[0]?.id ?? null;
}

/** Convenience: today's live board (window capped at `now`). */
export async function getHariIni(db: Database, now: Date): Promise<HariIniEntry[]> {
  const { start, end } = wibDayWindow(wibDate(now));
  return getPapanHariIni(db, start, now < end ? now : end);
}
