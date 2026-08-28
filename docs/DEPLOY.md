# Deploy — panjat.id (Vercel + Supabase + Upstash)

Panduan langkah-per-langkah untuk merilis Panjat ke produksi. Stack: **Next.js di
Vercel**, **Postgres di Supabase**, **Redis di Upstash**, **Midtrans** untuk
pembayaran. Env lengkap ada di `.env.production.example`; blocker rilis ada di
`docs/QA-PRA-PRODUKSI.md`.

> **Urutan yang disarankan:** kerjakan Langkah 1–8 dulu dengan **Midtrans SANDBOX**
> di sebuah **Preview deploy** untuk membuktikan jalur pembayaran (Langkah 10),
> baru ganti ke kunci **production** untuk go-live. Jangan langsung publik.

---

## 0. Prasyarat
- Akun **GitHub**, **Vercel** (rencanakan **Pro** — cron per-jam butuh Pro), **Supabase**, **Upstash**, **Midtrans** (production merchant), domain **panjat.id**.
- Lokal: `pnpm`, `openssl`, akses `psql`/tsx untuk migrasi.

## 1. Push ke GitHub
1. Pastikan tidak ada secret ter-commit: `git check-ignore .env.local` harus mengembalikan `.env.local` (sudah di-`.gitignore`).
2. `git push` repo ke GitHub (branch `main`).

## 2. Supabase (Postgres)
1. Buat project baru → region terdekat (mis. Singapore).
2. Ambil **dua** connection string dari **Project Settings → Database**:
   - **Pooler / Transaction (port 6543)** → dipakai runtime Vercel. Serverless **wajib** pooling.
   - **Direct (port 5432)** → dipakai menjalankan migrasi.
   - Keduanya harus berakhiran `?sslmode=require` (Supabase wajib SSL).
3. Abaikan Supabase Auth/RLS/PostgREST — Panjat konek langsung sebagai role Postgres, auth di app-layer.
4. Aktifkan **backup** (ini data uang).

## 3. Upstash (Redis)
1. Buat database Redis (atau lewat **Vercel Marketplace → Upstash**).
2. Ambil `REDIS_URL` (skema `rediss://`, TLS). Supabase **tidak** menyediakan Redis — ini terpisah dan wajib (rate-limit, cache preview, presence).

## 4. Migrasi + seed produksi (dari mesin lokal)
Jalankan sekali sebelum ada trafik, pakai **DIRECT** URL Supabase:

```bash
# 1) Skema + trigger append-only/state-machine (hand-authored)
DATABASE_URL="<SUPABASE_DIRECT_URL>" pnpm db:migrate

# 2) HANYA kategori + konfigurasi (§6.6). TANPA listing demo. Idempotent & non-destruktif.
DATABASE_URL="<SUPABASE_DIRECT_URL>" pnpm db:seed:prod
```

> ⚠️ **Jangan** pakai `pnpm db:seed` di produksi — itu memuat 35 listing palsu + `TRUNCATE`.
> `db:seed:prod` aman diulang (mis. saat menambah config key baru) dan tak menimpa nilai yang sudah kamu tuning.

## 5. Import ke Vercel + Environment Variables
1. Vercel → **Add New → Project** → import repo GitHub. Framework auto-detect Next.js; build/output default.
2. **Settings → Environment Variables** (scope: Production, dan Preview untuk staging). Isi dari `.env.production.example`:
   - `DATABASE_URL` = **pooler** Supabase (6543). `REDIS_URL` = Upstash.
   - `NEXT_PUBLIC_BASE_URL=https://panjat.id`.
   - Midtrans (lihat Langkah 7).
   - **Semua secret dirotasi** (`openssl rand -hex 32`): `KLIK_HASH_SECRET`, `SESSION_SECRET`, `ANON_SECRET`, `NOTIF_SECRET`, `ADMIN_SECRET`, `CRON_SECRET`. `ADMIN_PASSWORD` yang kuat (bukan `admin`).
   - `ANTHROPIC_API_KEY` (moderasi AI Layer-2), `BLOB_READ_WRITE_TOKEN` (opsional, screenshot).

## 6. Domain
1. Vercel → **Settings → Domains** → tambahkan `panjat.id` (+ `www` redirect bila mau).
2. Set DNS di registrar sesuai instruksi Vercel. Tunggu TLS aktif.

