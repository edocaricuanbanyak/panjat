/**
 * Board read model (R1) — the paid `tayang` listings, ranked by grip, enriched
 * with category, total click count (all-time, consistent with Jelajah/Kategori),
 * and the current decay rate so the UI can make rosot visible (§9.1). Pure ranking
 * is reused from ranking.ts.
 */
import { and, eq, gt, sql } from "drizzle-orm";
import type { Database } from "@/db";
import { kategori, listing } from "@/db/schema";
import { loadRosotConfig } from "./config";
import { badgesFor } from "./lencana";
import { computeRanks } from "./ranking";
import { dailyRateForRank, dalamMasaTenang, listingFloor } from "./rosot";

export interface BoardEntry {
  rank: number;
  id: string;
  nama: string;
  urlNormal: string;
  deskripsi: string | null;
  kategoriNama: string | null;
  kategoriSlug: string | null;
  pegangan: number;
  klikTotal: number;
  rosotPerHari: number;
  /** Still within the post-payment grace window (decay paused). */
  masihTerjaga: boolean;
  screenshotUrl: string | null;
  badges: string[];
}

export interface Board {
  entries: BoardEntry[];
  /** Leader's grip — the PeganganBar scale. */
  max: number;
}

export async function getBoard(db: Database, now: Date = new Date()): Promise<Board> {
  // All-time clicks to this listing's /k/ redirect — the same expression Jelajah
  // uses, so the "klik" number matches on every touchpoint.
  const klikTotalExpr = sql<number>`(select coalesce(sum(jumlah_valid), 0)::int from klik_harian where klik_harian.listing_id = ${listing.id})`;
  // Per-listing total paid (drives the protected floor) and latest payment time
  // (drives the grace window), both from the append-only ledger.
  const totalBayarExpr = sql<number>`(select coalesce(sum(nominal_signed), 0)::bigint from pegangan_ledger where pegangan_ledger.listing_id = ${listing.id} and jenis = 'bayar')`;
  const bayarTerakhirExpr = sql<string | null>`(select max(created_at) from pegangan_ledger where pegangan_ledger.listing_id = ${listing.id} and jenis = 'bayar')`;

  const [rows, cfg] = await Promise.all([
    db
      .select({
        id: listing.id,
        nama: listing.nama,
        urlNormal: listing.urlNormal,
        deskripsi: listing.deskripsi,
        peganganCached: listing.peganganCached,
        createdAt: listing.createdAt,
        screenshotUrl: listing.screenshotUrl,
        kategoriNama: kategori.nama,
        kategoriSlug: kategori.slug,
        klikTotal: klikTotalExpr,
        totalBayar: totalBayarExpr,
        bayarTerakhir: bayarTerakhirExpr,
      })
      .from(listing)
      .leftJoin(kategori, eq(kategori.id, listing.kategoriId))
      // Paid board only: grip-0 (Kaki Tiang / free) listings live in their own
      // tier, never on the paid leaderboard.
      .where(and(eq(listing.status, "tayang"), gt(listing.peganganCached, 0))),
    loadRosotConfig(db),
  ]);

  const badges = await badgesFor(db, rows.map((r) => r.id));

  const entries = computeRanks(rows).map(({ rank, listing: r }) => {
    const floor = listingFloor(Number(r.totalBayar ?? 0), cfg);
    const masihTerjaga = dalamMasaTenang(
      r.bayarTerakhir ? new Date(r.bayarTerakhir) : null,
      cfg.masaTenangJam,
      now,
    );
    return {
      rank,
      id: r.id,
      nama: r.nama,
      urlNormal: r.urlNormal,
      deskripsi: r.deskripsi,
      kategoriNama: r.kategoriNama,
      kategoriSlug: r.kategoriSlug,
      pegangan: r.peganganCached,
      klikTotal: r.klikTotal ?? 0,
      rosotPerHari: Math.round(r.peganganCached * dailyRateForRank(rank, r.peganganCached, cfg, floor)),
      masihTerjaga,
      screenshotUrl: r.screenshotUrl,
      badges: badges.get(r.id) ?? [],
    };
  });

  return { entries, max: entries[0]?.pegangan ?? 0 };
}
