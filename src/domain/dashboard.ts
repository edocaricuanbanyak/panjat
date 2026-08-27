/**
 * Sponsor dashboard read model (R4). Every number comes from first-party
 * sources: pegangan_cached, klik_harian, posisi_snapshot, transaksi. CPC is the
 * ROI figure that carries differentiator D2.
 */
import { and, desc, eq, gte, sql } from "drizzle-orm";
import type { Database } from "@/db";
import { klikHarian, listing, moderasiLog, posisiSnapshot, transaksi } from "@/db/schema";
import { getBoard } from "./board";
import { badgesFor } from "./lencana";
import { loadRosotConfig } from "./config";
import { dailyRateForRank, estimateDaysToThreshold } from "./rosot";

/**
 * Cost-per-click = daily decay cost ÷ today's clicks (§6.5 framing:
 * "Rp25.000/hari ÷ ~400 klik = Rp62/klik"). Null when there are no clicks yet.
 */
export function cpc(rosotPerHari: number, klikHariIni: number): number | null {
  return klikHariIni > 0 ? Math.round(rosotPerHari / klikHariIni) : null;
}

export interface SnapshotPoint {
  jam: Date;
  rank: number;
  pegangan: number;
}
export interface PembayaranRow {
  nominal: number;
  metode: string | null;
  waktu: Date;
}

export interface Dashboard {
  listingId: string;
  nama: string;
  urlNormal: string;
  deskripsi: string | null;
  status: string;
  pegangan: number;
  rank: number | null;
  rosotPerHari: number;
  estimasiHari: number | null;
  klikTotal: number;
  klikHariIni: number;
  cpc: number | null;
  screenshotUrl: string | null;
  seri7hari: SnapshotPoint[];
  riwayat: PembayaranRow[];
  badges: string[];
}

export async function getDashboard(db: Database, listingId: string): Promise<Dashboard | null> {
  const [l] = await db
    .select({
      id: listing.id,
      nama: listing.nama,
      urlNormal: listing.urlNormal,
      deskripsi: listing.deskripsi,
      status: listing.status,
      pegangan: listing.peganganCached,
      screenshotUrl: listing.screenshotUrl,
    })
    .from(listing)
    .where(eq(listing.id, listingId))
    .limit(1);
  if (!l) return null;

  const [board, cfg, klikRows, seri, riwayat] = await Promise.all([
    getBoard(db),
    loadRosotConfig(db),
    db
      .select({ tanggal: klikHarian.tanggal, jumlah: klikHarian.jumlahValid })
      .from(klikHarian)
      .where(eq(klikHarian.listingId, listingId)),
    db
      .select({ jam: posisiSnapshot.jam, rank: posisiSnapshot.rank, pegangan: posisiSnapshot.pegangan })
      .from(posisiSnapshot)
      .where(
        and(
          eq(posisiSnapshot.listingId, listingId),
          gte(posisiSnapshot.jam, new Date(Date.now() - 7 * 24 * 3600_000)),
        ),
      )
      .orderBy(posisiSnapshot.jam),
    db
      .select({ nominal: transaksi.nominal, metode: transaksi.metode, waktu: transaksi.webhookAt })
      .from(transaksi)
      .where(and(eq(transaksi.listingId, listingId), eq(transaksi.status, "settlement")))
      .orderBy(desc(transaksi.webhookAt)),
  ]);

  const entry = board.entries.find((e) => e.id === listingId);
  const rank = entry?.rank ?? null;
  const rosotPerHari =
    rank !== null ? Math.round(l.pegangan * dailyRateForRank(rank, l.pegangan, cfg)) : 0;

  const today = new Date().toISOString().slice(0, 10);
  const klikTotal = klikRows.reduce((s, r) => s + r.jumlah, 0);
  const klikHariIni = klikRows.find((r) => r.tanggal === today)?.jumlah ?? 0;

  const threshold = Math.max(cfg.kakiTiang, 0);
  const rate = rank !== null ? dailyRateForRank(rank, l.pegangan, cfg) : 0;
  const est = estimateDaysToThreshold(l.pegangan, rate, threshold);
  const badges = (await badgesFor(db, [l.id])).get(l.id) ?? [];

  return {
    listingId: l.id,
    nama: l.nama,
    urlNormal: l.urlNormal,
    deskripsi: l.deskripsi,
    status: l.status,
    pegangan: l.pegangan,
    rank,
    rosotPerHari,
    estimasiHari: Number.isFinite(est) ? est : null,
    klikTotal,
    klikHariIni,
    cpc: cpc(rosotPerHari, klikHariIni),
    screenshotUrl: l.screenshotUrl,
    seri7hari: seri,
    riwayat: riwayat.map((r) => ({ nominal: r.nominal, metode: r.metode, waktu: r.waktu ?? new Date(0) })),
    badges,
  };
}

export async function listMyListings(db: Database, kontakId: string) {
  return db
    .select({
      id: listing.id,
      nama: listing.nama,
      status: listing.status,
      pegangan: listing.peganganCached,
    })
    .from(listing)
    .where(eq(listing.kontakId, kontakId))
    .orderBy(desc(listing.peganganCached));
}

/** Verify a listing belongs to a kontak (dashboard authz). */
export async function ownsListing(db: Database, listingId: string, kontakId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: listing.id })
    .from(listing)
    .where(and(eq(listing.id, listingId), eq(listing.kontakId, kontakId)))
    .limit(1);
  return !!row;
}

export class EditLimitError extends Error {
  constructor() {
    super("Batas ubah deskripsi tercapai (maks 2×/24 jam).");
  }
}

/** Edit description only (URL never changes, R4); ≤2 per 24h. */
export async function editDeskripsi(
  db: Database,
  listingId: string,
  kontakId: string,
  deskripsi: string,
): Promise<void> {
  if (!(await ownsListing(db, listingId, kontakId))) throw new Error("Bukan listing kamu");

  const dayAgo = new Date(Date.now() - 24 * 3600_000);
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(moderasiLog)
    .where(
      and(
        eq(moderasiLog.listingId, listingId),
        eq(moderasiLog.keputusan, "ubah_deskripsi"),
        gte(moderasiLog.createdAt, dayAgo),
      ),
    );
  if (count >= 2) throw new EditLimitError();

  await db.transaction(async (tx) => {
    const [before] = await tx
      .select({ deskripsi: listing.deskripsi })
      .from(listing)
      .where(eq(listing.id, listingId))
      .limit(1);
    await tx.update(listing).set({ deskripsi }).where(eq(listing.id, listingId));
    await tx.insert(moderasiLog).values({
      listingId,
      aktor: "manusia",
      keputusan: "ubah_deskripsi",
      alasan: "sponsor via dasbor",
      sebelum: before?.deskripsi ?? null,
      sesudah: deskripsi,
    });
  });
}
