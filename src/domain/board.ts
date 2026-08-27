/**
 * Board read model (R1) — the paid `tayang` listings, ranked by grip, enriched
 * with category, today's click count, and the current decay rate so the UI can
 * make rosot visible (§9.1). Pure ranking is reused from ranking.ts.
 */
import { and, eq } from "drizzle-orm";
import type { Database } from "@/db";
import { kategori, klikHarian, listing } from "@/db/schema";
import { loadRosotConfig } from "./config";
import { computeRanks } from "./ranking";
import { dailyRateForRank } from "./rosot";

export interface BoardEntry {
  rank: number;
  id: string;
  nama: string;
  urlNormal: string;
  deskripsi: string | null;
  kategoriNama: string | null;
  pegangan: number;
  klikHariIni: number;
  rosotPerHari: number;
}

export interface Board {
  entries: BoardEntry[];
  /** Leader's grip — the PeganganBar scale. */
  max: number;
}

export async function getBoard(db: Database): Promise<Board> {
  const today = new Date().toISOString().slice(0, 10); // UTC date

  const [rows, cfg] = await Promise.all([
    db
      .select({
        id: listing.id,
        nama: listing.nama,
        urlNormal: listing.urlNormal,
        deskripsi: listing.deskripsi,
        peganganCached: listing.peganganCached,
        createdAt: listing.createdAt,
        kategoriNama: kategori.nama,
        klikHariIni: klikHarian.jumlahValid,
      })
      .from(listing)
      .leftJoin(kategori, eq(kategori.id, listing.kategoriId))
      .leftJoin(
        klikHarian,
        and(eq(klikHarian.listingId, listing.id), eq(klikHarian.tanggal, today)),
      )
      .where(eq(listing.status, "tayang")),
    loadRosotConfig(db),
  ]);

  const entries = computeRanks(rows).map(({ rank, listing: r }) => ({
    rank,
    id: r.id,
    nama: r.nama,
    urlNormal: r.urlNormal,
    deskripsi: r.deskripsi,
    kategoriNama: r.kategoriNama,
    pegangan: r.peganganCached,
    klikHariIni: r.klikHariIni ?? 0,
    rosotPerHari: Math.round(r.peganganCached * dailyRateForRank(rank, r.peganganCached, cfg)),
  }));

  return { entries, max: entries[0]?.pegangan ?? 0 };
}