## 7. Midtrans (production)
1. Env: `MIDTRANS_SERVER_KEY` + `MIDTRANS_CLIENT_KEY` **production**, `MIDTRANS_IS_PRODUCTION=true`, `MIDTRANS_MOCK=false`.
2. Dashboard Midtrans → **Settings → Configuration → Payment Notification URL**:
   `https://panjat.id/api/webhook/midtrans`. Grip aktif **hanya** dari webhook terverifikasi ini (bukan redirect browser).
3. **Snap Preferences**: aktifkan metode bayar (kartu, **QRIS/GoPay/ShopeePay** — nominal <Rp25.000 hanya lewat e-wallet, jadi ini wajib aktif) dan **whitelist domain `panjat.id`**.
4. Redirect "selesai bayar" sudah otomatis ke `panjat.id` (via `callbacks.finish` per-transaksi di kode).
5. **Jika Merchant ID dipakai bareng situs lain milikmu**: set env `MIDTRANS_NOTIFICATION_URL=https://panjat.id/api/webhook/midtrans` (mengirim `X-Override-Notification` per-transaksi; situs lain tetap pakai URL dashboard). Kosongkan bila MID khusus Panjat.

## 8. Cron (Vercel Pro)
- `vercel.json` sudah mendeklarasikan jadwal: **rosot per-jam** (`0 * * * *`), reconcile, moderasi, screenshot, tebak, lencana, juara-mingguan.
- Vercel Cron mengirim `Authorization: Bearer $CRON_SECRET` otomatis; `src/lib/cron.ts` **fail-closed 503** bila `CRON_SECRET` tak diset. Pastikan `CRON_SECRET` ada di env produksi.
- **Cron per-jam butuh plan Pro.** Rosot (§6) & reconcile (alarm drift ledger) adalah job kritis.

## 9. Admin + 2FA (§18.5) — sebelum publik
1. Generate TOTP: `pnpm admin:2fa` → set `ADMIN_TOTP_SECRET` di env, scan otpauth URL ke authenticator.
2. Pastikan `ADMIN_PASSWORD` sudah diganti dari `admin`.

## 10. Deploy + uji jalur pembayaran (staging dulu)
1. Push ke `main` → Vercel build & deploy otomatis (atau `vercel --prod`).
2. **Bukti jalur uang di Preview + kunci SANDBOX** sebelum production: bayar 1 transaksi (kartu tes `4811 1111 1111 1114`, OTP `112233`) → pastikan transaksi jadi `settlement` & grip aktif. Ini membuktikan webhook + `X-Override` (bila dipakai) benar-benar dihormati Snap.
3. Setelah sandbox lolos, ganti ke kunci production → **1 transaksi kecil sungguhan** → konfirmasi settle → baru buka publik.

## 11. Smoke test pasca-deploy
- Semua halaman utama 200; `/` menampilkan papan; `/statistik` memuat Umami.
- `/api/webhook/midtrans` menerima notifikasi (cek 1 transaksi → `settlement`).
- Cron manual: `curl -H "Authorization: Bearer $CRON_SECRET" https://panjat.id/api/cron/reconcile` → `{"ok":true,"mismatches":0}`.
- `/admin` minta password + 2FA. Magic-link dashboard (lihat blocker email di bawah).

## 12. Catatan & caveat
- **Screenshot worker (R21, Playwright/Chromium)** berat untuk serverless Vercel. Opsi: build command `pnpm exec playwright install chromium && pnpm build` (berisiko kena limit), **atau** tunda / host terpisah (Railway/Fly). Ini best-effort — papan tak bergantung padanya (fallback ke og:image/logo).
- **Email/WA belum ter-wire** (magic-link login & notifikasi "disalip" saat ini dev-only `devLink`/console — TODO di `src/app/api/dasbor/masuk/route.ts`). **Wire provider (mis. Resend/Twilio) sebelum publik**, atau dashboard login tak berfungsi di prod.
- **Analytics**: Umami sudah terpasang di `/statistik` (cookieless, sudah di-allowlist di CSP `src/middleware.ts`). Kalau mengaktifkan **PostHog**, tambahkan host-nya ke `connect-src` di `src/middleware.ts` (CSP saat ini hanya `'self'` + Umami).
- **Keamanan (§18)** sudah terimplementasi & tertes: webhook signature+idempotency, SSRF guard, IP-hash klik, CSP nonce, cookie signed+httpOnly. Yang tersisa murni ops: rotasi secret + 2FA (Langkah 5 & 9).
- **Rollback**: Vercel → Deployments → Promote deploy sebelumnya. Data ledger append-only + cron reconcile menjaga integritas grip.
