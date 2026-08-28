# QA Pra-Produksi — Panjat

_Pemeriksaan QA fungsional + Design QA menyeluruh untuk semua halaman & alur. Dijalankan terhadap dev server (seed data + `MIDTRANS_MOCK`)._

## Ringkasan
**Status: siap rilis F1 setelah menyelesaikan blocker ops di bawah.** Tidak ada blocker di level kode yang tersisa. Semua alur inti lolos end-to-end; kontrak uang (grip hanya dari webhook, idempoten, ledger 0 drift) terverifikasi.

---

## 1. Gerbang otomatis
| Gate | Hasil |
|------|-------|
| `pnpm test` (vitest) | ✅ 19 file / **92 tes lolos** — mencakup webhook signature+idempotency, rosot, ranking, klik dedup, IP-hash, SSRF, moderasi, TOTP, dashboard state machine |
| `npx tsc --noEmit` | ✅ Bersih |
| `pnpm build` | ✅ Sukses (24 rute) |
| `pnpm lint` | ⚠️ 22 error / 19 warning — semua kategori **pre-existing & diterima**: `no-img-element` (satori/remote logo wajib pakai `<img>`), `no-html-link-for-pages` (pola `<a href>` internal konsisten seluruh app), `set-state-in-effect`, `no-unused-vars`. Tidak ada kategori baru; build tetap hijau. |

## 2. QA Fungsional — rute & alur
**Semua rute halaman**: 200 / redirect benar. `/dasbor`→`/dasbor/masuk` (307), `/admin`→`/admin/masuk` (307), UUID/slug/tanggal invalid → **404**, `/k/{id}` → 302 + UTM.

**Alur inti (lolos):**
- **Manjat (bayar)**: quote → create → mock-settle → `tayang` + grip → `/manjat/selesai` reveal ("Kamu naik ke #16"). ✅
- **Idempotency**: re-settle → `ignored/replay`, grip tidak dobel. ✅
- **Integritas ledger**: cron `reconcile` → `mismatches: 0`. ✅
- **Pasang gratis**, **Sorak** (anon cookie, cap harian), **Klik** redirect, **Board SSE** (`data:` events). ✅
- **Dasbor**: magic-link (devLink) → verifikasi → sesi → detail listing. ✅
- **Admin**: login password → antrian moderasi. ✅
- **Share/OG**: semua rasio × mode (diverifikasi terpisah). ✅

## 3. Temuan & perbaikan yang diterapkan (kode)
| # | Temuan | Sev | Fix |
|---|--------|-----|-----|
| 1 | `/hari-ini/[tanggal]` tanggal valid-format tapi tidak-nyata (`9999-99-99`) → **500** | P1 (bug) | Guard validitas kalender → `notFound()` (404) |
| 2 | **Regresi tertangkap**: `loading.tsx` root membuat semua `notFound()` jadi **soft-404 (status 200)** — buruk untuk SEO | P1 | `loading.tsx` root dihapus; 404 asli pulih di seluruh app |
| 3 | Tidak ada halaman 404 / error boundary | P1 | Tambah `src/app/not-found.tsx` + `src/app/error.tsx` (retry), pakai `PageShell`-style + `copy.sistem` |
| 4 | Teks hardcode (R20-c) di `Spotlight`, `BoardLive`, `notif/unsub`, `HeroManjat`, `jelajah`, `Pagination`, champion kategori | P2 | Dipindah ke `src/copy.ts` (`papan.aktivitas*`, `papan.puncakBerganti`, `notif.unsub*`, `beranda.hero*`, `jelajah.cari*`, `sistem.*`) |
| 5 | Input cari `/jelajah` tanpa label (a11y) | P1 | Tambah `<label>` sr-only + `aria-label` pada hero input |
| 6 | Champion kategori pakai `merah` di luar summit/primary (§9.6.2) | P2 | Ganti ke token emas (`border-emas/50 bg-emas/8`) — selaras bahasa "juara" |
| 7 | Tombol `/jelajah` & `Pagination` tidak reuse primitive | P2 | Pakai `buttonClasses` + helper `copy.papan.pagination/sebelumnya/berikutnya` |

Gate diulang setelah fix: **tes 92/92, tsc bersih, build sukses**.

## 4. Keamanan P0 (§18) — status
Semua terimplementasi & tertes: ✅ webhook signature (constant-time) + idempotency (advisory lock, replay no-op) · ✅ SSRF guard (DNS + IP privat + redirect re-validate, timeout, size cap) · ✅ IP klik di-hash salt harian (tak pernah mentah) · ✅ CSP nonce + `X-Frame-Options`/`nosniff`/HSTS · ✅ cookie sesi/anon/admin `httpOnly`+signed+`Secure`(prod) · ✅ konten pihak-ketiga di-render plain text (tanpa `dangerouslySetInnerHTML`).

## 5. Reported — tidak diperbaiki (polish subjektif / by-design)
- `themeColor: "#f3f0e9"` literal di `layout.tsx` — Viewport metadata tak bisa baca CSS var; **wajar**.
- `bg-merah/8`, `from-emas/12` dsb. — itu **opacity modifier atas token**, bukan hex mentah; **wajar**.
- Tombol admin hand-rolled (`admin/page.tsx`) — internal tool, prioritas rendah.
- Tinggi dropdown `VoteFavorit` 40px vs 44px target sentuh — minor.
- Lint `no-img-element`/`no-html-link-for-pages` — pola diterima seluruh repo.

---

## 6. ⛔ BLOCKER OPS SEBELUM PUBLIC LAUNCH (bukan kode — wajib dikerjakan)
1. **Rotasi semua secret** dari default dev: `SESSION_SECRET`, `ANON_SECRET`, `KLIK_HASH_SECRET`, `NOTIF_SECRET`, `ADMIN_SECRET`, `CRON_SECRET`. Set `ADMIN_PASSWORD` asli (bukan `admin`).
2. **Aktifkan 2FA admin**: `ADMIN_TOTP_SECRET` via `pnpm admin:2fa` — saat ini single-factor (TODO di `src/lib/admin.ts`).
3. **Wire pengiriman email/WA** untuk magic-link login + notifikasi "disalip". Sekarang dev-only `devLink` (TODO di `src/app/api/dasbor/masuk/route.ts`). Tanpa ini, dashboard login & notifikasi tak jalan di prod.
4. **Pembayaran**: kunci Midtrans asli, `MIDTRANS_IS_PRODUCTION=true`, `MIDTRANS_MOCK=false`.
5. `NEXT_PUBLIC_BASE_URL=https://panjat.id` (OG, sitemap, link email).
6. `ANTHROPIC_API_KEY` (moderasi Layer-2; tanpa ini fallback ke antrian "ragu").
7. `BLOB_READ_WRITE_TOKEN` bila pakai Vercel Blob untuk screenshot (else lokal).
8. `DATABASE_URL` & `REDIS_URL` menunjuk instance produksi.
9. **Halaman legal** (Aturan/Privasi/Ketentuan): banner "Draf" sudah dihapus; disarankan tetap **review hukum sungguhan** sebelum publik, dan pastikan `halo@panjat.id` inbox aktif.

## 7. Rekomendasi lanjutan (non-blocker)
- Tambah tes integrasi e2e alur manjat penuh (wizard→webhook→ranking→notif); saat ini unit-level.
- Pertimbangkan `loading.tsx` per-rute (bukan root) untuk halaman berat, agar tak mengulang regresi soft-404.
