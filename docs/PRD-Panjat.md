# PRD — Panjat

**Papan peringkat berbayar. Bayar untuk manjat. Tiangnya licin — yang berhenti manjat, merosot.**

| | |
|---|---|
| Versi | 1.3 |
| Tanggal | 26 Agustus 2026 |
| Domain | **panjat.id** (dipilih — daftarkan segera, lihat §15) |
| Perubahan dari v1.2 | Ditambah R22 (P1): Jelajah & Pencarian — permukaan penemuan untuk pengunjung, terpisah tegas dari papan berbayar. D4 dipertajam: tontonan + kegunaan. Metrik penemuan ditambahkan. F3 diperbarui. |
| Perubahan dari v1.1 | Ditambah R21 (P1): pratinjau screenshot situs listing — penempatan, arsitektur worker, moderasi visual, proteksi SSRF lapis kedua. F2 diperbarui. |
| Perubahan dari v1.0 | §17.2 diperluas: skema lengkap 13 tabel, ledger pegangan, state machine listing, aturan seri/race, retensi & backup. Ditambah §18 Keamanan (R19). Ditambah §9.7 Kelengkapan UX (R20). F1 diperbarui. |
| Perubahan dari v0.9 (PRD-Bara) | **Fork identitas penuh.** Nama: Bara → Panjat. Metafora: api → panjat pinang. §5–§6: bara → pegangan, laju bakar → laju rosot. §9.6 ditulis ulang: tema terang siang hari, tiang sebagai signature, umbul-umbul. §10 ditulis ulang total. Gamification: Nyala → Sorak. §15: keputusan nama final. Mekanik, angka, requirement, dan arsitektur **tidak berubah** — hanya bahasa dan kulitnya. |
| Status | Mekanik belum divalidasi — lihat §13 |
| Pembanding | pamerin.lol, pake.ai, Product Hunt, Million Dollar Homepage |

---

## 1. Ringkasan Eksekutif

Pamerin.lol dan Pake.ai membuktikan satu hal: **orang Indonesia mau bayar Rp10.000–Rp1.000.000 hanya untuk melihat namanya di posisi teratas sebuah papan publik.** Yang dijual bukan iklan, tapi status — gengsi yang bisa di-screenshot.

Tapi model mereka punya cacat struktural: **peringkat itu permanen.** Begitu #1 dikunci di Rp1.000.000, papan membeku. Pendatang baru tahu mereka tidak akan pernah sampai puncak, jadi tidak ikut. Pemenang tidak punya alasan bayar lagi. Pengunjung berhenti datang, klik turun, nilai sponsor ikut turun. Pendapatan platform mendekati nol setelah gelombang pertama.

**Panjat memperbaikinya dengan satu perubahan: tiangnya licin.** Nominal yang dibayar menjadi peganganmu di tiang. Selama peganganmu paling kuat, kamu di puncak. Berhenti manjat, kamu merosot pelan-pelan. Puncak selalu bisa direbut, dan itu yang membuat papan hidup selamanya.

Metafora ini bukan tempelan — ini panjat pinang, memori nasional lintas kelas dan generasi yang mekaniknya **identik** dengan produk: tiang licin, merosot kalau diam, hadiah di puncak, kerumunan yang menonton dan bersorak. Produk ini bisa dijelaskan di tongkrongan dalam satu kalimat: *"Kayak panjat pinang, tapi buat promosi produk — tiangnya beneran licin."*

Kompensasi psikologisnya: yang permanen adalah **trofinya**, bukan posisinya. Setiap orang yang pernah sampai puncak masuk arsip selamanya, lengkap dengan kartu flex siap IG Story.

---

## 1.5 Positioning & Differentiation

### Pernyataan posisi

> **Sampai puncak harganya sekitar Rp95.000 — dan minggu depan tetap sekitar Rp95.000. Di papan lain, #1 harganya Rp1.000.001 dan naik selamanya.**

Ini kalimat untuk landing page, pitch, dan jawaban "bedanya apa?". Dipahami dalam tiga detik tanpa menjelaskan mekanik. Tiang licin bukan USP-nya — tiang licin adalah cara teknis menghasilkan janji ini.

### Empat pembeda, urut kekuatan

**D1. Puncak yang terjangkau dan selalu terbuka.**
Di papan permanen, ~95% sponsor tahu sejak hari pertama mereka tidak akan pernah jadi #1 — membayar untuk posisi #40 dan tidak mendapat apa pun secara emosional. Panjat menjual **kemenangan yang benar-benar bisa dibeli** dengan uang di bawah Rp100.000.
*Diwujudkan oleh:* §6.1 rosot progresif, §6.2 kenaikan lokal Rp1, §6.3 Papan Hari Ini.

**D2. ROI yang terlihat.**
Kompetitor hanya menampilkan hitungan klik mentah. Panjat menampilkan **biaya per klik**, dan angkanya (Rp62–500) mengalahkan Meta Ads 10–60×. Ini mengubah transaksi dari pembelian impulsif menjadi belanja iklan yang bisa dibenarkan — dan orang berbelanja berulang untuk hal yang bisa dibenarkan.
*Diwujudkan oleh:* R4 dasbor, §6.5 CPC selalu tampil.

**D3. Trofi permanen di atas posisi sewaan.**
Kompetitor menjual posisi tapi tidak menjual **bukti**. Kartu IG Story otomatis dan arsip juara memberi artefak permanen, sekaligus mesin distribusi gratis.
*Diwujudkan oleh:* R5 kartu flex, P1 Arsip Juara.

**D4. Papan yang layak ditonton — dan berguna.**
Dua sisi yang sama pentingnya. *Tontonan*: drama perebutan puncak, Tebak Juara, feed realtime. *Kegunaan*: pengunjung datang dengan tugas nyata — "cari AI tools untuk X", "cari jasa Y" — dan pulang dengan jawaban lewat Jelajah (R22). Papan yang diurut uang saja tidak bernilai bagi pengunjung → trafik mati → klik mati → nilai sponsor mati. **Sponsor membayar untuk mata, dan mata datang untuk dua alasan: menonton dan mencari.**
*Diwujudkan oleh:* R1 papan realtime, R6 kategori, R7 Papan Hari Ini, R16 Sorak, R22 Jelajah & Pencarian.

**D5 (bonus dari fork identitas). Nama yang membawa ceritanya sendiri.**
"Bara" butuh dilihat untuk dipahami; "Panjat" cukup didengar. Untuk produk yang hidup dari cerita mulut ke mulut, ini pembeda distribusi yang nyata — dan tidak bisa ditiru pesaing tanpa terlihat menjiplak tradisi yang sudah kamu klaim.

### Apa yang bukan moat

D1–D3 bisa ditiru pesaing dalam ~2 minggu. **Ini kepala start, bukan parit.** Konsekuensinya: kecepatan rilis F1 lebih penting daripada kelengkapan fitur.

Yang sulit ditiru tumbuh dari waktu:

| Aset | Kenapa sulit ditiru |
|---|---|
| **Likuiditas** | Kategori winner-take-all. Sponsor pergi ke papan yang paling dilihat; pengunjung ke papan yang paling ramai. Papan kedua tidak punya alasan hidup |
| **Arsip** | Setahun = 365 juara harian dan ratusan mantan #1. Pesaing mulai dari nol dan tidak bisa membeli sejarah |
| **Ritual** | Reset harian menciptakan janji temu — orang mengecek papan tiap pagi seperti mengecek skor |
| **Klaim budaya** | Yang pertama memakai panjat pinang memiliki asosiasinya. Peniru kedua otomatis terbaca KW |

### Risiko yang menggantung di atas seluruh positioning

**D2 bertumpu pada klik nyata.** Kalau #1 hanya menerima ~60 klik/hari, CPC jadi Rp400+ dan D2 runtuh — produk kembali jadi barang gengsi murni, dan barang gengsi tidak dibeli berulang. Angka klik minggu pertama adalah data terpenting proyek ini. Kalau CPC jelek, respons yang benar adalah menaikkan trafik pengunjung (D4), bukan menurunkan harga.

---

## 2. Problem Statement

Solo founder, indie hacker, kreator, dan pemilik UMKM digital Indonesia punya produk tapi tidak punya distribusi. Budget iklan mereka di bawah Rp100.000 — terlalu kecil untuk Meta/Google Ads yang butuh minimum spend, riset audiens, dan kesabaran seminggu sebelum ada sinyal. Mereka butuh yang murah, instan, dan **terasa** memuaskan.

Papan peringkat berbayar yang ada menjawab kebutuhan itu tapi mati dalam 4–8 minggu: top slot beku, tidak ada alasan kembali, pengunjung tidak punya alasan datang kedua kali. Kategori ini sedang panas; pemain pertama yang memecahkan retensi mengambil seluruh pasar.

**Bukti (observasi publik, belum divalidasi wawancara):**
- Pamerin.lol: 2.862 pengunjung, ~84 listing aktif, #1 di Rp1.000.000, ekor panjang Rp1.000–Rp10.000. Ada listing 79.299 klik — trafik nyata terjadi.
- Dua segmen jelas: "iseng" (Rp1.000–15.000) dan "serius" (Rp50.000–1jt).
- Pake.ai membeli #1 Pamerin seharga Rp1.000.000 — papan ini dipakai sebagai kanal akuisisi nyata.

---

## 3. Goals

| # | Goal | Ukuran keberhasilan |
|---|---|---|
| G1 | Puncak selalu bisa direbut | ≥ 8 pergantian #1 per bulan pada bulan ke-3 |
| G2 | Pembelian sekali jadi belanja berulang | ≥ 35% sponsor manjat lagi dalam 30 hari |
| G3 | Sponsor dapat nilai nyata | Median CPC ≤ Rp500; ≥ 60% sponsor membuka dasbor |
| G4 | Pengunjung kembali tanpa membayar | ≥ 25% sesi dari pengunjung berulang di bulan ke-2 |
| G5 | Setiap transaksi menghasilkan distribusi gratis | ≥ 30% sponsor membagikan kartu flex |
| G6 | Puncak terjangkau segmen <Rp100rb | Median pegangan #1 di rentang Rp80.000–150.000 |

---

## 4. Non-Goals

| Tidak dikerjakan di v1 | Alasan |
|---|---|
| Bagi hasil / affiliate sponsor | Kompleksitas akuntansi sebelum bukti retensi |
| API publik dan embed widget | Belum ada permintaan; tunda sampai ada sponsor Rp500rb+ |
| Rating, review, komentar | Moderasi berat dan drama; Sorak cukup sebagai sinyal |
| Kurasi editorial | Merusak kontrak "pegangan menentukan posisi"; kejelasan aturan adalah fitur |
| Multi-bahasa / luar Indonesia | Nama dan metafora sangat lokal — itu justru kekuatannya. Menang di Indonesia dulu |
| Aplikasi mobile native | Web mobile-first + WhatsApp menutup 95% kebutuhan |
| Saldo mengendap / dompet | Risiko ranah uang elektronik (§13.1). Pembayaran langsung jadi pegangan, tidak mengendap |
| Ornamen 17-an harfiah (clip-art bendera, kemerdekaan-kitsch) | Metafora dipakai pada level mekanik dan bahasa, bukan dekorasi lomba agustusan (§9.6) |

---

## 5. Mekanik Inti — Pegangan & Tiang Licin

Harus bisa dijelaskan dalam satu kalimat ke orang awam:

> **Kamu bayar untuk manjat. Pegangan paling kuat duduk paling atas. Tiangnya licin — semua orang merosot pelan-pelan. Manjat lagi kalau mau bertahan.**

| Aturan | Detail |
|---|---|
| Nilai awal | Pegangan = nominal rupiah yang dibayar. Bayar Rp50.000 → pegangan 50.000 |
| Peringkat | Diurutkan dari pegangan terkuat. Titik. Tidak ada algoritma tersembunyi |
| Rosot | Progresif menurut posisi — §6.1. Dihitung per jam agar halus dan tanpa kejutan tengah malam |
| Manjat lagi | Top-up berapa pun memperkuat pegangan langsung |
| Kaki tiang | Pegangan berhenti merosot di Rp1.000 dan listing tetap tampil di ekor papan selamanya. **Tidak ada listing yang dihapus karena merosot habis** |
| Menyalip | Cukup melampaui pegangan di atasmu Rp1 |
| Seri | Yang lebih dulu mencapai nominal itu menang |
| Minimum | Rp5.000 untuk naik tiang pertama kali (ambang biaya QRIS), Rp1.000 untuk manjat lagi |
| Gratis | Listing Rp0 berkumpul di **Kaki Tiang** di bawah semua listing berbayar, diurut Sorak pengunjung. Tidak pernah naik di atas listing berbayar |

### Kenapa tiang licin, bukan permanen

| Efek | Permanen (Pamerin) | Panjat |
|---|---|---|
| Puncak papan | Beku setelah 1–2 bulan | Selalu bisa direbut |
| Pendapatan | Sekali per sponsor | Berulang, tanpa langganan |
| Alasan kembali | Hanya kalau disalip | Setiap hari posisi bergerak |
| Rasa sponsor | "Sudah beli, selesai" | "Ini iklan, ada biaya harian yang jelas" |
| Risiko | Papan mati | Sponsor merasa uangnya menguap → **dijawab di §6.5** |

---

## 6. Algoritma Harga & Rosot

Bagian paling rawan di seluruh produk. Salah kalibrasi: papan membeku (rosot terlalu lambat) atau sponsor merasa diperas (terlalu cepat).

### 6.0 Satu fakta yang membatasi desain

Selama peringkat ditentukan akumulasi bayaran, **tidak ada rumus konversi yang bisa membuat puncak jadi murah.** Fungsi naik-monoton apa pun (akar, log, kurva) mempertahankan urutan — biaya menyalip pemimpin tidak berubah. Itu kosmetik.

Hanya ada empat tuas nyata: **rosot, reset, rotasi, dan pemecahan papan.** Desain ini memakai keempatnya.

### 6.1 Lapis 1 — Rosot progresif ("makin tinggi makin licin")

Laju rosot naik seiring posisi, bukan rata. Ini akurat terhadap panjat pinang sungguhan: bagian atas tiang paling licin.

| Posisi | Rosot/hari | Rasional |
|---|---|---|
| #1 | 25% | Posisi termahal untuk dipertahankan |
| #2–3 | 18% | |
| #4–10 | 12% | |
| #11–30 | 7% | |
| #31 ke bawah | 3% | Ekor nyaris tidak merosot |
| Pegangan ≤ Rp1.000 | 0% | Kaki tiang — lantai permanen |

Implementasi: laju ditentukan **posisi saat jam berjalan**, dihitung ulang tiap jam. Sponsor yang turun peringkat otomatis merosot lebih pelan — sistem melindungi yang kalah, bukan menghabisinya.

**Kenapa progresif:** laju rosot puncak adalah tuas harga langsung. Kalau kemauan bayar pasar untuk #1 ~Rp25.000/hari dan rosotnya 25%, titik keseimbangan pegangan #1 mendarat di ~Rp100.000 — persis rentang tesis harga. Angka itu bisa disetel.

**Efek samping yang bagus:** lonjakan sultan sembuh sendiri. Bayar Rp1.000.000 = merosot Rp250.000/hari. Berhenti manjat: Rp1jt → ~Rp237rb dalam 5 hari → ~Rp56rb dalam 10 hari. Papan pulih tanpa aturan larangan apa pun.

### 6.2 Lapis 2 — Kenaikan harga hanya lokal

- **Kenaikan minimum Rp1.** Tidak ada increment persentase ala lelang. Menyalip orang tepat di atasmu hampir selalu murah.
- Sponsor di papan **hanya membayar selisih**, tidak bayar penuh lagi.
- Yang mahal hanya satu titik: puncak. Naik #6 → #5 mungkin Rp2.001 — dopamine sama, harga jauh lebih kecil.

Papan di titik keseimbangan:

| Aksi | Perkiraan biaya |
|---|---|
| Naik satu peringkat (#6 → #5) | ~Rp2.000 |
| Masuk Top 10 dari nol | ~Rp25.000 |
| Sampai puncak dari nol | ~Rp95.000 |

### 6.3 Lapis 3 — Papan Hari Ini

Papan kedua yang **hanya menghitung pegangan yang dibayar dalam 24 jam terakhir**, reset 00:00 WIB. Uang kemarin tidak berlaku di sini. Siapa pun dengan Rp20.000 punya peluang nyata jadi juara hari ini, dan snapshot-nya diarsipkan permanen. Kemenangan untuk segmen Rp10–50rb tanpa menyentuh ekonomi papan utama.

### 6.4 Lapis 4 — Spotlight rotasi

Satu slot di atas lipatan menampilkan listing acak tiap 30 detik, **peluang muncul sebanding pegangan**, bukan urutan. Sponsor Rp5.000 tetap dapat waktu tayang di posisi paling terlihat. Memutus persepsi "kalau nggak punya Rp100rb, percuma ikut" — penyebab kematian sesungguhnya papan sejenis.

### 6.5 Pagar anti-beban (non-negotiable)

Mekanik ini mudah berubah jadi mesin pemerasan. Berikut batasan produk, bukan saran:

- Notifikasi "kamu disalip" **maksimal 1× per 24 jam per sponsor**, tidak pernah pukul 22:00–07:00 WIB.
- Konfirmasi dua langkah untuk nominal >Rp200.000 (mencegah salah ketik nol).
- Maksimal 5 kali manjat lagi per listing per hari, dengan pesan jujur saat batas tercapai.
- **CPC selalu tampil di dasbor.** #1 dengan ~400 klik/hari pada biaya Rp25.000/hari = Rp62/klik — 10–60× lebih murah dari Meta Ads. Ketika angkanya rasional, user tidak merasa dibebani; dia merasa pintar.
- Estimasi bertahan selalu ditampilkan: "Peganganmu 34.200, merosot ~4.100/hari. Bertahan di Top 5 sekitar 3 hari lagi."
- Tidak ada dark pattern countdown, "sisa X slot", atau urgensi palsu. Urgensinya sudah nyata.

### 6.6 Parameter konfigurasi (bukan hard-code)

`laju_rosot[tier]`, `ambang_tier`, `kaki_tiang`, `minimum_naik`, `minimum_manjat_lagi`, `jam_hitung_ulang`, `bobot_spotlight` — besar kemungkinan berubah di bulan pertama.

---

## 7. Persona & User Stories

### Persona A — Solo Founder (segmen inti, ~70% pendapatan)
SaaS/tools kecil, budget Rp20.000–200.000, pernah pasang di Pamerin, mengukur pakai UTM.

- Ingin listing tampil <60 detik setelah bayar, supaya momentum promosi di X tidak hilang.
- Ingin tahu klik dan rupiah per klik, supaya bisa memutuskan manjat lagi atau berhenti.
- Ingin diberi tahu saat disalip, supaya bisa merebut posisi kembali.
- Ingin memilih **target posisi**, bukan menebak nominal.
- Ingin tahu berapa lama bertahan sebelum merosot, supaya bisa merencanakan pengeluaran.

### Persona B — Pemain Gengsi (margin tinggi, ~20% pendapatan)
Membayar Rp250.000+ demi puncak dan menyombongkannya. Sensitif estetika.

- Ingin kartu "Saya di puncak Panjat hari ini" yang cantik dan otomatis untuk IG Story.
- Ingin rekor tersimpan permanen — uangnya meninggalkan jejak.
- Ingin perebutan puncak terlihat dramatis oleh publik — ada penonton untuk kemenangannya.

### Persona C — Penonton / Penemu (tidak bayar, menentukan nilai papan)

- Ingin filter per kategori tanpa scroll 90 listing.
- Ingin melihat pergerakan peringkat hari ini — ada yang baru tiap mampir.
- Ingin memberi Sorak ke listing gratis yang bagus — punya andil.
- Ingin punya alasan kembali besok tanpa membayar.
- Ingin ikut menebak juara hari ini — punya kepentingan pada hasil.
- **Tidak** ingin dipaksa buat akun.

### Kasus tepi
- Pembayaran gagal → status "menunggu pembayaran" jelas, tagihan otomatis batal.
- Listing ditolak moderasi → dana kembali penuh 3×24 jam dengan alasan.
- Pegangan hampir habis → peringatan sekali yang informatif, bukan rentetan.
- Pengunjung pertama di hari peluncuran → papan terisi, bukan kosong.

---

## 7.5 Gamification Tanpa Login

### 7.5.1 Kenapa ada

Risiko terbesar §1.5: CPC jelek karena klik sedikit. Respons yang benar: **memproduksi trafik yang tidak dibeli.** Sasaran bisnisnya satu: **audiens yang bisa dihubungi.** Target: **500 pelanggan notifikasi harian di bulan ke-3.**

Metafora memperkuatnya: panjat pinang memang tontonan — penonton yang bersorak adalah bagian dari tradisinya, bukan tambahan.

### 7.5.2 Aturan pengaman (non-negotiable)

> **Gamification anonim tidak boleh menyentuh uang, peringkat berbayar, atau hitungan klik.**

Identitas anonim digandakan dalam 3 detik (incognito). Nilai ekonomi pada identitas anonim = mesin kecurangan. Paling berbahaya: **hadiah untuk klik ke listing sponsor** — CPC jadi palsu, D2 runtuh permanen. Jangan pernah.

Gamification anonim hanya menyentuh: **urutan Kaki Tiang**, **kosmetik**, dan **ritual kunjungan**.

### 7.5.3 Identitas

Cookie `httpOnly` berisi ID anonim **bertanda tangan server** (bukan `localStorage` — bisa diedit dari konsol). Umur 1 tahun, tanpa data pribadi. Di atasnya, pintu opsional: *"Simpan progresmu — masukkan email."* Tanpa password. **Ini hasil bisnis sesungguhnya dari seluruh bagian ini.**

### 7.5.4 Empat mekanik, urut nilai

**M1 — Tebak Juara** (paling kuat)
Tebak siapa juara Papan Hari Ini saat reset 00:00 WIB. Satu tebakan/hari, gratis, tanpa login. Hasil diumumkan tengah malam; ada streak.
*Platform:* janji temu harian — moat ritual. Menebak dengan baik = memperhatikan papan = membaca listing sponsor. *Pengunjung:* alasan kembali tanpa bayar. *Sponsor:* penonton berulang.

**M2 — Tiga Sorak per hari**
3 Sorak/hari untuk listing gratis di Kaki Tiang. Habis, terisi besok. **Tidak menumpuk** — kelangkaan yang membuatnya bernilai. Penonton bersorak untuk pemanjat yang belum sanggup bayar; yang paling disoraki naik di urutan Kaki Tiang.
*Platform:* sinyal kurasi nyata. *Pengunjung:* rasa punya andil. *Pemilik listing gratis:* dopamine gratis — pintu masuk paling halus menuju bayar pertama.

**M3 — Lencana permanen sponsor** (menempel pada listing, tanpa login)
`Pernah di Puncak` · `Bertahan 7 hari di Top 3` · `Comeback` (keluar Top 10 lalu kembali #1) · `Juara kategori` · `Bangkit dari Kaki Tiang` (merosot habis lalu kembali Top 10)
*Nilai:* menjawab keberatan terbesar model licin — "uang saya menguap". Tidak menguap; meninggalkan lencana. Lencana publik memicu persaingan = belanja lebih.

**M4 — Paspor Juara**
Arsip juara harian dengan penanda mana yang disaksikan langsung. Nilai terendah, biaya hampir nol, memperkuat arsip.

### 7.5.5 Yang sengaja tidak dilakukan

| Ditolak | Alasan |
|---|---|
| Poin, level, XP pengunjung | Kompleksitas tanpa perubahan perilaku; progres tanpa login mudah hilang → kesal |
| Leaderboard pengunjung | Produk ini sudah satu leaderboard; dua membingungkan |
| Hadiah untuk klik listing | Merusak D2 (§7.5.2) |
| Streak berkonsekuensi berat | Ganti HP → hilang streak 40 hari → tidak kembali |
| Sorak yang bisa dibeli | Melanggar pemisahan uang vs gamification; kurasi Kaki Tiang jadi bisa dibeli |

---

## 8. Requirements

### P0 — Wajib untuk rilis

**R1. Papan peringkat realtime**
- [ ] Given sponsor membayar, when webhook terkonfirmasi, then posisinya muncul di papan semua pengunjung aktif ≤5 detik.
- [ ] Perubahan posisi dianimasikan (baris bergeser, bukan melompat).
- [ ] Papan tidak melompat saat pengunjung sedang scroll.
- [ ] Rosot dihitung **server-side**; klien tidak pernah menghitung peringkat sendiri.
- [ ] Laju rosot mengikuti tier posisi (§6.1), dihitung ulang tiap jam.

**R2. Alur manjat (≤60 detik, tanpa akun)**
- [ ] Input URL/username → endpoint pratinjau server-side (`/api/preview`) mengambil judul, deskripsi, dan logo; kartu pratinjau terisi live. Cache 24 jam per URL.
- [ ] Rantai fallback teks: `og:title` → `<title>` → nama domain; `og:description` → `meta description` → paragraf pertama → diisi manual.
- [ ] Rantai logo, urut prioritas: `apple-touch-icon` → `<link rel="icon">` besar / SVG / ikon manifest (192px+) → `og:image` **hanya bila rasionya mendekati persegi** (banner dilewati, bukan di-crop paksa) → layanan favicon pihak ketiga → tile huruf pertama.
- [ ] Logo **tidak di-hotlink**: diunduh sekali, resize 128px WebP, simpan di object storage sendiri, sajikan dari CDN sendiri.
- [ ] Given semua sumber logo <64px, then jatuh ke tile huruf — logo buram lebih merusak brand sponsor daripada tidak ada.
- [ ] Username Instagram/X/TikTok (memblokir scraper): tampilkan `@username` + ikon platform + deskripsi manual.
- [ ] Timeout scraping 3 detik; alur bayar **tidak pernah** menunggu pratinjau.
- [ ] Proteksi SSRF: hanya http/https, resolve DNS lalu tolak IP privat/link-local/metadata (`169.254.169.254`), batas respons 1MB, redirect internal ditolak.
- [ ] Hasil scrape dipakai ulang untuk pra-moderasi AI (R8) dan saran deskripsi (R18).
- [ ] Normalisasi URL: buang utm/fbclid/igsh; `@budi`, `x.com/budi`, `twitter.com/budi` = satu listing.
- [ ] **Pemilih target posisi**: pilih #1 / Top 3 / Top 10 / nominal bebas, sistem menghitung rupiahnya.
- [ ] Pratinjau kartu listing live saat mengetik.
- [ ] Estimasi bertahan **sebelum** bayar: "Rp95.000 → puncak, bertahan di Top 3 sekitar 6 hari."
- [ ] Pembayaran via **Midtrans** (Snap): QRIS/e-wallet <Rp25.000; seluruh metode ≥Rp25.000. Tagihan kedaluwarsa 60 menit.
- [ ] Pegangan aktif **hanya** dari webhook Midtrans bertanda tangan terverifikasi (`signature_key`) — tidak pernah dari redirect browser.
- [ ] Webhook idempoten per `order_id`.
- [ ] Given webhook belum tiba 30 detik setelah kembali dari pembayaran, then status "menunggu konfirmasi" yang memperbarui diri.
- [ ] Given URL sudah di papan, then alur beralih ke mode manjat lagi, hanya menagih tambahan.
- [ ] Tanpa wajib akun; identitas terikat email/WA saat bayar.

**R3. Notifikasi disalip (mesin retensi utama)**
- [ ] Given sponsor turun dari #1 / Top 3 / Top 10, then WhatsApp + email ≤5 menit berisi posisi baru + tautan sekali-klik untuk manjat lagi.
- [ ] Maksimal 1 notifikasi/sponsor/24 jam; jeda malam 22:00–07:00 WIB.
- [ ] Peringatan merosot: satu pesan saat diperkirakan keluar Top 10 dalam 48 jam.
- [ ] Tautan berhenti berlangganan di setiap pesan.

**R4. Dasbor sponsor** (magic link, tanpa password)
- [ ] Menampilkan: pegangan sekarang, laju rosot, estimasi bertahan, posisi, grafik posisi 7 hari, total klik, klik hari ini, **CPC**, riwayat pembayaran.
- [ ] Tombol manjat lagi dengan preset target posisi.
- [ ] Ubah deskripsi (bukan URL) gratis, maks 2×/24 jam.
- [ ] Unggah logo sendiri (menimpa hasil scrape) — PNG/SVG/WebP maks 1MB, resize 128px, lewat moderasi R8.

**R5. Kartu flex otomatis**
- [ ] OG image dinamis 1200×630 per listing: peringkat, nama, pegangan.
- [ ] Sponsor yang mencapai puncak (umum atau kategori) mendapat kartu 1080×1920 siap IG Story dari modal perayaan dan dasbor.
- [ ] Kartu memuat panjat.id + kode ajakan; tautan dari kartu dilacak.

**R6. Kategori sebagai tiang terpisah**
- [ ] 10–12 kategori, masing-masing papan dan juara sendiri — **10–12 puncak yang bisa dijual, bukan satu.**
- [ ] Given sponsor #1 di kategorinya, then lencana juara kategori + kartu flex, meski di papan umum dia #40.

**R7. Papan Hari Ini**
- [ ] Hanya menghitung pembayaran 24 jam terakhir, reset 00:00 WIB.
- [ ] Snapshot diarsipkan permanen dan dapat ditautkan.
- [ ] Juara harian mendapat kartu flex sendiri.

**R8. Moderasi & kepatuhan**
- [ ] Lapis 1 (deterministik): daftar kata kunci & domain judi/slot, pinjol ilegal, konten dewasa, tautan grup chat, URL pendek — berjalan meski AI mati.
- [ ] Lapis 2 pra-moderasi AI: klasifikasi `lolos`/`tolak`/`ragu` dari URL + konten scrape (lihat *Prinsip Penggunaan AI*). `Ragu` → antrean manusia; `tolak` → ditahan + refund otomatis.
- [ ] Konten scrape = **input tidak tepercaya**; instruksi dalam halaman sponsor tidak boleh mengubah perilaku klasifikasi (uji prompt injection sebelum rilis).
- [ ] Given API AI gagal/timeout >3 detik, then jatuh ke lapis 1 + antrean manual — pembayaran dan penayangan tidak pernah menunggu AI.
- [ ] Antrean manual: listing baru ≥Rp100.000 dan semua `ragu` — SLA 30 menit jam kerja.
- [ ] Given ditolak, then dana kembali penuh + alasan via email/WA.
- [ ] Tombol lapor; laporan diputus manusia, bukan AI.

**R9. Halaman aturan yang jujur**
- [ ] Menjelaskan rosot dengan **contoh angka nyata dan tabel tier** — "tiangnya licin, ini seberapa licin".
- [ ] Tegas: tidak ada refund untuk pegangan yang sudah dibayar, kecuali ditolak moderasi.
- [ ] Peringkat murni ditentukan pegangan — tidak ada posisi yang dijual di luar sistem.

**R10. Anti-kecurangan klik**
- [ ] Seluruh klik keluar lewat **redirect server** (`/k/{listing}`), dihitung di sana — kebal adblock, bisa diaudit (§17).
- [ ] Dedup klik per IP+UA per 6 jam.
- [ ] IP **tidak pernah mentah** — hash dengan salt rotasi harian (UU PDP).
- [ ] Klik referer mencurigakan/bot tidak masuk angka publik.
- [ ] Redirect menambahkan `utm_source=panjat&utm_medium=leaderboard`.

**R11. Papan tidak kosong saat peluncuran**
- [ ] Seed 30–50 listing produk Indonesia nyata dengan pegangan kecil dan label "seed" jujur, atau periode gratis 48 jam.

**R12. Responsif di seluruh breakpoint**
- [ ] Viewport 320–1920px: tidak ada scroll horizontal, tidak ada teks terpotong.
- [ ] Papan, alur manjat, dasbor mengikuti komposisi §9.4 — bukan kolom yang menyempit.
- [ ] Tabel → daftar kartu di bawah 768px.
- [ ] Alur bayar selesai penuh di 375px tanpa zoom.
- [ ] `prefers-reduced-motion: reduce` → transisi sederhana.
- [ ] Pembaruan realtime tidak menggeser posisi scroll.
- [ ] Lulus uji 5 perangkat wajib (§9.4).

**R13. Sistem komponen konsisten**
- [ ] Token terdefinisi sebelum layar pertama dibangun.
- [ ] Tidak ada hex/px langsung di kode fitur — lint menolak.
- [ ] Setiap komponen interaktif punya 8 keadaan (§9.5), termasuk loading dan empty.
- [ ] `/kitchen-sink` internal menampilkan semua komponen semua keadaan, diperiksa tiap breakpoint sebelum rilis.
- [ ] Satu formatter rupiah, satu formatter waktu WIB.
- [ ] Merah bendera (`merah`) tidak pernah muncul di luar zona puncak dan aksi utama (§9.6.2).

### P1 — Menyusul cepat

**R14. Identitas pengunjung anonim (fondasi R15–R17)**
- [ ] Cookie `httpOnly`, ID bertanda tangan server, 1 tahun, tanpa data pribadi.
- [ ] Seluruh progres (streak, Sorak, tebakan) disimpan server-side.
- [ ] Penukaran opsional ke email, tanpa password.
- [ ] Given menukar email, when buka dari perangkat lain via magic link, then progres terbawa.
- [ ] Rate limit per ID dan IP; ID massal dari satu IP diabaikan dari hitungan publik.

**R15. Tebak Juara**
- [ ] Satu tebakan/ID/hari untuk juara Papan Hari Ini; tutup 3 jam sebelum reset.
- [ ] Given reset, then hasil + streak diperbarui ≤2 menit.
- [ ] Streak putus tidak menghapus riwayat — hitung ulang dari 1.
- [ ] Given sudah menukar email, then hasil dikirim sebagai satu email harian (opt-out satu klik).
- [ ] Tebakan **tidak** memengaruhi peringkat, pegangan, atau klik.

**R16. Tiga Sorak per hari**
- [ ] 3 Sorak/ID/hari, reset 00:00 WIB, tidak menumpuk.
- [ ] Sorak hanya untuk listing Kaki Tiang (pegangan Rp0). Listing berbayar tidak menerima Sorak.
- [ ] Urutan Kaki Tiang ditentukan Sorak; **tidak pernah** di atas listing berbayar.
- [ ] Sorak tidak bisa dibeli, ditukar, atau dihadiahkan.
- [ ] Lonjakan Sorak dari satu rentang IP diabaikan diam-diam, tanpa pesan error.

**R17. Lencana sponsor**
- [ ] `Pernah di Puncak`, `Bertahan 7 hari di Top 3`, `Comeback`, `Juara kategori`, `Bangkit dari Kaki Tiang` — dihitung otomatis dari riwayat posisi.
- [ ] Permanen — tidak hilang saat merosot.
- [ ] Tampil di kartu listing, dasbor, kartu flex.
- [ ] Lencana baru → modal perayaan + langsung bisa dibagikan.

*Catatan urutan: `Pernah di Puncak` berbagi logika dengan R5, ongkos marjinal kecil — ikut F2.*

**R18. Bantuan AI pada alur listing**
- [ ] Saran deskripsi 160 karakter bahasa Indonesia dari konten scrape — **saran, bukan pengganti**; selalu bisa diedit/diabaikan.
- [ ] Saran kategori; keputusan di sponsor.
- [ ] Gagal diam — API mati, form normal tanpa saran, tanpa error yang mengganggu alur bayar.

**R21. Pratinjau screenshot situs listing**
- [ ] Worker antrean dengan headless browser (Playwright) menangkap layar 1200×800 situs listing → WebP ~100–200KB → object storage sendiri → CDN sendiri. **Tidak pernah iframe** (X-Frame-Options + risiko keamanan), tidak pernah hotlink.
- [ ] Diambil saat listing dibuat, disegarkan otomatis mingguan; tombol "segarkan pratinjau" di dasbor, maks 1×/hari.
- [ ] Penempatan: (1) **langkah konfirmasi alur manjat** — sponsor melihat tangkapan situsnya sendiri sebelum membayar, mencegah komplain salah-tempel URL yang tidak bisa di-refund dengan enak; (2) halaman publik `/l/{slug}` (memperkuat R20-d); (3) hover-card desktop ~400ms dari baris papan.
- [ ] **Tidak pernah di baris papan itu sendiri** — ratusan thumbnail menghancurkan budget 60fps §9.6.4, menabrak identitas (papan ini tiang dan pemanjat, bukan galeri screenshot), dan memberatkan mobile. Baris tetap logo + teks.
- [ ] Screenshot adalah konten yang dimoderasi: tangkapan masuk pipeline R8 (halaman bisa lolos moderasi teks tapi tampil konten judi/dewasa) — kasus yang tepat untuk klasifikasi visual di lapis AI.
- [ ] Worker = permukaan SSRF kedua: proteksi yang sama dengan `/api/preview` (tolak IP internal, timeout, batas ukuran) **plus** sandboxing proses — browser menjalankan JavaScript halaman target, isolasi harus lebih ketat dari fetcher biasa.
- [ ] Deteksi tangkapan gagal (halaman dominan kosong/putih, cookie-wall, tantangan bot) → jatuh ke `og:image` → logo. Listing sosmed (IG/X/TikTok) dilewati sepenuhnya, konsisten R2.
- [ ] Given worker mati atau antrean penuh, then listing tayang normal tanpa screenshot — pratinjau tidak pernah memblokir penayangan maupun pembayaran.
- [ ] Implementasi: self-host satu worker di antrean (puluhan tangkapan/hari ≈ gratis di atas infra ada); layanan pihak ketiga hanya kalau volume membuktikan perlu.

**R22. Jelajah & Pencarian — permukaan penemuan pengunjung**

Prinsip pemisahan yang tidak bisa ditawar: **papan diurut uang; Jelajah diurut relevansi dan pilihan pengunjung. Tidak ada rupiah yang bisa membeli posisi di Jelajah, dan tidak ada relevansi yang menggeser papan.** Kalau hasil penemuan bisa dibeli, pengunjung berhenti percaya dan berhenti datang — dan yang dijual ke sponsor ikut mati. Justru pemisahan ini yang menguntungkan sponsor: ditemukan lewat Jelajah → klik → angka di dasbor → motivasi manjat di papan.

- [ ] **Pencarian** atas nama, deskripsi, dan kategori seluruh listing tayang (termasuk Kaki Tiang). Postgres full-text cukup di skala ini — tidak ada Elasticsearch/Algolia di roadmap (asas §17.3).
- [ ] Hasil pencarian diurut relevansi teks murni; lencana dan posisi papan **ditampilkan** sebagai informasi, tidak pernah memengaruhi urutan.
- [ ] **Halaman kategori sebagai direktori** (`panjat.id/k/{kategori}`): grid kartu dengan screenshot (R21), logo, deskripsi, jumlah klik. Presentasi direktori, bukan replika papan.
- [ ] Urutan di halaman kategori dipilih eksplisit oleh pengunjung: **Terbaru** (default) / **Paling diklik minggu ini** / **Paling disorak**. Label urutan selalu terlihat — tidak ada urutan "pintar" yang tak dijelaskan, konsisten dengan kejujuran §5.
- [ ] Halaman kategori adalah aset SEO utama (menyambung R20-d): SSR, meta serius, copy pengantar per kategori ("AI tools buatan Indonesia, diurut dari yang terbaru") — target kata kunci pencarian nyata.
- [ ] Dari setiap permukaan Jelajah selalu ada jalan pulang yang jelas ke papan ("Lihat posisinya di papan") — Jelajah memberi makan papan, bukan menggantikannya.
- [ ] Halaman listing `/l/{slug}` menambah blok "Serupa di kategori ini" (maks 4, urut terbaru) — pengunjung yang tidak cocok dengan satu listing tidak pulang dengan tangan kosong.
- [ ] Klik yang lahir dari Jelajah melewati redirect `/k/{listing}` yang sama (R10) dengan penanda asal (`papan`/`jelajah`/`pencarian`) — sponsor melihat di dasbor dari mana kliknya datang, dan kamu melihat permukaan mana yang bekerja.
- [ ] Navigasi utama memuat dua pintu setara: **Papan** dan **Jelajah**. Pengunjung tipe penonton dan tipe pencari sama-sama menemukan pintunya dalam satu detik.

Lainnya: **Spotlight rotasi** (§6.4) · **Arsip Juara** · **Manjat cepat** (dari papan, satu tombol → QRIS nominal terisi) · **Statistik publik** (total sponsor, klik terkirim, pergantian puncak) · **Jaga posisi otomatis** (recurring kartu/e-wallet, bukan saldo mengendap — §13.1).

### Prinsip Penggunaan AI

AI dipakai di tempat yang menghemat kerja manusia nyata, dilarang di tempat yang merusak kontrak produk.

| Tugas | Model | Alasan |
|---|---|---|
| Klasifikasi moderasi rutin (R8), saran deskripsi & kategori (R18) | `claude-haiku-4-5` | Volume harian, tugas sempit, biaya mendekati nol |
| Eskalasi `ragu` yang butuh nuansa kebijakan (pinjol legal vs ilegal, dewasa vs edukasi kesehatan) | `claude-fable-5` | Jarang tapi salah = mahal. Keputusan akhir tetap manusia di F1–F2 |

**AI tidak boleh menyentuh, dalam kondisi apa pun:** peringkat, pegangan, atau harga (kontrak §5: "tidak ada algoritma tersembunyi" — satu pelanggaran, kontrak mati permanen) · hitungan klik dan CPC (harus deterministik, bisa diaudit) · keputusan akhir atas laporan pengguna · copy transaksional.

Operasional: konten scrape selalu input tidak tepercaya (R8); tiap minggu 20 keputusan AI diaudit manusia — tingkat salah naik berarti ambang `ragu` diperlebar. Verifikasi harga API di dokumentasi Anthropic; pada puluhan listing/hari, perkiraan puluhan ribu rupiah/bulan.

### P2 — Memengaruhi arsitektur, belum dibangun

- Papan bersponsor komunitas/event ("Tiang Indie Hackers Jogja") — produk B2B.
- Embed lencana "#3 di Panjat" di situs sponsor (loop distribusi balik).
- Program rujukan: pegangan bonus untuk sponsor yang membawa sponsor baru.
- **Paspor Juara** (M4) — hanya setelah R15 terbukti menghasilkan kunjungan berulang.

---

## 9. Arah UX/UI

Kompetitor kalah bukan di fitur, tapi di rasa.

### 9.1 Prinsip

1. **Papan dulu, form belakangan.** Pengunjung harus melihat pertandingannya sebelum diminta ikut bermain. CTA mengambang di bawah pada mobile.
2. **Rosot harus terlihat, bukan cuma angka.** Indikator pegangan yang benar-benar melemah dan marker yang benar-benar melorot. Angka statis tidak menimbulkan urgensi.
3. **Jangan pernah suruh user menebak angka.** "Mau di posisi berapa?" — sistem yang berhitung.
4. **Rayakan secara proporsional.** Naik 3 peringkat = animasi kecil. Sampai puncak = urutan Momen Puncak penuh (MI-1, §9.6.4). Bukan confetti — perayaan digarap, bukan ditaburkan.
5. **Dua bentuk, satu kualitas.** Mobile bukan desktop yang dipencet; desktop bukan mobile yang direntangkan. Detail §9.4.
6. **Satu komponen untuk semua ukuran.** Komponen beradaptasi di dalam dirinya sendiri. Detail §9.5.
7. **Ketinggian adalah data.** Papan ini adalah tiang: posisi vertikal, ukuran, dan lebar huruf semuanya mengodekan seberapa tinggi kamu. Warna dipakai hemat dan selalu berarti (§9.6).
8. **Keberanian dihabiskan di satu tempat.** Tiang dan bahasa panjat adalah yang mencolok; sekelilingnya tenang dan disiplin.

### 9.2 Layar utama

| Layar | Isi inti |
|---|---|
| **Papan (beranda)** | Header hidup (online, klik hari ini, puncak terakhir berganti). Tab: Keseluruhan / Hari Ini. Tiga besar berukuran besar di zona puncak, #4 ke bawah lebih padat, tiang menyusuri sisi kiri. Filter kategori chip. Feed aktivitas di kanan (desktop) / tab kedua (mobile) |
| **Kartu listing** | Logo, judul, deskripsi 160 kar., kategori, klik, indikator pegangan + estimasi bertahan, tombol "Salip" |
| **Alur manjat** | 3 langkah: (1) tempel URL → pratinjau otomatis, (2) target posisi via slider — markermu terlihat memanjat pratinjau tiang, (3) bayar |
| **Momen Puncak** | Layar penuh setelah bayar: posisimu, siapa yang kamu salip, kartu flex, share. **Ini produk sesungguhnya** |
| **Dasbor** | Grafik posisi 7 hari, pegangan & laju rosot, klik & CPC, tombol manjat lagi, riwayat |
| **Arsip Juara** | Grid semua mantan juara, kronologis |

### 9.3 Detail yang membuat orang bercerita

- Saat puncak direbut, papan semua orang yang online menyiarkannya: "X baru saja menyalip Y di puncak".
- Angka pegangan beranimasi hitung-turun halus.
- Empty state Kaki Tiang: *"Belum ada yang manjat. Tiangnya masih kinclong."*
- Mode tonton — papan berfungsi sebagai tontonan tanpa pernah bayar.

### 9.4 Responsif — satu produk, dua bentuk

Mayoritas trafik dari X/Threads/IG di HP; sponsor Rp100rb+ mengevaluasi di desktop. Keduanya optimal, bukan salah satu ditoleransi.

| Nama | Lebar | Prioritas |
|---|---|---|
| `sm` Mobile | 320–767px | Utama — 70–80% sesi |
| `md` Tablet | 768–1023px | Turunan desktop, bukan mobile diperbesar |
| `lg` Desktop | 1024–1439px | Utama kedua — tempat sponsor besar memutuskan |
| `xl` Wide | 1440px+ | Konten maks 1280px |

| Layar | Mobile | Desktop |
|---|---|---|
| **Papan** | Satu kolom, tiang tipis di tepi kiri. Zona puncak bertumpuk. Feed = tab kedua. Chip scroll horizontal. CTA sticky bawah | Dua kolom: papan (≈8/12) + feed sticky (≈4/12). Zona puncak tiga berjajar, tiang penuh di kiri |
| **Alur manjat** | 3 langkah layar penuh, progres di atas | Satu layar dua kolom: form kiri, pratinjau tiang hidup di kanan |
| **Dasbor** | Kartu bertumpuk, grafik sederhana | Grid 3 kolom, grafik penuh + tooltip |
| **Momen Puncak** | Full-bleed portrait, share sejajar ibu jari | Dialog terpusat maks 640px |
| **Kartu listing** | Densitas `compact` | Densitas `row` + deskripsi, kategori, klik, estimasi |

**Aturan yang tidak boleh dilanggar:**
- Tidak pernah ada scroll horizontal level halaman, termasuk 320px.
- Tabel → daftar kartu di mobile (tabel tier rosot, riwayat pembayaran).
- Target sentuh min **44×44px**, jarak ≥8px.
- Font input min **16px** (di bawah itu iOS Safari zoom paksa, merusak alur bayar).
- `safe-area-inset` dihormati — CTA sticky di atas home indicator.
- `prefers-reduced-motion` → transisi opacity, marker berhenti melorot beranimasi.
- Kontras **4.5:1** (WCAG AA) — di tema terang, uji khusus `merah` di atas `kertas` dan teks sekunder.
- Fokus keyboard terlihat; seluruh alur bayar selesai tanpa mouse.
- Muatan realtime tidak menggeser scroll pengunjung.

**Perangkat uji wajib:** iPhone SE (375px), Android 360px, iPhone 14/15 (390px, notch), iPad 768px, laptop 1440px. Uji landscape untuk Momen Puncak.

### 9.5 Sistem Komponen

Konsistensi = kecepatan bangun + sedikit bug. Setiap komponen ganda adalah tempat baru untuk melenceng.

**Token adalah satu-satunya sumber kebenaran.** Tidak ada hex/px/durasi di kode fitur.

| Kelompok | Isi |
|---|---|
| Warna | Netral: `kertas`, `kertas-1`, `kertas-2`, `tinta`, `tinta-redup`, `garis`. Identitas: `tiang` (kayu), `merah` (bendera — **hanya zona puncak & aksi utama**), `licin` (kilap). `bahaya`, `aman`. Detail §9.6.2 |
| Tipografi | 3 peran: display variabel (sumbu lebar terikat pegangan), sans UI, mono data — §9.6.3. Angka **wajib** tabular |
| Spacing | Kelipatan 4px: 4, 8, 12, 16, 24, 32, 48, 64 |
| Radius | `sm` 6px, `md` 10px, `lg` 16px |
| Elevasi | 3 tingkat — permukaan + garis 1px; bayangan sangat tipis diperbolehkan di tema terang |
| Gerak | `fast` 120ms, `base` 200ms, `slow` 400ms, satu kurva easing |

**Inventaris (wajib sebelum layar mana pun):**
`Button` (primary/secondary/ghost/danger × sm/md/lg) · `PeganganBar` (indikator pegangan melemah) · `TiangRail` (rel tiang + marker posisi) · `RankBadge` · `ListingCard` (`puncak`/`row`/`compact`) · `CategoryChip` · `Input` · `AmountSelector` (pemilih target posisi) · `Sheet` · `Toast` · `Skeleton` · `EmptyState` · `StatTile` · `Tabs` · `LogoTile` (logo di latar netral dengan padding 15–20%, tidak pernah diberi warna identitas) · `EstimateLabel` · `ShareCardPreview`

**Aturan komponen:**
- **Satu komponen, adaptif di dalam.** `Sheet` = bottom sheet di mobile, dialog di desktop — satu komponen.
- Setiap komponen interaktif punya **8 keadaan**: default, hover, focus-visible, active, loading, disabled, error, empty. Tanpa loading & empty = tidak boleh masuk produksi.
- Setiap permukaan asinkron punya `Skeleton`, bukan spinner tengah layar.
- Satu formatter rupiah; satu formatter waktu WIB.

**Rekomendasi teknis:** Tailwind (token sebagai CSS variable) di atas primitif Radix/shadcn — aksesibilitas, fokus, dan keyboard gratis. `/kitchen-sink` internal wajib, semua komponen semua keadaan, tiap breakpoint sebelum rilis.

### 9.6 Arah Visual & Micro-interaction

#### 9.6.1 Yang ditolak, dan kenapa

Desain buatan AI mengelompok di tiga tampilan: (1) krem hangat + serif kontras tinggi + terakota, (2) nyaris hitam + satu aksen neon, (3) tata letak koran garis rambut. Arah lama PRD-Bara ("gelap + aksen amber", lalu papan termal) menghindari itu lewat warna-sebagai-data. Fork ke Panjat mengganti mesinnya: **ketinggian-sebagai-data**, dengan langkah pembeda tambahan — kategori ini (dan AI) default gelap; **Panjat terang**, karena panjat pinang adalah perayaan siang hari.

Yang juga ditolak: kitsch 17-an. Tidak ada clip-art bendera berkibar, tidak ada merah-putih menyala di seluruh halaman, tidak ada ornamen kemerdekaan harfiah. Metafora hidup di mekanik, bahasa, dan satu elemen struktural (tiang) — bukan di dekorasi lomba agustusan.

#### 9.6.2 Signature: papan adalah tiang

> **Sebuah rel tiang menyusuri sisi kiri papan dari puncak sampai kaki. Setiap listing adalah pemanjat yang menggantung di ketinggiannya. Di atas segalanya: hadiah. Scroll ke bawah = menuruni tiang.**

Anti-slop karena strukturnya **informasional**: posisi vertikal pada rel = peringkat, dan pergerakan marker yang melorot pelan = rosot yang terlihat. Tidak bisa ditiru tanpa mengadopsi seluruh model licin — dan tanpa terbaca menjiplak panjat pinang yang sudah diklaim Panjat.

**Palet (nilai awal, kalibrasi kontras saat implementasi):**

| Token | Hex | Dipakai untuk |
|---|---|---|
| `kertas` | `#F3F0E9` | Latar — kertas hangat terang, bukan krem kekuningan |
| `kertas-1` | `#FFFFFF` | Permukaan kartu |
| `kertas-2` | `#E9E4D9` | Permukaan tenggelam (Kaki Tiang, input) |
| `tinta` | `#1F1B16` | Teks utama |
| `tinta-redup` | `#7A7267` | Teks sekunder |
| `garis` | `#D8D2C4` | Border 1px |
| `tiang` | `#8A5A32` | Rel tiang, marker, tekstur kayu pinang |
| `licin` | `#B9C4C9` | Kilap gemuk di rel — abu kebiruan dingin, satu-satunya nada dingin di halaman |
| `merah` | `#da2e20` | **Hanya** zona puncak (#1–3), bendera kecil di ujung tiang, dan aksi utama. Merah bendera (merah-putih); teks putih di atasnya lolos WCAG AA. Untuk merah sebagai teks kecil pakai `merah-teks` (`#be2414`) |

Aturan: `merah` adalah kelangkaan yang dijaga. Ia menandai puncak dan ajakan manjat — muncul di tempat lain berarti bug desain. Logo sponsor duduk di `LogoTile` netral, tidak pernah diwarnai identitas: brand sponsor bukan pembawa data.

**Rosot yang terlihat.** Marker tiap listing pada rel tiang melorot piksel demi piksel di antara tick per jam — tiangnya benar-benar licin di depan mata. `PeganganBar` di dalam kartu ikut melemah. Peluruhan jadi tontonan, bukan klaim di halaman aturan.

**Hadiah di puncak.** Di ujung atas rel, siluet sederhana bingkisan tergantung (geometris, bukan ilustrasi) dan satu bendera kecil `merah` yang berkibar halus. Baris #1 mendapat bendera itu di kartunya.

#### 9.6.3 Tipografi

| Peran | Pilihan | Alasan |
|---|---|---|
| Display | **Anybody** (variabel, sumbu lebar 50–150) | Sumbu lebar dipetakan ke pegangan — nama dan angka posisi di puncak tampil lebih lebar dan berat daripada #40. **Lebar huruf adalah pengodean data kedua.** Bertahan dari fork karena alasannya struktural, bukan estetika |
| UI / body | **Instrument Sans** | Bersih tapi berkarakter; sengaja bukan Inter |
| Data | **Martian Mono** (alt: Geist Mono) | Register teknis untuk rupiah, klik, CPC. Tabular bawaan |

Tidak ada serif display kontras tinggi — di tema terang, godaan ke arah "koran krem" (default #1) lebih besar; tiga font di atas menjauhkannya.

#### 9.6.4 Micro-interaction

**Satu momen digarap penuh mengalahkan sepuluh efek berserakan.** Anggaran gerak dihabiskan di Momen Puncak; sisanya tenang.

| # | Momen | Perilaku | Kenapa ada |
|---|---|---|---|
| MI-1 | **Momen Puncak** | Urutan ~1,2 dtk: latar meredup → angka posisi **naik dari bawah layar sambil sumbu lebar memuai** → nama → statistik → bendera kecil berkibar sekali → kartu share naik. Bukan confetti | Ini produk sesungguhnya |
| MI-2 | **Slider target posisi** | Digeser → markermu terlihat **memanjat rel tiang** di pratinjau, papan menyusun ulang live. Getar 8ms tiap melewati peringkat (mobile) | Angka abstrak jadi konsekuensi terlihat sebelum bayar |
| MI-3 | **Perebutan puncak disiarkan** | Baris bergeser bertahap (30ms), marker pemenang memanjat melewati yang kalah, bendera di ujung tiang berkibar sekali untuk semua yang online | Kemenangan punya penonton |
| MI-4 | **Hitungan pegangan** | Hanya digit yang berubah berputar. **Per menit, bukan per detik** | Per detik = kebisingan + boros baterai |
| MI-5 | **Perosotan** | Marker di rel melorot halus di antara tick per jam; kartu ikut turun saat reorder | Licin yang tidak disadari sadar, tapi papan terasa hidup |
| MI-6 | **Tarik-untuk-muat (mobile)** | Menarik layar = menghentak naik; marker header terangkat sedikit lalu lepas | Gerakan dari dunia subjek, bukan spinner generik |
| MI-7 | **Memberi Sorak** | Ikon sorak lepas dari jari, melayang ke listing, penghitung naik. Satu Sorak = satu gerakan sengaja | Memperkuat kelangkaan (M2) |
| MI-8 | **Tombol Salip** | Ditekan: mengempis 2%. Dilepas: baris terangkat sekejap | Umpan balik taktil; perayaan disimpan untuk MI-1 |
| MI-9 | **Skeleton** | Baris muncul dari bawah ke atas — pemanjat berdatangan ke tiang | Loading jadi bagian tema |
| MI-10 | **Kaki Tiang kosong** | Satu tiang polos, bendera diam. "Belum ada yang manjat." | Empty state sebagai ajakan |

**Batasan wajib:**
- `prefers-reduced-motion: reduce` → semua MI jadi perubahan seketika + opacity. Tanpa pengecualian.
- Hanya `transform` dan `opacity` — papan realtime tidak boleh memicu reflow.
- 60fps di perangkat kelas iPhone SE / Android Rp2 juta. Kalau MI-3 menjatuhkan frame di 120 baris, kurangi jumlah baris yang dianimasikan, bukan durasinya.
- Tidak ada animasi yang menunda; semua bisa diinterupsi.

#### 9.6.5 Daftar larangan konkret

Gradien ungu-ke-biru pada tombol · glassmorphism · emoji sebagai ikon · pustaka confetti pada keberhasilan apa pun · "✨" dalam copy · hero terpusat judul-gradien-dua-tombol · ilustrasi stok · clip-art bendera/17-an · merah-putih menyala di luar zona puncak · `rounded-full` di semua sudut · animasi pada setiap elemen · satu set ikon dipakai tanpa penyesuaian ketebalan garis · serif display kontras tinggi di atas latar krem.

### 9.7 Kelengkapan UX (R20)

Layar bahagia sudah dirancang di §9.2–§9.6. Bagian ini menutup sisanya — tempat sponsor sesungguhnya menghakimi produk.

**R20-a. Matriks keadaan per layar (P0)**
- [ ] Setiap layar P0 mendefinisikan seluruh keadaannya **sebelum layar itu dikoding**: kosong, memuat (skeleton), menunggu pembayaran, tagihan kedaluwarsa, ditahan moderasi, ditolak + refund berjalan, gagal jaringan, offline.
- [ ] Keadaan "menunggu pembayaran" dan "ditahan moderasi" punya copy yang menjelaskan apa yang terjadi dan kapan — bukan spinner tanpa keterangan.
- [ ] Deliverable: satu tabel matriks layar × keadaan di dokumen desain, diperiksa saat review `/kitchen-sink`.

**R20-b. Cara Main 10 detik (P0)**
- [ ] Pengunjung pertama melihat penjelasan tiga langkah ("Bayar untuk manjat · Tiangnya licin, semua merosot · Manjat lagi kalau mau bertahan") yang bisa dicerna ≤10 detik, dapat ditutup, dan bisa dibuka lagi dari menu.
- [ ] Tidak menghalangi papan — papan tetap terlihat di belakangnya.

**R20-c. Copy deck terpusat (P0)**
- [ ] Seluruh teks UI, pesan error, dan template WhatsApp/email hidup di satu berkas terpusat, ditinjau terhadap §10 — tidak ada teks ditulis langsung di dalam komponen.
- [ ] Pesan error mengikuti pola: apa yang terjadi → apa akibatnya bagi user → apa yang bisa dilakukan. Tidak pernah kode error telanjang.

**R20-d. SEO halaman publik (P0 untuk arsitektur, P1 untuk penyempurnaan)**
- [ ] Papan, halaman listing, dan Arsip Juara di-render server-side dan dapat diindeks — ini trafik gratis yang langsung menguatkan D4.
- [ ] Setiap listing punya halaman publik sendiri (`panjat.id/l/{slug}`) dengan meta + OG image dinamis (R5), berfungsi sebagai landing kecil: nama, deskripsi, posisi, riwayat singkat.
- [ ] Sitemap otomatis; canonical mengikuti URL ternormalisasi R2; arsip harian dapat ditautkan permanen.

**R20-e. Aksesibilitas papan realtime (P0)**
- [ ] Kontainer papan `aria-live="off"` — pembaruan realtime **tidak** dibacakan per baris.
- [ ] Satu region `aria-live="polite"` terpisah merangkum perubahan penting dengan hemat ("Papan diperbarui · puncak berganti").
- [ ] Reorder tidak pernah mencuri fokus keyboard; elemen yang sedang difokus tetap difokus setelah baris bergeser.

**R20-f. Uji kegunaan sebelum rilis (P0, gerbang F1)**
- [ ] 5 orang persona A menguji alur lengkap di sandbox: dari melihat papan sampai pembayaran QRIS uji.
- [ ] Lulus = ≥4 dari 5 menyelesaikan tanpa bantuan dalam ≤90 detik, dan bisa menjelaskan ulang aturan rosot dengan kata-kata sendiri.
- [ ] Kegagalan pemahaman rosot = perbaiki R20-b dan halaman aturan sebelum rilis, bukan sesudah.

---

## 10. Voice & Tone

Satu metafora — panjat pinang — konsisten dari landing sampai notifikasi.

### 10.1 Kosakata resmi

| Konsep | Kata yang dipakai |
|---|---|
| Membeli posisi pertama kali | **manjat** / **naik tiang** |
| Top-up | **manjat lagi** |
| Merebut posisi orang | **salip** / **disalip** |
| Kehilangan posisi karena peluruhan | **merosot**, **melorot** |
| Nilai peringkat | **pegangan** |
| Posisi #1 | **puncak** |
| Papan 24 jam | **Papan Hari Ini** |
| Tier gratis | **Kaki Tiang** |
| Upvote pengunjung | **Sorak** |
| Arsip pemenang | **Arsip Juara** |

**Tagline:** *"Manjat, atau merosot."*
Alternatif untuk konteks lembut: *"Tiangnya licin. Puncaknya bisa direbut."*

### 10.2 Nada bertingkat

**Permukaan marketing** (landing, OG card, kartu share, notifikasi kemenangan) — boleh nakal dan pendek:
- "Kamu merosot ke #7. Manjat lagi?"
- "Baru aja disalip @budi di puncak."
- "6 jam di puncak. Tiang makin licin."
- "48 orang menyorakimu dari Kaki Tiang."

**Permukaan uang** (form bayar, konfirmasi nominal, aturan, dasbor, error) — **wajib polos dan lugas:**
- "Kamu akan membayar Rp47.000 untuk naik ke posisi #3."
- ❌ Bukan: "Gaskeun manjat, cuma 47rb!"

Orang berhenti bertransaksi ketika merasa dirayu di layar yang menyangkut uangnya.

### 10.3 Yang dihindari

- Slang milik merek lain (cendol, bata, gan/sist — asosiasi Kaskus) — sudah dibahas dan ditolak di riwayat keputusan.
- Metafora kedua di atas panjat pinang. Kosakata api (bara, nyala, siram, padam) **sudah pensiun** — jangan bocor kembali ke copy.
- Nada mengejek "panjat sosial" ke arah pelanggan. Slang itu boleh disentuh dengan sadar-diri di marketing ("papan panjat paling jujur se-Indonesia"), tidak pernah untuk merendahkan pembayar.
- Urgensi palsu, countdown buatan, "sisa X slot".

---

## 11. Ekonomi Unit (ilustrasi, wajib divalidasi)

Papan mencapai keseimbangan ketika **pendapatan harian = total pegangan yang hilang karena rosot per hari.**

Asumsi: 120 listing aktif, distribusi seperti Pamerin sekarang.

| Tier | Jumlah | Rata-rata pegangan | Rosot/hari | Total rosot/hari |
|---|---|---|---|---|
| #1 | 1 | Rp100.000 | 25% | Rp25.000 |
| #2–3 | 2 | Rp70.000 | 18% | Rp25.200 |
| #4–10 | 7 | Rp40.000 | 12% | Rp33.600 |
| #11–30 | 20 | Rp15.000 | 7% | Rp21.000 |
| #31+ | 90 | Rp4.000 | 3% | Rp10.800 |
| | | | **Total** | **~Rp115.600/hari** |

| Pos | Nilai |
|---|---|
| GMV bulanan pada keseimbangan penuh | ~Rp3,5 juta |
| Realistis (isi ulang ~60% + listing baru) | ~Rp2,5–3 juta/bulan |
| Biaya Midtrans (QRIS ~0,7%; VA flat ~Rp4.000) | ~4–6% GMV |
| Biaya AI (moderasi + saran, puluhan listing/hari) | ~Rp50–150 ribu/bulan — verifikasi harga API terkini |
| Infra (Vercel + Postgres + Redis + WhatsApp API) | ~Rp1,5–2,5 juta/bulan |

**Satu papan bukan bisnis besar — nyaris impas pada skala ini.** Jalur pertumbuhan, urut prioritas: (1) menambah listing aktif (biaya marjinal ~nol), (2) menaikkan rata-rata pegangan puncak lewat persaingan nyata — gunanya notifikasi dan drama publik, (3) mereplikasi tiang per vertikal/komunitas (P2) — ini yang mengubah skala. Menekan biaya WhatsApp API adalah tuas margin terbesar awal.

---

## 12. Success Metrics

### Leading (minggu 1–4)
| Metrik | Target | Stretch |
|---|---|---|
| Konversi pengunjung → sponsor | 2,5% | 5% |
| Waktu selesai alur bayar (median) | ≤ 90 dtk | ≤ 60 dtk |
| Penyelesaian pembayaran (invoice → lunas) | ≥ 70% | ≥ 85% |
| Klik notifikasi "kamu disalip" | ≥ 40% | ≥ 60% |
| Notifikasi disalip → manjat lagi | ≥ 15% | ≥ 30% |
| Sponsor membagikan kartu flex | ≥ 30% | ≥ 50% |
| Selisih penyelesaian bayar mobile vs desktop | ≤ 10 poin | ≤ 5 poin |

### Lagging (bulan 2–4)
| Metrik | Target |
|---|---|
| Sponsor manjat lagi dalam 30 hari | ≥ 35% |
| Pergantian puncak per bulan | ≥ 8 |
| Pendapatan berulang sebagai % GMV bulan 3 | ≥ 50% |
| Pengunjung berulang | ≥ 25% sesi |
| Median CPC | ≤ Rp500 |
| Median pegangan #1 | Rp80.000–150.000 |
| Pengunjung menukar email demi progres | ≥ 12% peserta Tebak Juara |
| Pelanggan notifikasi harian bulan ke-3 | ≥ 500 |
| Peserta Tebak Juara kembali H+1 | ≥ 40% |
| Listing Kaki Tiang menerima ≥1 Sorak | ≥ 50% |
| Konversi Kaki Tiang → berbayar dalam 30 hari | ≥ 8% |
| Sesi yang memakai Jelajah/pencarian | ≥ 30% di bulan ke-3 |
| Klik sponsor yang berasal dari Jelajah | ≥ 25% total klik di bulan ke-3 |
| Trafik organik (SEO) sebagai % sesi | ≥ 15% di bulan ke-4 |

**Sinyal gagal:** manjat-lagi kedua <15% di bulan ke-2 = pasar menolak tiang licin — turunkan seluruh laju rosot setengahnya atau ganti model musim (reset bulanan) **sebelum** menambah fitur.
**Sinyal kalibrasi:** median pegangan #1 tembus Rp300.000 = rosot puncak terlalu rendah; puncak kosong berhari-hari = terlalu tinggi.

---

## 13. Open Questions

**Memblokir peluncuran:**

1. **[Legal/Keuangan]** "Jaga posisi otomatis" (P1) — perlukah izin uang elektronik? Model "bayar → langsung jadi pegangan, tidak mengendap" kemungkinan aman; begitu ada dompet, risikonya berubah. Konfirmasi sebelum membangun.
2. **[Legal]** Badan usaha, NPWP, PPN. Midtrans produksi butuh entitas jelas — urus paralel F0.
3. **[Legal/Merek]** Cek PDKI (pdki-indonesia.dgip.go.id) untuk "Panjat" kelas 35, 38, 42. Kata umum + first-to-file → daftarkan **merek kombinasi logo + kata**. Daftarkan **panjat.id** segera sebelum tulisan/percakapan publik apa pun.
4. **[Produk]** Laju rosot 25% di puncak = asumsi, bukan hasil uji. Kalibrasi dari data klik minggu pertama — kalau #1 hanya 80 klik/hari, 25% terlalu mahal dan CPC jelek. **Asumsi paling rapuh dokumen ini.**
5. **[Engineering]** Penyedia WhatsApp API dan biaya per pesan — menentukan kelayakan R3 pada pegangan kecil.

**Tidak memblokir:**

6. **[Produk]** Apakah Kaki Tiang (listing gratis) merusak persepsi papan atau menghidupkannya?
7. **[Desain]** Apakah tema terang tepat untuk segmen yang terbiasa produk dev gelap? Uji dengan 5 orang persona A — kalau resistensinya keras, siapkan mode gelap sebagai turunan token, bukan desain kedua.
8. **[Data]** Definisi klik sah — hitung ulang dari perangkat sama setelah 6 jam?
9. **[Produk]** Papan Hari Ini: menarik perhatian dari papan utama, atau pintu masuk murah? Ukur asal konversi pertama.
10. **[Merek]** Logo dan identitas visual final belum dikerjakan — memblokir rilis F1, tidak memblokir F0/perancangan.
11. **[Produk]** Tebak Juara: ukur retensi H+1 selama 2 minggu sebelum membangun M4. <25% → hentikan jalur gamification, alihkan ke distribusi.
12. **[Produk/AI]** Tingkat salah pra-moderasi AI untuk konten Indonesia belum diketahui. Dua minggu mode bayangan; presisi `tolak` <95% → turunkan jadi `ragu`.
13. **[Merek/Sosial]** Panjat pinang punya diskursus tahunan soal asal-usul kolonialnya (hiburan era Hindia Belanda). Mitigasi sudah di §9.6.1: metafora dipakai pada level mekanik dan bahasa, bukan imitasi historis atau imaji lomba — tapi siapkan satu paragraf sikap resmi sebelum peluncuran, karena pertanyaan ini akan datang tiap Agustus.

---

## 14. Fase & Timeline

Tim kecil (1–2 orang, sebagian waktu).

| Fase | Durasi | Isi | Kriteria lulus |
|---|---|---|---|
| **F0 — Validasi** | 1 minggu | 10 wawancara sponsor aktif Pamerin/Pake soal tiang licin. **Daftarkan panjat.id hari ini.** Cek PDKI paralel. Daftar akun Midtrans (sandbox) | ≥6 dari 10 mau bayar lagi tiap bulan untuk bertahan di atas |
| **F1 — Papan hidup** | 2–3 minggu | Token + komponen (R13) **lebih dulu**, lalu R1, R2, R8, R9, R11, R12, **R19-P0 (§18)**, **R20 a–c, e–f (§9.7)**. **Kunci logo sebelum rilis** | Transaksi asli pertama dari orang asing; lulus uji 5 perangkat; lulus uji kegunaan R20-f; checklist keamanan §18 P0 lengkap |
| **F2 — Mesin retensi** | 2 minggu | R3, R4, R5, R6, R7 + lencana `Pernah di Puncak` + **R21 (screenshot)**. Notifikasi, dasbor, kartu flex, kategori, Papan Hari Ini | Manjat-lagi pertama terjadi tanpa disuruh |
| **F3 — Loop penonton** | 2 minggu | R14–R17: identitas anonim, Tebak Juara, Sorak, lencana lengkap. **R22: Jelajah & Pencarian.** Plus spotlight, arsip, statistik publik | Pengunjung berulang ≥20%; retensi H+1 Tebak Juara ≥25%; ≥20% sesi menyentuh Jelajah |
| **F4 — Kalibrasi** | 1 minggu | Setel ulang laju rosot dari data nyata. Putuskan: jaga posisi otomatis, atau replikasi tiang vertikal | Median pegangan #1 masuk rentang target |

**Catatan waktu:** kategori ramai dan mudah ditiru. F1 rilis ≤4 minggu; setiap minggu tambahan adalah pangsa yang diambil pemain lain.

---

## 15. Nama & Merek

### Keputusan: **Panjat** — panjat.id

| Elemen | Status |
|---|---|
| Nama produk | ✅ **Panjat** — final |
| Domain | ✅ **panjat.id** dipilih — **daftarkan segera**; keputusan di dokumen, domain belum tentu aman sampai terdaftar |
| Logo & identitas visual | ❌ Belum — arah di §9.6, eksekusi memblokir rilis F1 |
| Kosakata (§10) | ✅ Final mengikuti metafora panjat pinang |
| Pendaftaran merek | ❌ Cek PDKI kelas 35/38/42, daftarkan kombinasi logo + kata |

### Kenapa Panjat menang

- **Nama = mekanik = cerita = memori nasional, dalam satu kata.** Panjat pinang identik dengan produk: tiang licin (rosot), merosot kalau diam, hadiah di puncak, penonton yang bersorak (pengunjung + Sorak). Tidak ada referensi budaya Indonesia lain yang sekuat dan setepat ini.
- **Cukup didengar untuk dipahami.** "Kayak panjat pinang tapi buat promosi produk, tiangnya beneran licin" — satu kalimat yang menjual dirinya sendiri di tongkrongan. Untuk produk yang hidup dari cerita mulut ke mulut, nama yang membawa cerita mengalahkan nama yang membawa estetika.
- **Kata kerja alami:** "gue panjat ke puncak", "manjat lagi", "dipanjatin orang". Nama yang jadi kata kerja menyebar sendiri.
- **Slang hidup:** "panjat sosial" — sadar-diri, jujur soal emosi yang dijual, bahan humor yang menyebar.
- **Klaim budaya sebagai moat lunak:** peniru kedua yang memakai panjat pinang otomatis terbaca menjiplak.

### Yang ditolak dan alasannya

| Kandidat | Ditolak karena |
|---|---|
| **Bara** (nama kerja v0.2–v0.9) | Kuat secara estetika (papan termal), tapi butuh **dilihat** untuk dipahami — Panjat cukup **didengar**. Kalah di kanal distribusi utama produk: cerita mulut ke mulut. `bara.id` juga tidak tersedia |
| **Sundul / Sundulin** | "Sundul Gan" dikomersialkan Kaskus (film 2016); deskriptif; sufiks -in berima dengan Pamerin |
| **Kobar / Obor / Membara** | Turunan keluarga api — gugur bersama keputusan meninggalkan metafora api |
| **Tahta** | Kuat tapi kaku, tanpa akar tradisi |
| **Rebutan / Naik Daun / Adu** | Menarik tapi tidak membawa mekanik produk di dalam namanya |

### Catatan hukum & risiko

- Saya bukan pengacara; ini bukan nasihat hukum. Cek PDKI kelas 35 (periklanan) dan 42 (SaaS); Indonesia first-to-file. "Panjat" kata umum → merek kata saja lemah; daftarkan **kombinasi logo + kata**.
- **panjat.id belum aman sampai benar-benar terdaftar** — jadikan tindakan hari pertama F0. Amankan juga `manjat.id`/`panjat.gg` sebagai pagar kalau murah.
- Risiko diskursus kolonial panjat pinang: lihat OQ-13. Sikap produk: merayakan mekanik dan semangat kompetisinya hari ini, tanpa imitasi historis.

---

## 16. Ringkasan Perbandingan

| Dimensi | pamerin.lol | pake.ai | **Panjat** |
|---|---|---|---|
| Cakupan | Umum, web + sosmed | Vertikal tools AI | Umum, tiang per kategori |
| Peringkat | Permanen | Permanen | Licin — merosot progresif menurut posisi |
| Masuk termurah | Rp1.000 | Rp10.000 | Rp5.000 (+ Kaki Tiang gratis) |
| Biaya rebut puncak | Rp1.000.001 dan terus naik | Naik permanen | ~Rp95.000, stabil di keseimbangan |
| Peluang menang pembayar kecil | Nyaris nol | Nyaris nol | Papan Hari Ini + spotlight rotasi |
| Pendapatan berulang | Tidak | Tidak | Ya, inheren |
| Notifikasi | Tidak ada | Tidak ada | WhatsApp + email, dengan pagar anti-spam |
| Dasbor & ROI | Hitungan klik | Minim | Klik, CPC, riwayat posisi, estimasi bertahan |
| Artefak flex | Tidak ada | Tidak ada | Kartu OG + IG Story otomatis + lencana permanen |
| Identitas | Generik | Generik | Panjat pinang — cerita yang menjual dirinya sendiri |

---

## 17. Arsitektur Data & Statistik

Tiga lapis data dengan tuntutan berbeda. Mencampurnya = kesalahan arsitektur yang mahal.

| Lapis | Isi | Sumber kebenaran |
|---|---|---|
| **Data yang dijual** | Klik, CPC, riwayat posisi, pegangan — dasar klaim ROI (D2) | **Postgres sendiri**, server-side |
| **Perilaku produk** | Funnel bayar, retensi, konversi — metrik §12 | **PostHog** (cloud, gratis 1 juta event/bulan) |
| **Trafik publik** | Pengunjung & pageview untuk header dan statistik publik | Database sendiri; Plausible/Umami opsional |

**Aturan satu kalimat: angka yang dilihat sponsor bersumber Postgres; angka yang dilihat pemilik produk boleh PostHog.** Selisih keduanya normal, tidak perlu direkonsiliasi.

### 17.1 Kenapa data yang dijual wajib first-party

Adblocker memblokir script analytics 20–40% pengguna. Klik yang dihitung di browser = undercount = klaim ROI dibangun di atas angka salah. R10 sudah menyediakan jalannya: klik dihitung di redirect server — deterministik, kebal adblock, bisa diaudit.

### 17.2 Skema inti

**Prinsip 1 — pegangan adalah ledger, bukan angka yang ditimpa.** Untuk produk uang, nilai harus bisa direkonstruksi: `pegangan = Σ(bayar) − Σ(rosot) − Σ(refund) ± koreksi`. Setiap kejadian tercatat sebagai baris. `pegangan_cached` di tabel `listing` hanyalah cache untuk sorting cepat; job malam memverifikasi cache terhadap ledger dan membunyikan alarm kalau selisih — kejujuran angka adalah kontrak produk ini.

**Prinsip 2 — semua timestamp disimpan UTC, ditampilkan WIB.** Satu formatter (R13).

| Tabel | Kolom kunci | Catatan |
|---|---|---|
| `listing` | `id, url_normal (unik), nama, deskripsi, kategori_id, logo_path, status, pegangan_cached, kontak_id, created_at` | Entitas inti. `url_normal` unik menegakkan aturan satu-URL-satu-listing (R2) |
| `sponsor_kontak` | `id, email, wa, verified_at` | Identitas sponsor tanpa akun; verifikasi sebelum dasbor pertama (§18) |
| `kategori` | `id, nama, slug` | 10–12 baris (R6) |
| `pegangan_ledger` | `id, listing_id, jenis (bayar/rosot/refund/koreksi), nominal_signed, ref, created_at` — append-only | `ref` = order_id Midtrans atau id run cron rosot. Koreksi manual selalu beraktor dan beralasan (masuk `moderasi_log`) |
| `transaksi` | `order_id (unik), listing_id, nominal, metode, status, webhook_at, raw_payload` | Sumber kebenaran keuangan; rekonsiliasi bulanan vs settlement Midtrans |
| `klik` | `listing_id, ts, ip_hash, ua_hash, referer, valid` — append-only | Dedup 6 jam saat insert; IP di-hash salt rotasi harian, tidak pernah mentah |
| `klik_harian` | `listing_id, tanggal, jumlah_valid` | Rollup; dasbor membaca ini |
| `posisi_snapshot` | `listing_id, jam, rank, pegangan` | Grafik 7 hari (R4) + satu-satunya sumber lencana (R17) |
| `moderasi_log` | `listing_id, aktor (ai/manusia/sistem), keputusan, alasan, sebelum→sesudah, created_at` | Bukti saat sponsor protes; juga audit AI mingguan (OQ-12) |
| `notifikasi_log` | `kontak_id, kanal, jenis, status_kirim, created_at` | Menegakkan batas 1×/24 jam (R3) dan jeda malam |
| `konfigurasi` | `key, value, updated_by, updated_at` | Parameter §6.6; setiap perubahan tercatat |
| `pengunjung_anon` | `id, created_at, email (nullable), email_verified_at` | Fondasi R14 |
| `tebakan` / `sorak` / `lencana` | per R15 / R16 / R17 | `sorak` unik per (anon_id, listing_id, tanggal); `lencana` unik per (listing_id, jenis) |

**State machine listing** — separuh bug produksi hidup di transisi yang tidak terdefinisi, jadi ini eksplisit:

| Dari → Ke | Pemicu | Efek pegangan |
|---|---|---|
| `draft → menunggu_bayar` | Invoice Midtrans dibuat | — |
| `menunggu_bayar → tayang` | Webhook settlement terverifikasi | Ledger `bayar` +nominal |
| `menunggu_bayar → kedaluwarsa` | 60 menit tanpa bayar | — (bisa dibuat ulang) |
| `tayang → ditahan` | Moderasi AI `tolak`/`ragu` berisiko, atau laporan dieskalasi manusia | Rosot dihentikan sementara |
| `ditahan → tayang` | Manusia meloloskan | Rosot lanjut; masa tahan tidak dirosot |
| `ditahan → ditolak` | Manusia menolak | Ledger `refund` −seluruh sisa; Midtrans refund |
| `tayang → diturunkan` | Klaim pemilik URL terverifikasi (§18) | Refund pro-rata sisa pegangan, keputusan manusia |
| `tayang (pegangan → Rp1.000)` | Rosot mencapai lantai | Tetap `tayang` di ekor — bukan status baru, tidak pernah dihapus |

Transisi lain tidak sah dan ditolak di level aplikasi + constraint database.

**Aturan seri & race (definisi teknis §5).** Webhook diproses **serial per papan** (advisory lock / antrean tunggal): urutan pegangan yang sama diputus oleh urutan commit webhook, bukan waktu bayar di sisi user. Dua pembayaran menyalip posisi sama dalam detik yang sama → yang webhook-nya ter-commit lebih dulu menang; keduanya tetap dapat pegangan penuhnya. Isolasi transaksi mencegah papan pernah menampilkan keadaan setengah-jadi.

**Retensi & pemulihan:**
- `klik` mentah disimpan 13 bulan lalu dihapus (agregat `klik_harian` permanen) — meminimalkan data pribadi mengendap (UU PDP); `ip_hash` sendiri kehilangan makna begitu salt harian dirotasi.
- `notifikasi_log` 6 bulan; `raw_payload` transaksi mengikuti kebutuhan pajak/audit (≥5 tahun praktik umum — konfirmasi dengan akuntan, §13.2).
- Backup: point-in-time recovery aktif; target **RPO ≤ 1 jam, RTO ≤ 4 jam**; latihan restore sekali per kuartal — backup yang tidak pernah diuji restore dianggap tidak ada.

### 17.3 Skala: jangan membangun untuk masalah yang belum ada

Listing terbesar Pamerin ~79 ribu klik dalam hitungan bulan. Pada 10× keramaian itu pun ini wilayah Postgres. **Tidak ada ClickHouse/TimescaleDB/warehouse di roadmap.** Tabel `klik` >20 juta baris → partisi bulanan dulu; pindah engine = keputusan tahun depan. Grafik dasbor: uPlot (±40KB) atau SVG tulis tangan.

### 17.4 Pembayaran: Midtrans (dikunci)

| Aspek | Keputusan |
|---|---|
| Integrasi | **Snap** — satu popup untuk semua metode, tercepat untuk tim kecil |
| Metode | QRIS + GoPay + OVO/Dana + VA bank; kartu kredit menyusul bila diminta |
| Kebenaran pembayaran | Pegangan aktif **hanya** dari webhook bertanda tangan terverifikasi, idempoten per `order_id` (R2) |
| Sandbox | Seluruh F1 terhadap sandbox; produksi butuh entitas usaha (§13.2) |
| Rekonsiliasi | `transaksi` vs settlement report bulanan; selisih diinvestigasi sebelum ditutup |
| Biaya | QRIS ~0,7%, e-wallet ~2%, VA flat ~Rp4.000 — verifikasi saat aktivasi. Minimum naik Rp5.000 sudah memperhitungkan ini; VA masuk akal di ≥Rp25.000 |

Event transaksi PostHog (`naik_tiang`, `manjat_lagi`) dikirim **dari server saat webhook diproses** — funnel uang kebal adblock dan cocok dengan `transaksi`.

---

## 18. Keamanan (R19)

Produk ini menerima uang dari orang asing dan menampilkan konten mereka ke publik — dua permukaan serangan sekaligus. Item P0 adalah gerbang rilis F1, sama seperti requirement fungsional.

### 18.1 Konten pihak ketiga di halaman publik (P0)

Serangan paling mungkin terjadi: orang membayar Rp5.000 dan menaruh payload di deskripsi listing yang berjalan di browser semua pengunjung.

- [ ] Nama dan deskripsi listing adalah **plain text murni** — tidak ada HTML/markdown yang di-render. Escaping di output, validasi di input.
- [ ] Content Security Policy ketat: tidak ada inline script, sumber script hanya dari domain sendiri + CDN yang disebut eksplisit. CSP juga meredam dampak kalau escaping bocor di satu tempat.
- [ ] SVG logo unggahan di-sanitasi (SVG bisa memuat script) atau dirasterisasi ke WebP saat proses R2/R4.
- [ ] URL listing divalidasi skema http/https saja; `javascript:` dan `data:` ditolak.

### 18.2 Autentikasi dasbor via magic link (P0)

- [ ] Token entropi ≥128-bit, sekali pakai, umur 15 menit — sukses menukar jadi sesi berumur 30 hari.
- [ ] Rate limit pengiriman: maks 3 per kontak per jam.
- [ ] **Verifikasi kepemilikan email/WA sebelum dasbor pertama dibuka** — salah ketik email saat bayar tidak boleh menyerahkan kendali listing ke orang lain. Sampai terverifikasi, listing tetap tayang tapi dasbor terkunci.
- [ ] Tautan di notifikasi WA/email tidak pernah memuat token sesi penuh, hanya token sekali pakai.

### 18.3 Pembayaran & webhook (P0 — melengkapi R2)

- [ ] Verifikasi `signature_key` + tolak notifikasi dengan `order_id` yang tidak dikenal.
- [ ] Jendela replay: notifikasi untuk transaksi yang sudah final diabaikan (idempoten R2 mencakup ini; tercatat di log).
- [ ] Nominal di webhook dicocokkan dengan nominal invoice — selisih apa pun menahan transaksi untuk review manusia, tidak diproses otomatis.

### 18.4 Rate limit & anti-abuse endpoint (P0)

- [ ] Rate limit global per IP di semua endpoint tulis.
- [ ] `/api/preview` khusus ketat (±10 req/menit/IP + cache 24 jam) — tanpa ini ia jadi proxy scraping gratis untuk orang lain, di atas risiko SSRF yang sudah ditangani R2.
- [ ] Redirect klik `/k/{listing}` dan endpoint Sorak/Tebakan dilindungi rate limit per ID + IP (selaras R14/R16).
- [ ] Cloudflare (atau setara) di depan seluruh trafik: DDoS, bot management dasar, TLS.

### 18.5 Admin & operasional (P0)

- [ ] Panel admin: autentikasi terpisah + **2FA wajib**; tidak pernah berbagi sesi dengan sisi publik.
- [ ] Setiap aksi moderasi tercatat di `moderasi_log` dengan aktor dan alasan — bukti saat sponsor protes penolakan.
- [ ] Secrets (Midtrans server key, API AI, salt harian) di secret manager / env — tidak pernah di repo; server key Midtrans tidak pernah menyentuh klien.
- [ ] Error tracking (mis. Sentry) dengan scrubbing PII — email/WA tidak boleh bocor ke log pihak ketiga.
- [ ] Header keamanan: HSTS, `frame-ancestors 'none'` (papan tidak boleh di-iframe untuk clickjacking), Referrer-Policy.
- [ ] Audit dependensi otomatis (Dependabot/`npm audit`) berjalan di CI.

### 18.6 Kepemilikan URL & jalur klaim (P1, kebijakan ditulis sejak F1)

Siapa pun bisa mendaftarkan URL siapa pun — termasuk memasang produk pesaing dengan deskripsi menjelekkan, atau menunggangi brand orang lain.

- [ ] Halaman aturan menyatakan kebijakan sejak hari pertama: pemilik sah sebuah URL berhak mengklaim atau meminta penurunan listing atas URL-nya.
- [ ] Verifikasi klaim: DNS TXT record, file di root domain, atau email di domain yang sama. Untuk akun sosmed: DM/post verifikasi.
- [ ] Klaim terverifikasi → pilihan pemilik: ambil alih dasbor listing, atau turunkan (status `diturunkan`, refund pro-rata ke pembayar — state machine §17.2). Keputusan akhir manusia, SLA 3×24 jam.
- [ ] Deskripsi yang menyerang/menjelekkan pihak yang di-listing masuk kategori moderasi R8 sejak awal, tanpa menunggu klaim.

### 18.7 Legal yang menyertai (P0 sebelum rilis publik)

- [ ] Kebijakan Privasi selaras UU PDP: data apa yang disimpan (kontak, ip_hash bersalt, cookie anon), berapa lama (§17.2 retensi), hak penghapusan.
- [ ] Syarat & Ketentuan memuat: tidak ada refund pegangan berjalan (R9), kebijakan moderasi & klaim URL, batasan tanggung jawab atas konten sponsor.
- [ ] Uji SSRF (checklist R2) dan uji prompt injection (R8) dijalankan dan didokumentasikan sebelum rilis.

---

*Dokumen ini opinionated dan berisi asumsi yang belum divalidasi — terutama laju rosot dan penerimaan pasar terhadap tiang licin. F0 ada untuk membunuh atau mengonfirmasi asumsi itu sebelum menulis kode.*
