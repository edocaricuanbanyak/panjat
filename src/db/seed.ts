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
import { KATEGORI, KONFIGURASI } from "./seed-data";
import {
  kategori,
  konfigurasi,
  listing,
  peganganLedger,
  pengunjungAnon,
  sorak,
  sponsorKontak,
} from "./schema";

// 35 listings, grips spread across tiers to mirror the §11 distribution shape:
// one summit ~Rp100k down to the Rp1.000 Kaki Tiang floor (R11: 30–50 seed).
const LISTINGS: {
  nama: string;
  urlNormal: string;
  deskripsi: string;
  kategori: string;
  pegangan: number;
}[] = [
  { nama: "Nyala Analytics", urlNormal: "nyala.id", deskripsi: "Analitik web ramah privasi tanpa cookie, buatan Indonesia.", kategori: "saas", pegangan: 100000 },
  { nama: "Formku", urlNormal: "formku.id", deskripsi: "Bikin formulir dan survei online tanpa ngoding.", kategori: "jasa", pegangan: 90000 },
  { nama: "Antriq", urlNormal: "antriq.app", deskripsi: "Sistem antrean digital untuk klinik dan layanan publik.", kategori: "saas", pegangan: 82000 },
  { nama: "Belajarin", urlNormal: "belajarin.id", deskripsi: "Kelas online interaktif dengan mentor lokal.", kategori: "edukasi", pegangan: 75000 },
  { nama: "Warungku POS", urlNormal: "warungku.app", deskripsi: "Aplikasi kasir dan stok untuk warung dan UMKM.", kategori: "saas", pegangan: 70000 },
  { nama: "Jualio", urlNormal: "jualio.id", deskripsi: "Toko online instan buat jualan lewat link.", kategori: "ecommerce", pegangan: 66000 },
  { nama: "Sinta AI", urlNormal: "sinta.ai", deskripsi: "Asisten menulis bahasa Indonesia untuk konten dan email.", kategori: "ai-tools", pegangan: 60000 },
  { nama: "Chatbotku", urlNormal: "chatbotku.id", deskripsi: "Bikin chatbot WhatsApp untuk bisnis kecil.", kategori: "ai-tools", pegangan: 55000 },
  { nama: "Kelasin", urlNormal: "kelasin.id", deskripsi: "Platform jual kelas dan e-book buat kreator.", kategori: "edukasi", pegangan: 48000 },
  { nama: "Dompetku", urlNormal: "dompetku.app", deskripsi: "Dompet digital patungan buat keluarga dan tim.", kategori: "fintech", pegangan: 45000 },
  { nama: "Gamelan Quest", urlNormal: "gamelanquest.id", deskripsi: "Game petualangan bertema budaya Nusantara.", kategori: "game", pegangan: 42000 },
  { nama: "Kirimin", urlNormal: "kirimin.id", deskripsi: "Bandingkan ongkir semua kurir dalam satu halaman.", kategori: "jasa", pegangan: 40000 },
  { nama: "Desainin", urlNormal: "desainin.id", deskripsi: "Jasa desain grafis cepat langganan bulanan.", kategori: "jasa", pegangan: 38000 },
  { nama: "Tania Tani", urlNormal: "taniatani.id", deskripsi: "Marketplace hasil tani langsung dari petani lokal.", kategori: "marketplace", pegangan: 35000 },
  { nama: "Notulen AI", urlNormal: "notulen.ai", deskripsi: "Rekam dan ringkas rapat jadi notulen otomatis.", kategori: "ai-tools", pegangan: 33000 },
  { nama: "Ngoding.id", urlNormal: "ngoding.id", deskripsi: "Kursus coding bahasa Indonesia dengan proyek nyata.", kategori: "edukasi", pegangan: 30000 },
  { nama: "Sewain", urlNormal: "sewain.id", deskripsi: "Marketplace sewa alat, kamera, dan perlengkapan.", kategori: "marketplace", pegangan: 28000 },
  { nama: "Rakit Hosting", urlNormal: "rakithosting.com", deskripsi: "Panel dan alat bantu hosting untuk developer indie.", kategori: "jasa", pegangan: 25000 },
  { nama: "Komunitas Koding", urlNormal: "komunitaskoding.id", deskripsi: "Wadah belajar dan proyek bareng developer pemula.", kategori: "komunitas", pegangan: 22000 },
  { nama: "Resepku", urlNormal: "resepku.app", deskripsi: "Kumpulan resep masakan Nusantara dengan takaran pas.", kategori: "konten", pegangan: 20000 },
  { nama: "Duitpintar", urlNormal: "duitpintar.id", deskripsi: "Pencatat keuangan pribadi sederhana dan aman.", kategori: "fintech", pegangan: 18000 },
  { nama: "Fotoin", urlNormal: "fotoin.id", deskripsi: "Cari fotografer lokal untuk acara dan produk.", kategori: "jasa", pegangan: 17000 },
  { nama: "Baca Cepat", urlNormal: "bacacepat.ai", deskripsi: "Ringkas artikel panjang jadi poin penting dengan AI.", kategori: "ai-tools", pegangan: 15000 },
  { nama: "Streamku", urlNormal: "streamku.id", deskripsi: "Alat live streaming ringan untuk kreator lokal.", kategori: "konten", pegangan: 14000 },
  { nama: "Invoiceku", urlNormal: "invoiceku.id", deskripsi: "Buat dan kirim invoice profesional dalam sekejap.", kategori: "saas", pegangan: 12000 },
  { nama: "Tugasin", urlNormal: "tugasin.app", deskripsi: "Manajemen tugas tim sederhana ala kanban.", kategori: "produktivitas", pegangan: 10000 },
  { nama: "Tokocraft", urlNormal: "tokocraft.id", deskripsi: "Toko online kerajinan tangan perajin daerah.", kategori: "ecommerce", pegangan: 8000 },
  { nama: "Petualangan Nusantara", urlNormal: "petualangannusantara.id", deskripsi: "Game edukasi menjelajah pulau-pulau Indonesia.", kategori: "game", pegangan: 7000 },
  { nama: "Kabarku", urlNormal: "kabarku.id", deskripsi: "Ringkasan berita harian tanpa clickbait.", kategori: "konten", pegangan: 6000 },
  { nama: "Absensi Kilat", urlNormal: "absensikilat.com", deskripsi: "Absensi karyawan berbasis lokasi tanpa mesin fingerprint.", kategori: "produktivitas", pegangan: 5000 },
  { nama: "Zakatku", urlNormal: "zakatku.id", deskripsi: "Hitung dan salurkan zakat dengan mudah dan amanah.", kategori: "fintech", pegangan: 4000 },
  { nama: "Podcastin", urlNormal: "podcastin.id", deskripsi: "Hosting dan distribusi podcast untuk kreator lokal.", kategori: "konten", pegangan: 3000 },
  { nama: "Kuisin", urlNormal: "kuisin.id", deskripsi: "Bikin kuis interaktif buat kelas dan seminar.", kategori: "edukasi", pegangan: 2500 },
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

    // Kaki Tiang: free Rp0 listings (R16). No ledger row — grip is 0.
    const gratis: { nama: string; urlNormal: string; deskripsi: string; kategori: string }[] = [
      { nama: "Petani Pintar", urlNormal: "petanipintar.id", deskripsi: "Komunitas petani berbagi tips dan harga.", kategori: "komunitas" },
      { nama: "Catatan Kaki", urlNormal: "catatankaki.id", deskripsi: "Aplikasi catatan minimalis buatan indie.", kategori: "produktivitas" },
      { nama: "Rencanain", urlNormal: "rencanain.id", deskripsi: "Rencanakan acara dan bagi tugas ke panitia.", kategori: "produktivitas" },
      { nama: "Ngariung", urlNormal: "ngariung.id", deskripsi: "Cari dan buat meetup komunitas lokal.", kategori: "komunitas" },
      { nama: "Sketsa Harian", urlNormal: "sketsaharian.id", deskripsi: "Tantangan gambar harian buat ilustrator.", kategori: "konten" },
      { nama: "Tanya Dokter", urlNormal: "tanyadokter.id", deskripsi: "Tanya jawab kesehatan ringan dengan relawan medis.", kategori: "jasa" },
    ];
    const gratisIds: string[] = [];
    for (const g of gratis) {
      const [k] = await tx
        .insert(sponsorKontak)
        .values({ email: `${g.urlNormal.replace(/[^a-z0-9]/gi, "")}@example.id` })
        .returning({ id: sponsorKontak.id });
      const [row] = await tx
        .insert(listing)
        .values({
          urlNormal: g.urlNormal,
          nama: g.nama,
          deskripsi: g.deskripsi,
          kategoriId: katBySlug.get(g.kategori),
          status: "tayang",
          peganganCached: 0,
          kontakId: k.id,
          catatan: "seed-gratis",
        })
        .returning({ id: listing.id });
      gratisIds.push(row.id);
    }

    // A few anonymous visitors + Dukungan (Sorak) so the Kaki Tiang ordering and
    // the "Juara Kaki Tiang" wildcard have data. Cosmetic only — never money (R16).
    const anons = await tx
      .insert(pengunjungAnon)
      .values(Array.from({ length: 14 }, () => ({})))
      .returning({ id: pengunjungAnon.id });
    const tanggal = new Date().toISOString().slice(0, 10);
    const dukunganPlan = [11, 6, 4, 2, 1, 0]; // votes per gratis listing (index-aligned)
    for (let gi = 0; gi < gratisIds.length; gi++) {
      const n = dukunganPlan[gi] ?? 0;
      for (let j = 0; j < n; j++) {
        await tx.insert(sorak).values({ anonId: anons[j].id, listingId: gratisIds[gi], tanggal });
      }
    }
  });

  console.log(
    `seeded ${KATEGORI.length} kategori, ${KONFIGURASI.length} konfigurasi, ${LISTINGS.length} listing + 6 Kaki Tiang (with dukungan)`,
  );
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
