/**
 * Central copy deck (R20-c). Every user-facing string — UI labels, error
 * messages, and WhatsApp/email templates — lives here, not inline in components.
 * Tone follows §10.2: marketing surfaces may be playful; money surfaces
 * (payment, amounts, rules, dashboard, errors) stay plain and literal. The
 * retired "api/bara" fire vocabulary must never reappear.
 *
 * Error messages follow the pattern: what happened → consequence → what to do.
 * Never a bare error code.
 */
import { formatRupiah } from "@/lib/format";

export const copy = {
  merek: {
    nama: "Panjat",
    deskripsiSitus:
      "Bayar untuk manjat. Pegangan paling kuat duduk paling atas. Tiangnya licin — yang berhenti manjat, merosot.",
  },

  nav: {
    sepanjangMasa: "Papan Utama",
    hariIni: "Hari Ini",
    jelajah: "Jelajah",
    manjat: "Manjat",
    leaderboard: "Leaderboard",
    statistik: "Statistik",
    arsip: "Arsip",
    aturan: "Aturan",
    papanRingkas: "Papan",
  },

  beranda: {
    heroJudul: "Panjat. Salip. Jadi #1.",
    heroSub:
      "Pegangan paling kuat duduk paling atas. Tiangnya licin — yang berhenti manjat, merosot.",
    statOnline: "online",
    statPengunjung: "pengunjung",
    statPeserta: "pemanjat",
    papanKosongJudul: "Belum ada yang manjat.",
    papanKosongPesan: "Tiangnya masih kinclong.",
    caraMainJudul: "Cara main",
    punyaProduk: "Punya produk?",
  },

  caraMain: [
    ["1", "Tempel link produkmu", "Judul, deskripsi, dan kategori terisi otomatis."],
    ["2", "Pilih posisi & bayar", "Sistem yang menghitung rupiahnya. Bayar lewat QRIS/e-wallet."],
    ["3", "Naik — lalu merosot", "Tiangnya licin, semua turun pelan. Manjat lagi kalau mau bertahan."],
  ] as const,

  listing: {
    pratinjauAlt: (nama: string) => `Pratinjau situs ${nama}`,
  },

  papan: {
    aktivitas: "Aktivitas",
    juaraKakiTiang: "Juara Kaki Tiang minggu ini · gratis",
    salip: (rp: string) => `Salip ${rp}`,
    salipRank: (rank: number, rp: string) => `Salip #${rank} dengan ${rp}`,
    juara: (rank: number) => `Juara ${rank}`,
    salipSingkat: "Salip",
    klik: (n: number) => `${n.toLocaleString("id-ID")} klik`,
    kunjungiSitus: "Kunjungi situs",
    salipDiPapan: "Salip di papan",
    pagination: (hal: number, total: number) => `Halaman ${hal} / ${total}`,
    sebelumnya: "← Sebelumnya",
    berikutnya: "Berikutnya →",
  },

  manjat: {
    judul: "Naik tiang",
    kembaliPapan: "← Papan",
    steps: ["Detail", "Posisi", "Bayar"],
    urlLabel: "URL",
    urlPlaceholder: "nyala.id",
    urlHint: "Cukup tempel URL saja — sisanya kami isi otomatis.",
    urlHintMemuat: "Mengambil detail…",
    detailTerisi: "Detail terisi",
    cekLink: "Mengecek link & mengisi detail…",
    hapusUrl: "Hapus & tulis ulang",
    detailRingkas: "Judul, kategori & deskripsi — ketuk untuk ubah",
    posisiPrimer: "Kamu akan bayar",
    judulListing: "Judul",
    judulPlaceholder: "Nyala Analytics",
    kategori: "Kategori",
    deskripsi: "Deskripsi (160 kar.)",
    emailOpsional: "Email (opsional)",
    emailPlaceholder: "kamu@email.com",
    emailHint: "Isi kalau mau akses dasbor & notifikasi. Tanpa akun.",
    lanjut: "Lanjut",
    kembali: "Kembali",
    kembaliPosisi: "Kembali ke posisi",
    detail: "Detail",
    ubahDetail: "ubah detail",
    manjatPrefix: "Manjat:",
    posisiTanya: "Mau di posisi berapa? Sistem yang menghitung.",
    pratinjauSitus: "Pratinjau situsmu",
    pratinjauAlt: (nama: string) => `Pratinjau situs ${nama}`,
    nominalLabel: "Nominal (Rp)",
    nominalPlaceholder: "25.000",
    nominalTanya: "Mau bayar berapa? Posisi dihitung otomatis.",
    nominalNaik: "Makin besar bayarannya, makin tinggi posisimu. Minimal Rp5.000.",
    nominalDinaikkan: (rp: string) => `Di bawah minimum — otomatis dinaikkan ke ${rp}.`,
    diPosisi: "Kamu akan di posisi",
    ketikNominal: "Ketik nominal untuk lihat posisimu di papan.",
    kamuBadge: "kamu",
    listingKamu: "Listing kamu",
    salipTambah: (extra: string, rank: number) => `Tambah ${extra} → salip #${rank}`,
    jadiPuncak: "🚩 Kamu jadi #1 — puncak!",
    papanPratinjau: "Posisimu di papan",
    posisiRingkas: (rosot: string, estimasiHari: number | null) =>
      `Merosot ~${rosot}/hari · ` +
      (estimasiHari === null ? "stabil (kaki tiang)" : `bertahan ~${estimasiHari} hari`),
    akanBayar: "Kamu akan bayar",
    bayar: (rp?: string) => (rp ? `Bayar ${rp}` : "Bayar"),
    bayarMinimal: (rp: string) => `Bayar minimal ${rp}`,
    consentSetuju: "Saya setuju dengan",
    consentKetentuan: "Ketentuan",
    consentAturan: "Aturan main",
    consentRosot: ", dan paham pegangan bisa rosot (turun) seiring waktu.",
    bayarQris: (rp: string) => `Bayar ${rp} lewat QRIS`,
    memproses: "Memproses…",
    menghitung: "Menghitung…",
    pilihTarget: "Pilih target posisi.",
    yakinBayar: (rp: string) => `Saya yakin membayar ${rp}.`,
    diprosesJudul: "Pembayaran diproses",
    diprosesPesan: "Posisimu akan muncul di papan begitu pembayaran dikonfirmasi.",
    kePapan: "Ke papan",
    // Quote summary line under the amount selector.
    quoteRingkas: (rank: number, rosotRp: string, estimasiHari: number | null) =>
      `Posisi #${rank} · merosot ~${rosotRp}/hari · ` +
      (estimasiHari === null ? "stabil (kaki tiang)" : `bertahan ~${estimasiHari} hari`),
    ringkasListing: "Listing",
    ringkasTarget: "Target posisi",
    ringkasEstimasi: "Estimasi bertahan",
    ringkasTotal: "Total",
    stabil: "stabil",
    bertahanHari: (n: number) => `~${n} hari`,
  },

  favorit: {
    judul: "Pemanjat terfavorit",
    hadiah: "Juara minggu ini diposting di Instagram + gratis iklan 1 hari.",
    labelBelumVote: "vote gratis · 1×/hari",
    sudahVote: "sudah vote",
    ajakan: "Pilih favoritmu — bukan soal uang, soal selera. Sekali sehari.",
    pilihListing: "Pilih listing…",
    cari: "Cari pemanjat…",
    takAda: "Tidak ada listing yang cocok.",
    vote: "Vote",
    vote_n: (n: number) => `${n.toLocaleString("id-ID")} vote`,
    belumAda: "Jadilah yang pertama menerima suara.",
  },

  kakiTiang: {
    judul: "Kaki Tiang",
    sisaDukungan: (n: number) => `${n} dukungan tersisa hari ini`,
    ajakan: "Listing gratis. Beri dukungan untuk yang bagus — yang paling didukung naik ke tiang.",
    dukung: "Dukung",
    dukungan_n: (n: number) => `${n.toLocaleString("id-ID")} dukungan`,
    kosong: "Belum ada yang manjat. Tiangnya masih kinclong.",
    pasangGratisTaut: "Pasang gratis di Kaki Tiang",
  },

  momen: {
    eyebrow: "Momen Puncak",
    dipuncak: "Kamu di puncak!",
    naik: (rank: number) => `Kamu naik ke #${rank}`,
    ringkas: (nama: string, pegangan: string) => `${nama} · pegangan ${pegangan}`,
    menyalip: (n: number) => `menyalip ${n} pemanjat`,
    share: (rank: number) => `Aku #${rank} di Panjat!`,
    kartuAlt: (nama: string) => `Kartu ${nama}`,
    siapkanPratinjau: "Menyiapkan pratinjau…",
    bagikanAjak: "Simpan & pamerkan 👇",
    lihatPapan: "Lihat leaderboard",
    pilihUkuran: "Pilih ukuran kartu",
    unduh: "Unduh kartu",
    mengunduh: "Menyiapkan…",
  },

  privasi: {
    metaTitle: "Kebijakan Privasi — Panjat",
    judul: "Kebijakan Privasi",
    butir: [
      ["Data yang kami simpan.", " Kontak sponsor (email/WA) untuk dasbor & notifikasi; hash IP klik bersalt (bukan IP mentah); cookie anonim tanpa data pribadi untuk fitur penonton."],
      ["Berapa lama.", " Klik mentah 13 bulan lalu dihapus (agregat harian permanen). Log notifikasi 6 bulan. Data transaksi mengikuti kewajiban pajak/audit."],
      ["Hakmu.", " Kamu bisa berhenti berlangganan notifikasi kapan saja, dan meminta penghapusan data kontak."],
    ] as const,
    draf: "Draf — menunggu tinjauan hukum sebelum peluncuran publik.",
  },

  ketentuan: {
    metaTitle: "Syarat & Ketentuan — Panjat",
    judul: "Syarat & Ketentuan",
    peganganTebal: "Pegangan & refund.",
    peganganSisa:
      " Peringkat ditentukan pegangan; tidak ada refund untuk pegangan berjalan, kecuali listing ditolak moderasi (dana kembali penuh). Lihat ",
    peganganLink: "Aturan",
    butir: [
      ["Moderasi & konten.", " Konten judi/slot, dewasa, pinjol ilegal, dan penipuan ditolak. Kami dapat menahan atau menurunkan listing yang melanggar."],
      ["Kepemilikan URL.", " Pemilik sah sebuah URL berhak mengklaim atau meminta penurunan listing atas URL-nya (verifikasi diperlukan)."],
      ["Tanggung jawab.", " Panjat tidak bertanggung jawab atas konten atau produk pihak sponsor."],
    ] as const,
    draf: "Draf — menunggu tinjauan hukum sebelum peluncuran publik.",
  },

  jelajah: {
    cariPlaceholder: "cari AI tools, jasa, game…",
    semua: "Semua",
    kosong: "Tidak ada listing yang cocok. Coba kata kunci atau kategori lain.",
  },

  hariIni: {
    judul: "Papan Hari Ini",
    sub: "Hanya pegangan yang dibayar sejak tengah malam. Uang kemarin tidak berlaku — siapa pun dengan Rp20.000 punya peluang jadi juara. Reset 00:00 WIB.",
    metaTitle: "Papan Hari Ini — Panjat",
    metaDesc: "Papan yang reset tiap tengah malam WIB. Siapa pun bisa juara hari ini.",
  },

  statistik: {
    judul: "Statistik",
    sub: "Angka buat nakar sebelum manjat — publik, bersumber data first-party.",
    diperbarui: (waktu: string) => `Diperbarui ${waktu} WIB · dihitung ulang tiap kunjungan`,
    metaTitle: "Statistik — Panjat",
    metaDesc: "Angka publik Panjat buat calon pemanjat: harga puncak, biaya masuk 20 besar, klik 7 hari, CPC, sponsor aktif, pergantian puncak.",
    hargaPuncak: "Harga puncak sekarang",
    hargaPuncakSub: "buat duduk di #1",
    hargaPuncakMetode: "Pegangan pemegang #1 — dari ledger pembayaran.",
    hargaMasuk20: "Biaya masuk 20 besar",
    hargaMasuk20Sub: "pegangan peringkat ke-20",
    hargaMasuk20Metode: "Pegangan peringkat ke-20 yang tayang saat ini.",
    hargaMasuk20Terbuka: "Masih terbuka",
    hargaMasuk20TerbukaSub: "slot 20 besar belum penuh",
    klik7: "Klik 7 hari terakhir",
    klik7Sub: (perHari: string) => `± ${perHari}/hari`,
    klik7Metode: "Dihitung server saat redirect /k/, dedup per IP+UA 6 jam.",
    cpc: "CPC rata-rata",
    cpcSub: "rupiah per klik terkirim",
    cpcMetode: "Σbayar terverifikasi ÷ Σklik valid (sepanjang masa).",
    sponsor: "Sponsor aktif",
    sponsorSub: "sedang tayang di papan",
    sponsorMetode: "Jumlah listing berstatus tayang.",
    puncakBerganti: "Puncak berganti (7 hari)",
    puncakBergantiSub: "makin sering = makin kontestabel",
    puncakBergantiMetode: "Pergantian #1 dari snapshot posisi per jam.",
    pengunjung: "Total pengunjung",
    pengunjungSub: "jangkauan sejak awal",
    pengunjungMetode: "Pengunjung unik — cookie anon httpOnly bertanda-tangan.",
    online: "Online sekarang",
    onlineSub: "lagi lihat papan",
    onlineMetode: "Pengunjung anon aktif beberapa menit terakhir.",
  },

  arsip: {
    judul: "Arsip Juara",
    sub: "Posisi disewa, tapi sejarah permanen. Setiap juara harian tersimpan selamanya.",
    metaTitle: "Arsip Juara — Panjat",
    metaDesc: "Setiap juara harian, tersimpan permanen.",
    kosong: "Belum ada juara yang diarsipkan.",
    mingguanJudul: "Juara minggu ini",
    mingguanPekan: (minggu: string) => `Pekan ${minggu}`,
    unduhKartu: "Unduh kartu Instagram",
    harianJudul: "Juara harian",
    jenis: {
      papan1: "Juara 1",
      papan2: "Juara 2",
      papan3: "Juara 3",
      terfavorit: "Terfavorit",
      kaki_tiang: "Juara Kaki Tiang",
    } as Record<string, string>,
  },

  aturan: {
    metaTitle: "Aturan — Panjat",
    metaDesc: "Bagaimana tiang licin bekerja: laju rosot per posisi, contoh angka, dan kebijakan.",
    judul: "Aturan",
    intro:
      "Kamu bayar untuk manjat. Pegangan paling kuat duduk paling atas. Tiangnya licin — semua merosot pelan-pelan. Manjat lagi kalau mau bertahan.",
    tabelJudul: "Seberapa licin? (laju rosot per hari)",
    kolomPosisi: "Posisi",
    kolomRosot: "Rosot / hari",
    tierR1: "#1 (puncak)",
    tierR2_3: "#2–3",
    tierR4_10: "#4–10",
    tierR11_30: "#11–30",
    tierR31: "#31 ke bawah",
    tierKaki: (rp: string) => `Pegangan ≤ ${rp} (Kaki Tiang)`,
    contoh: (grip: string, rosot: string, sisa: string) =>
      `Contoh: pegangan ${grip} di #1 → merosot ${rosot}/hari. Berhenti manjat, dalam ~5 hari tinggal ~${sisa}. Papan pulih sendiri.`,
    peringkatTebal: "Peringkat murni ditentukan pegangan.",
    peringkatSisa: " Tidak ada algoritma tersembunyi, dan tidak ada posisi yang dijual di luar sistem.",
    refundTebal: "Tidak ada refund",
    refundSisa: " untuk pegangan yang sudah dibayar, kecuali listing ditolak moderasi (dana kembali penuh).",
    rosotServer: (rp: string) =>
      `Rosot dihitung server-side tiap jam. Pegangan berhenti merosot di ${rp} (Kaki Tiang) dan listing tidak pernah dihapus karena merosot.`,
  },

  pasangGratis: {
    judul: "Pasang gratis",
    subJudul: "Listing gratis di Kaki Tiang, diurut dukungan pengunjung.",
    urlPlaceholder: "produkku.id",
    judulPlaceholder: "Produkku",
    emailHint: "Isi kalau mau kelola listing nanti.",
    tombol: "Pasang di Kaki Tiang",
    sisaSlot: (sisa: number, total: number) =>
      `Siapa cepat — sisa ${sisa} dari ${total} slot gratis minggu ini.`,
    penuh: "Slot gratis minggu ini sudah penuh. Coba lagi minggu depan, atau naik tiang berbayar.",
  },

  dasbor: {
    judul: "Dasbor",
    keluar: "Keluar",
    belumAdaListing: "Belum ada listing atas akun ini.",
    manjatSekarang: "Manjat sekarang",
    masukJudul: "Masuk dasbor",
    masukSub: "Pantau pegangan, klik, dan CPC listing kamu.",
    statPegangan: "Pegangan",
    statPosisi: "Posisi",
    statRosot: "Laju rosot",
    statEstimasi: "Estimasi bertahan",
    statKlik: "Klik hari ini",
    statCpc: "CPC",
    posisi7: "Posisi 7 hari",
    pratinjauSitus: "Pratinjau situs",
    segarkan: "Segarkan pratinjau",
    menyegarkan: "Menyegarkan…",
    belumAdaPratinjau: "Belum ada pratinjau. Segarkan untuk menangkap tampilan situsmu.",
    deskripsi: "Deskripsi",
    riwayat: "Riwayat pembayaran",
    jagaJudul: "Jaga posisi otomatis",
    jagaKet: "Sistem otomatis manjat lagi kalau kamu merosot di bawah target — pakai kartu/e-wallet berulang, bukan saldo. Berhenti kapan saja.",
    jagaTarget: "Target",
    jagaTop1: "Tetap #1",
    jagaTop3: "Tetap Top 3",
    jagaTop10: "Tetap Top 10",
    jagaBudget: "Tambah budget (Rp)",
    jagaSisa: (rp: string) => `Sisa budget: ${rp}`,
    jagaAktif: "Aktif",
    jagaSimpan: "Simpan",
    jagaTersimpan: "Tersimpan ✓",
    belumBayar: "Belum ada pembayaran.",
    manjatLagi: "Manjat lagi",
    stabil: "stabil",
    perHari: (rp: string) => `${rp}/hari`,
    perKlik: (rp: string) => `${rp}/klik`,
    totalKlik: (n: number) => `total ${n}`,
    cpcSub: "biaya rosot ÷ klik hari ini",
    cpcBelum: "belum ada klik",
    bertahanHari: (n: number) => `~${n} hari`,
  },

  admin: {
    judulAntrean: "Antrean moderasi",
    keluar: "Keluar",
    menunggu: (n: number) => `${n} listing menunggu keputusan.`,
    kosong: "Antrean kosong.",
    loloskan: "Loloskan",
    tolak: "Tolak + refund",
    laporanJudul: (n: number) => `Laporan & klaim (${n})`,
    tidakAdaLaporan: "Tidak ada laporan terbuka.",
    turunkan: "Turunkan + refund",
    tutupLaporan: "Tutup laporan",
    klaimUrl: "KLAIM URL",
    laporan: "LAPORAN",
    alasan: (a: string) => `Alasan: ${a}`,
    masukJudul: "Admin",
    passwordPlaceholder: "Password admin",
    kode2fa: "Kode 2FA (6 digit)",
    masuk: "Masuk",
  },

  lapor: {
    judul: "Laporkan / klaim",
    metaTitle: "Laporkan / klaim — Panjat",
    intro: (nama: string) =>
      `Listing: ${nama}. Laporan diputus manusia. Pemilik sah URL berhak meminta penurunan listing atas URL-nya.`,
    jenis: "Jenis",
    jenisLapor: "Laporkan konten bermasalah",
    jenisKlaim: "Klaim: saya pemilik URL ini",
    pesan: "Pesan",
    kontak: "Kontak kamu (untuk verifikasi klaim)",
    kontakPlaceholder: "email atau WA",
    kirim: "Kirim",
    kembali: "← Kembali",
  },

  footer: [
    ["/aturan", "Aturan"],
    ["/arsip", "Arsip Juara"],
    ["/statistik", "Statistik"],
    ["/privasi", "Privasi"],
    ["/ketentuan", "Ketentuan"],
  ] as const,

  /**
   * Errors: what happened → consequence → what to do. Plain and literal.
   */
  error: {
    urlWajib: "URL belum diisi. Kami butuh alamat produkmu untuk memasangnya — tempel dulu URL-nya.",
    bodyTidakValid: "Data yang dikirim tidak terbaca. Coba ulangi dari awal.",
    listingTidakDitemukan: "Listing ini tidak ada atau sudah tidak tayang. Segarkan papan lalu coba lagi.",
    nominalWajib: "Nominal belum diisi. Masukkan jumlah rupiah yang mau kamu bayar.",
    gagalProses: "Gagal memproses. Coba lagi sebentar lagi.",
    gagalHitung: "Gagal menghitung posisi. Cek koneksi lalu coba lagi.",
    gagalTagihan: "Gagal membuat tagihan. Pembayaran belum berjalan — coba lagi sebentar lagi.",
    tautanKedaluwarsa: "Tautan tidak valid atau sudah kedaluwarsa. Minta tautan baru untuk masuk.",
    passwordSalah: "Password salah. Coba lagi.",
    terlaluBanyak: "Terlalu banyak percobaan. Tunggu sebentar sebelum mencoba lagi.",
    kunjunganTakDikenal: "Kunjunganmu belum dikenali. Muat ulang halaman lalu coba lagi.",
    sudahVoteHariIni: "Kamu sudah vote hari ini. Besok bisa vote lagi.",
    terlaluBanyakPermintaan: "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.",
    terlaluBanyakGratis: "Terlalu banyak listing gratis dari sini. Coba lagi nanti.",
    targetTidakDikenal: "Target posisi tidak dikenal. Pilih ulang targetnya.",
    targetWajib: "Pilih target posisi atau isi nominal dulu.",
    urlTidakValid: "URL tidak valid. Cek lagi alamatnya lalu coba lagi.",
  },

  /**
   * WhatsApp/email templates (R3). Keep money-plain; always include the
   * one-click "manjat lagi" and unsubscribe links.
   */
  notif: {
    disalipSubjek: "Kamu disalip di Panjat",
    disalip: (d: { toRank: number; tierLabel: string; pegangan: number; manjatLink: string; unsubLink: string }) => {
      const headline = `Kamu merosot ke #${d.toRank}, keluar dari ${d.tierLabel}.`;
      return {
        headline,
        email:
          `${headline}\nPeganganmu sekarang ${formatRupiah(d.pegangan)}.\n` +
          `Manjat lagi: ${d.manjatLink}\nBerhenti berlangganan: ${d.unsubLink}`,
        wa: `${headline} Manjat lagi: ${d.manjatLink}`,
      };
    },
  },
} as const;
