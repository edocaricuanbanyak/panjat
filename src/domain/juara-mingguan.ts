/**
 * Weekly champions (H) — computed once a week at the Wednesday 17:00 cut-off by
 * the cron and stored in the `juara_mingguan` archive: board #1/#2/#3 by grip, the week's
 * Terfavorit, and the Kaki Tiang champion (most Sorak). Everything else (the
 * featured showcase, the archive page, the weekly Threads/TikTok card) reads
 * from this archive, so nothing "weekly" shows until a week has actually been
 * archived (G).
 */
import { and, desc, eq, gt, ne, sql } from "drizzle-orm";
import type { Database } from "@/db";
import { juaraMingguan, kategori, listing, moderasiLog } from "@/db/schema";
import { favoritBoard, weekStartWIB } from "@/lib/favorit";
import { getJuaraKakiTiangMingguan } from "./sorak";

export type JuaraJenis = "papan1" | "papan2" | "papan3" | "terfavorit" | "kaki_tiang";

/**
 * The archive bucket id: the WIB date of the week's Wednesday 17:00 cut-off — the
 * day champions are determined (posted to Threads/TikTok the following Friday).
 */
export function mingguId(now: Date): string {
  return weekStartWIB(now);
}

/** Compute this week's champions and upsert them into the archive. */
export async function simpanJuaraMingguan(db: Database, now = new Date()) {
  const minggu = mingguId(now);
  const rows: { jenis: JuaraJenis; listingId: string; metrik: number }[] = [];

  const top = await db
    .select({ id: listing.id, p: listing.peganganCached })
    .from(listing)
    .where(and(eq(listing.status, "tayang"), gt(listing.peganganCached, 0)))
    .orderBy(desc(listing.peganganCached))
    .limit(3);
  const papan: JuaraJenis[] = ["papan1", "papan2", "papan3"];
  top.forEach((t, i) => rows.push({ jenis: papan[i], listingId: t.id, metrik: t.p }));

  // The favourite tally to archive is the week that just closed at the Wednesday
  // 17:00 cut-off — the current bucket resets then, so step back two days to land
  // safely inside the closed week (robust whether the cron fires right at 17:00
  // or a little later).
  const mingguTutup = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const [fav] = await favoritBoard(db, mingguTutup, 1);
  if (fav) rows.push({ jenis: "terfavorit", listingId: fav.id, metrik: fav.votes });

  const kaki = await getJuaraKakiTiangMingguan(db, mingguTutup);
  if (kaki) rows.push({ jenis: "kaki_tiang", listingId: kaki.id, metrik: kaki.sorak });

  // Weekly Kaki Tiang reset: the champion "graduates" to the board (Rp0 row); the
  // rest of the free tier expires so next week starts fresh.
  const hangus = await hanguskanKakiTiang(db, kaki?.id ?? null);

  for (const r of rows) {
    await db
      .insert(juaraMingguan)
      .values({ minggu, jenis: r.jenis, listingId: r.listingId, metrik: r.metrik })
      .onConflictDoUpdate({
        target: [juaraMingguan.minggu, juaraMingguan.jenis],
        set: { listingId: r.listingId, metrik: r.metrik },
      });
  }
  return { minggu, jumlah: rows.length, hangus };
}

/**
 * Weekly Kaki Tiang reset — expire every free (Rp0, `tayang`) listing except the
 * just-crowned champion (`kecualiId`). Runs at the Wed 17:00 cut-off so the free
 * tier empties for a fresh contest; expired listings stop counting toward the
 * per-domain free cap, so owners can post again next week. No grip/ledger touched.
 */
export async function hanguskanKakiTiang(db: Database, kecualiId: string | null): Promise<number> {
  const rows = await db
    .select({ id: listing.id })
    .from(listing)
    .where(
      and(
        eq(listing.status, "tayang"),
        eq(listing.peganganCached, 0),
        kecualiId ? ne(listing.id, kecualiId) : undefined,
      ),
    );
  if (rows.length === 0) return 0;
  await db.transaction(async (tx) => {
    for (const r of rows) {
      await tx.update(listing).set({ status: "kedaluwarsa" }).where(eq(listing.id, r.id));
      await tx.insert(moderasiLog).values({
        listingId: r.id,
        aktor: "sistem",
        keputusan: "kedaluwarsa",
        alasan: "Kaki Tiang reset mingguan",
        sebelum: "tayang",
        sesudah: "kedaluwarsa",
      });
    }
  });
  return rows.length;
}

