/**
 * Seed data — 15 realistic Indonesian listings across categories, plus the §6.6
 * config tunables (R11: board must not be empty at launch).
 *
 * Every seeded grip is written as a `pegangan_ledger` `bayar` row and
 * `listing.pegangan_cached` is set to the ledger sum — the seed itself respects
 * §17.2 Prinsip 1 (grip is derived from the ledger, never invented).
 *
 * Idempotent: TRUNCATE ... CASCADE resets seeded tables first. TRUNCATE does not
 * fire the row-level append-only trigger on pegangan_ledger, so re-seeding works.
 */
import { sql } from "drizzle-orm";
import { db, pool } from "./index";
import {
  kategori,
  konfigurasi,
  listing,
  peganganLedger,
  sponsorKontak,
} from "./schema";

const KATEGORI: { nama: string; slug: string }[] = [
  { nama: "AI Tools", slug: "ai-tools" },
  { nama: "SaaS", slug: "saas" },
  { nama: "Jasa", slug: "jasa" },
  { nama: "E-commerce", slug: "ecommerce" },
  { nama: "Konten & Media", slug: "konten" },
  { nama: "Game", slug: "game" },
  { nama: "Edukasi", slug: "edukasi" },
  { nama: "Fintech", slug: "fintech" },
  { nama: "Produktivitas", slug: "produktivitas" },
  { nama: "Komunitas", slug: "komunitas" },
  { nama: "Marketplace", slug: "marketplace" },
];

// §6.6 parameters — stored in DB, never hard-coded in feature code.
const KONFIGURASI: { key: string; value: unknown }[] = [
  {
    key: "laju_rosot",
    // decay per day by position tier (§6.1)
    value: { "1": 0.25, "2_3": 0.18, "4_10": 0.12, "11_30": 0.07, "31_plus": 0.03, kaki_tiang: 0 },
  },
  { key: "ambang_tier", value: { top1: 1, top3: 3, top10: 10, top30: 30 } },
  { key: "kaki_tiang", value: 1000 },
  { key: "minimum_naik", value: 5000 },
  { key: "minimum_manjat_lagi", value: 1000 },
  { key: "jam_hitung_ulang", value: 1 },
  { key: "bobot_spotlight", value: "pegangan" },
];

