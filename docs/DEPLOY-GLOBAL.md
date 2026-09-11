# Deploy — global board (English / USD / Paddle)

The global board runs the **same codebase** as panjat.id as a **separate Vercel
project** with a **separate database**. There is no `board_id` multi-tenancy: each
deployment is one board, distinguished entirely by environment variables. panjat.id
is untouched — with none of the market vars set it stays IDR / id / Asia/Jakarta /
Midtrans exactly as before.

> Do Steps 1–7 against **Paddle sandbox** on a Preview deploy first and prove one
> real end-to-end payment (Step 8) before switching to production keys.

## 1. Provision data (separate from panjat.id)
- **Postgres** (Supabase/Neon): a brand-new database. Apply the same migrations
  panjat.id uses (`pnpm db:migrate`), which include the append-only triggers and
  the state-machine constraints.
- **Redis** (Upstash): a new instance (favorit/sorak/presence tallies). Fully
  isolated — no key collisions with panjat.id.

## 2. Link a new Vercel project
```bash
vercel link          # create a new project, e.g. "panjat-global", same repo
```

## 3. Environment variables (Production)
Generate secrets fresh (`openssl rand -hex 32`) — never reuse panjat.id's.
```bash
# Market
vercel env add MARKET production                 # "global"  (USD + en + UTC + paddle)
vercel env add TZ_OVERRIDE production             # e.g. "America/New_York" (or leave UTC)
vercel env add PUBLIC_HOSTS production            # e.g. "panjat.global,www.panjat.global"
vercel env add NEXT_PUBLIC_BASE_URL production    # https://<global-domain>
# Data
vercel env add DATABASE_URL production            # the new Postgres
vercel env add REDIS_URL production               # the new Upstash
# Payments (Paddle — Merchant of Record)
vercel env add PAYMENT_GATEWAY production          # "paddle"
vercel env add PADDLE_API_KEY production
vercel env add PADDLE_WEBHOOK_SECRET production
vercel env add PADDLE_PRODUCT_ID production
vercel env add PADDLE_ENV production                # "sandbox" first, then "production"
# Fresh copies of every secret panjat.id uses:
vercel env add SESSION_SECRET production
vercel env add ANON_SECRET production
vercel env add KLIK_HASH_SECRET production
vercel env add NOTIF_SECRET production
vercel env add CRON_SECRET production               # REQUIRED (cron 503s if unset)
vercel env add ADMIN_PASSWORD production
vercel env add ADMIN_SECRET production
vercel env add ADMIN_TOTP_SECRET production         # REQUIRED before public (pnpm admin:2fa)
vercel env add ANTHROPIC_API_KEY production         # optional (AI moderation)
vercel env add BLOB_READ_WRITE_TOKEN production      # optional (screenshots)
```
Leave **all `MIDTRANS_*` unset** on this project (the gateway factory selects Paddle
from `PAYMENT_GATEWAY`/`MARKET`). Currency (USD), locale (en), and decimals are
inferred from `MARKET=global`; override with `CURRENCY`/`LOCALE`/`DEFAULT_LOCALE` if
needed.

## 4. Migrate + seed the global DB
The seed picks USD money-tunables and English category names from `MARKET`:
```bash
MARKET=global DATABASE_URL='postgres://...' pnpm db:migrate
MARKET=global DATABASE_URL='postgres://...' pnpm db:seed:prod
```
Verify: `konfigurasi.minimum_naik = 500` ($5.00), `kaki_tiang = 100` ($1.00), and
categories in English.

## 5. Paddle setup
- Create a **product** (get `PADDLE_PRODUCT_ID`) and confirm your account can create
  transactions with a **custom per-order unit price** (grip = board-top + 1 cent).
  This is the one item to validate against the current Paddle API before launch —
  the checkout uses an inline price of `unit_price.amount = <cents>` (see
  `src/lib/gateways/paddle-gateway.ts`). Until keys are set, checkout falls back to
  the local mock-pay page.
- Set the webhook destination to `https://<global-domain>/api/webhook/paddle` and
  copy the signing secret into `PADDLE_WEBHOOK_SECRET`.

## 6. Domain + admin host
- Attach the global domain to the project.
- Admin is served from `adm.<global-domain>` (same rule as panjat.id). `PUBLIC_HOSTS`
  hides `/admin` on the public host(s). Add the `adm.` DNS record.

## 7. Cron
Vercel Cron on this project runs the same routes (`/api/cron/*`) with its own
`CRON_SECRET`. Day/week resets follow `TZ_OVERRIDE` + `WEEK_ANCHOR_MS`.

## 8. Prove it end-to-end (sandbox)
One small real payment: create checkout → pay in Paddle sandbox → Paddle posts to
`/api/webhook/paddle` → signature verified → `bayar` appended to `pegangan_ledger`
→ `pegangan_cached` re-derived → rank changes on the board. Confirm a replayed
webhook is idempotent (no double grip) and an amount mismatch is held for review.

## Release gates
- [ ] `MARKET=global` + `PAYMENT_GATEWAY=paddle` set; all `MIDTRANS_*` unset
- [ ] `ADMIN_TOTP_SECRET`, `CRON_SECRET`, all `*_SECRET` fresh (not panjat.id's)
- [ ] Migrate + seed run on the global DB (USD tunables verified)
- [ ] Paddle webhook wired + one sandbox payment settled end-to-end
- [ ] Arbitrary-amount Paddle checkout confirmed against the live API