export interface JuaraArsip {
  minggu: string;
  jenis: JuaraJenis;
  listingId: string;
  nama: string;
  urlNormal: string;
  metrik: number;
}

/** Champions of the most recently archived week (archive page + IG card). */
export async function getJuaraMingguanTerbaru(db: Database): Promise<JuaraArsip[]> {
  const [latest] = await db
    .select({ minggu: juaraMingguan.minggu })
    .from(juaraMingguan)
    .orderBy(desc(juaraMingguan.minggu))
    .limit(1);
  if (!latest) return [];
  const rows = await db
    .select({
      minggu: juaraMingguan.minggu,
      jenis: juaraMingguan.jenis,
      listingId: juaraMingguan.listingId,
      nama: listing.nama,
      urlNormal: listing.urlNormal,
      metrik: juaraMingguan.metrik,
    })
    .from(juaraMingguan)
    .innerJoin(listing, eq(listing.id, juaraMingguan.listingId))
    .where(eq(juaraMingguan.minggu, latest.minggu));
  return rows as JuaraArsip[];
}

export interface JuaraKakiTiangArsip {
  id: string;
  nama: string;
  urlNormal: string;
  deskripsi: string | null;
  kategoriNama: string | null;
  kategoriSlug: string | null;
  sorak: number;
  klik: number;
}

export interface JuaraTerfavoritArsip {
  id: string;
  nama: string;
  urlNormal: string;
  deskripsi: string | null;
  votes: number;
  klik: number;
}

/**
 * Most-favorited climber of the latest archived week (free spectator vote, never
 * a paid rank) — a labelled showcase on the board, mirroring the Kaki Tiang
 * champion. Null until a week is archived.
 */
export async function getJuaraTerfavoritArsip(db: Database): Promise<JuaraTerfavoritArsip | null> {
  const [row] = await db
    .select({
      id: listing.id,
      nama: listing.nama,
      urlNormal: listing.urlNormal,
      deskripsi: listing.deskripsi,
      votes: juaraMingguan.metrik,
      klik: sql<number>`(select coalesce(sum("klik_harian"."jumlah_valid"), 0)::int from "klik_harian" where "klik_harian"."listing_id" = "listing"."id")`,
    })
    .from(juaraMingguan)
    .innerJoin(listing, eq(listing.id, juaraMingguan.listingId))
    .where(eq(juaraMingguan.jenis, "terfavorit"))
    .orderBy(desc(juaraMingguan.minggu))
    .limit(1);
  return row ?? null;
}

/**
 * Kaki Tiang champion of the latest archived week (with pitch + clicks) for the
 * featured showcase. Null until a week is archived — so the showcase stays hidden
 * before the first weekly run (G).
 */
export async function getJuaraKakiTiangArsip(db: Database): Promise<JuaraKakiTiangArsip | null> {
  const [row] = await db
    .select({
      id: listing.id,
      nama: listing.nama,
      urlNormal: listing.urlNormal,
      deskripsi: listing.deskripsi,
      kategoriNama: kategori.nama,
      kategoriSlug: kategori.slug,
      sorak: juaraMingguan.metrik,
      klik: sql<number>`(select coalesce(sum("klik_harian"."jumlah_valid"), 0)::int from "klik_harian" where "klik_harian"."listing_id" = "listing"."id")`,
    })
    .from(juaraMingguan)
    .innerJoin(listing, eq(listing.id, juaraMingguan.listingId))
    .leftJoin(kategori, eq(kategori.id, listing.kategoriId))
    .where(eq(juaraMingguan.jenis, "kaki_tiang"))
    .orderBy(desc(juaraMingguan.minggu))
    .limit(1);
  return row ?? null;
}