// 15 listings, grips spread across tiers to mirror the §11 distribution shape:
// one summit ~Rp100k down to the Rp1.000 Kaki Tiang floor.
const LISTINGS: {
  nama: string;
  urlNormal: string;
  deskripsi: string;
  kategori: string;
  pegangan: number;
}[] = [
  { nama: "Nyala Analytics", urlNormal: "nyala.id", deskripsi: "Analitik web ramah privasi tanpa cookie, buatan Indonesia.", kategori: "saas", pegangan: 100000 },
  { nama: "Warungku POS", urlNormal: "warungku.app", deskripsi: "Aplikasi kasir dan stok untuk warung dan UMKM.", kategori: "saas", pegangan: 70000 },
  { nama: "Sinta AI", urlNormal: "sinta.ai", deskripsi: "Asisten menulis bahasa Indonesia untuk konten dan email.", kategori: "ai-tools", pegangan: 60000 },
  { nama: "Kirimin", urlNormal: "kirimin.id", deskripsi: "Bandingkan ongkir semua kurir dalam satu halaman.", kategori: "jasa", pegangan: 40000 },
  { nama: "Tania Tani", urlNormal: "taniatani.id", deskripsi: "Marketplace hasil tani langsung dari petani lokal.", kategori: "marketplace", pegangan: 35000 },
  { nama: "Ngoding.id", urlNormal: "ngoding.id", deskripsi: "Kursus coding bahasa Indonesia dengan proyek nyata.", kategori: "edukasi", pegangan: 30000 },
  { nama: "Rakit Hosting", urlNormal: "rakithosting.com", deskripsi: "Panel dan alat bantu hosting untuk developer indie.", kategori: "jasa", pegangan: 25000 },
  { nama: "Resepku", urlNormal: "resepku.app", deskripsi: "Kumpulan resep masakan Nusantara dengan takaran pas.", kategori: "konten", pegangan: 20000 },
  { nama: "Duitpintar", urlNormal: "duitpintar.id", deskripsi: "Pencatat keuangan pribadi sederhana dan aman.", kategori: "fintech", pegangan: 18000 },
  { nama: "Baca Cepat", urlNormal: "bacacepat.ai", deskripsi: "Ringkas artikel panjang jadi poin penting dengan AI.", kategori: "ai-tools", pegangan: 15000 },
  { nama: "Tokocraft", urlNormal: "tokocraft.id", deskripsi: "Toko online kerajinan tangan perajin daerah.", kategori: "ecommerce", pegangan: 8000 },
  { nama: "Absensi Kilat", urlNormal: "absensikilat.com", deskripsi: "Absensi karyawan berbasis lokasi tanpa mesin fingerprint.", kategori: "produktivitas", pegangan: 5000 },
  { nama: "Podcastin", urlNormal: "podcastin.id", deskripsi: "Hosting dan distribusi podcast untuk kreator lokal.", kategori: "konten", pegangan: 3000 },
  { nama: "Undangin", urlNormal: "undangin.id", deskripsi: "Buat kartu undangan digital dalam hitungan menit.", kategori: "jasa", pegangan: 2000 },
  { nama: "Latihan UTBK", urlNormal: "latihanutbk.id", deskripsi: "Bank soal dan tryout UTBK gratis untuk siswa.", kategori: "edukasi", pegangan: 1000 },
];

async function main() {
  await db.transaction(async (tx) => {
    // Reset seeded tables. CASCADE clears dependents; TRUNCATE bypasses the
    // row-level append-only trigger on pegangan_ledger.
    await tx.execute(sql`
      TRUNCATE TABLE
        sorak, tebakan, lencana, notifikasi_log, moderasi_log,
        posisi_snapshot, klik_harian, klik, transaksi, pegangan_ledger,
        listing, sponsor_kontak, kategori, konfigurasi, pengunjung_anon
      RESTART IDENTITY CASCADE
    `);

    const kats = await tx.insert(kategori).values(KATEGORI).returning({
      id: kategori.id,
      slug: kategori.slug,
    });
    const katBySlug = new Map(kats.map((k) => [k.slug, k.id]));

    await tx.insert(konfigurasi).values(
      KONFIGURASI.map((k) => ({ key: k.key, value: k.value, updatedBy: "seed" })),
    );

    for (const item of LISTINGS) {
      const kategoriId = katBySlug.get(item.kategori);
      if (!kategoriId) throw new Error(`Unknown kategori slug: ${item.kategori}`);

      const [kontak] = await tx
        .insert(sponsorKontak)
        .values({
          email: `${item.urlNormal.replace(/[^a-z0-9]/gi, "")}@example.id`,
          wa: "+628100000000",
          verifiedAt: sql`now()`,
        })
        .returning({ id: sponsorKontak.id });

      const [row] = await tx
        .insert(listing)
        .values({
          urlNormal: item.urlNormal,
          nama: item.nama,
          deskripsi: item.deskripsi,
          kategoriId,
          status: "tayang",
          peganganCached: item.pegangan, // = ledger sum below
          kontakId: kontak.id,
          catatan: "seed",
        })
        .returning({ id: listing.id });

      // Grip recorded as an append-only ledger event (Prinsip 1).
      await tx.insert(peganganLedger).values({
        listingId: row.id,
        jenis: "bayar",
        nominalSigned: item.pegangan,
        ref: "seed",
      });
    }
  });

  console.log(`seeded ${KATEGORI.length} kategori, ${KONFIGURASI.length} konfigurasi, ${LISTINGS.length} listing`);
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
