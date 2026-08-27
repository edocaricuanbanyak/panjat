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
    sepanjangMasa: "Sepanjang Masa",
    hariIni: "Hari Ini",
    jelajah: "Jelajah",
    manjat: "Manjat",
  },

  beranda: {
    heroJudul: "Panjat terusss.",
    heroSub:
      "Pegangan paling kuat duduk paling atas. Tiangnya licin — yang berhenti manjat, merosot.",
    statOnline: "online",
    statPengunjung: "pengunjung",
    statPeserta: "peserta manjat",
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

  papan: {
    aktivitas: "Aktivitas",
    juaraKakiTiang: "Juara Kaki Tiang · gratis",
    salip: (rp: string) => `Salip ${rp}`,
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
    detailRingkas: "Detail (terisi otomatis)",
    judulListing: "Judul",
    judulPlaceholder: "Nyala Analytics",
    kategori: "Kategori",
    deskripsi: "Deskripsi (160 kar.)",
    emailOpsional: "Email (opsional)",
    emailPlaceholder: "kamu@email.com",
    emailHint: "Isi kalau mau akses dasbor & notifikasi. Tanpa akun.",
    lanjut: "Lanjut",
    kembali: "Kembali",
    detail: "Detail",
    ubahDetail: "ubah detail",
    manjatPrefix: "Manjat:",
    posisiTanya: "Mau di posisi berapa? Sistem yang menghitung.",
    nominalLabel: "Nominal (Rp)",
    nominalPlaceholder: "25.000",
    akanBayar: "Kamu akan bayar",
    bayar: (rp?: string) => (rp ? `Bayar ${rp}` : "Bayar"),
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
    vote: "Vote",
    vote_n: (n: number) => `${n.toLocaleString("id-ID")} vote`,
    belumAda: "Jadilah yang pertama menerima suara.",
  },

  kakiTiang: {
    judul: "Kaki Tiang",
    sisaDukungan: (n: number) => `${n} dukungan tersisa hari ini`,
    ajakan: "Listing gratis. Beri dukungan untuk yang bagus — yang paling didukung naik di sini.",
    dukung: "Dukung",
    dukungan_n: (n: number) => `${n.toLocaleString("id-ID")} dukungan`,
    kosong: "Belum ada yang manjat. Tiangnya masih kinclong.",
    pasangGratisTaut: "Pasang gratis di Kaki Tiang",
  },

  jelajah: {
    sub: "Cari berdasarkan relevansi — bukan siapa yang bayar paling banyak.",
    cariPlaceholder: "cari AI tools, jasa, game…",
    semua: "Semua",
    kosong: "Tidak ada listing yang cocok. Coba kata kunci atau kategori lain.",
  },

  hariIni: {
    sub: "Hanya pegangan yang dibayar sejak tengah malam. Uang kemarin tidak berlaku — siapa pun dengan Rp20.000 punya peluang jadi juara. Reset 00:00 WIB.",
  },

  pasangGratis: {
    judul: "Pasang gratis",
    subJudul: "Listing gratis di Kaki Tiang, diurut dukungan pengunjung.",
    tombol: "Pasang di Kaki Tiang",
  },

  footer: [
    ["/aturan", "Aturan"],
    ["/arsip", "Arsip Juara"],
    ["/statistik", "Statistik"],
    ["/pasang-gratis", "Pasang gratis"],
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
