# Deploy — global board (English / USD / Polar)

The global board runs the **same codebase** as panjat.id as a **separate Vercel
project** with a **separate database**. There is no `board_id` multi-tenancy: each
deployment is one board, distinguished entirely by environment variables. panjat.id
is untouched — with none of the market vars set it stays IDR / id / Asia/Jakarta /
Midtrans exactly as before.

The global board's payment gateway is **Polar** (a Merchant-of-Record). Checkout is
a **redirect to a hosted page**, so no client-side SDK ships and there's no
"approved-domain overlay" gotcha. Code: `src/lib/gateways/polar-gateway.ts` (verify
+ normalize + checkout) and `/api/webhook/polar`. Until credentials are set, checkout
falls back to the local mock-pay page, so the flow is exercisable offline.

> Do everything below against **Polar sandbox** on a Preview deploy first and prove
> one real end-to-end payment (Step 8) before switching to production keys. Sandbox
> and production are fully separate Polar accounts.

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
# Market (NEXT_PUBLIC_ so the browser gets them too — client formats money/copy/time)
vercel env add NEXT_PUBLIC_MARKET production      # "global"  (USD + en + UTC + polar)
vercel env add NEXT_PUBLIC_TZ_OVERRIDE production # e.g. "America/New_York" (or leave UTC)
vercel env add PUBLIC_HOSTS production            # e.g. "panjat.global,www.panjat.global"
vercel env add NEXT_PUBLIC_BASE_URL production    # https://<global-domain>
# Data
vercel env add DATABASE_URL production            # the new Postgres
vercel env add REDIS_URL production               # the new Upstash
# Payments (Polar — Merchant of Record). Server-only; no client token, no NEXT_PUBLIC_.
vercel env add PAYMENT_GATEWAY production          # "polar" (redundant with MARKET=global, but explicit)
vercel env add POLAR_ACCESS_TOKEN production        # polar_oat_… (from Step 5.2)
vercel env add POLAR_WEBHOOK_SECRET production      # whsec_…    (from Step 5.4)
vercel env add POLAR_PRODUCT_ID production          # from Step 5.3
vercel env add POLAR_ENV production                 # "sandbox" first, then "production"
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
Leave **all `MIDTRANS_*` unset** on this project (the gateway factory selects Polar
from `MARKET=global`). Currency (USD), locale (en), and decimals are inferred from
`MARKET=global`; override with `CURRENCY`/`LOCALE`/`DEFAULT_LOCALE` if needed.

## 4. Migrate + seed the global DB
The seed picks USD money-tunables and English category names from `MARKET`:
```bash
MARKET=global DATABASE_URL='postgres://...' pnpm db:migrate
MARKET=global DATABASE_URL='postgres://...' pnpm db:seed:prod
```
Verify: `konfigurasi.minimum_naik = 500` ($5.00), `kaki_tiang = 100` ($1.00), and
categories in English.

## 5. Polar setup
Do this in **Polar sandbox** first (sandbox.polar.sh); repeat in the live workspace
(polar.sh) at go-live — they are separate accounts, not a mode toggle.

### 5.1 Create the organization
Create an **Organization** (your seller identity; its slug appears in checkout URLs).

### 5.2 Organization Access Token → `POLAR_ACCESS_TOKEN`
The server API is authenticated with an **Organization Access Token** (prefix
`polar_oat_…`), scoped to one org.
1. **Settings → (Developers / API — "Organization Access Tokens") → Create Token.**
2. Name it (e.g. `panjat-checkout`), set an expiration, and grant the **minimum
   scopes**: `checkouts:write` (required) + optionally `products:read`,
   `checkouts:read`. Nothing else — not `transactions`, `orders`, or `webhooks`
   (webhook verification uses the signing secret, not this token).
3. **Copy it now** — shown once. Store in Vercel env, never the repo. Regenerate if leaked.
4. Environment-bound: a **sandbox** token only works against `sandbox-api.polar.sh`,
   a **production** token only against `api.polar.sh`. The code picks the base URL
   from `POLAR_ENV`.

### 5.3 Product with a custom (pay-what-you-want) price → `POLAR_PRODUCT_ID`
Grip is an arbitrary per-order amount (board-top + 1 minor unit), so the price must
accept a custom amount.
1. **Products → New Product** (e.g. "Panjat — climb").
2. Pricing → **"Pay what you want"** (custom amount), minimum ≈ the board's
   `minimum_naik` = $5.00 = `500`. One product is enough — the exact amount is
   passed per checkout.
3. Copy the **product ID** → `POLAR_PRODUCT_ID`.

### 5.4 Webhook endpoint → `POLAR_WEBHOOK_SECRET`
1. **Settings → Webhooks → Add Endpoint.**
2. URL: `https://<global-domain>/api/webhook/polar`, Format **Raw / Standard Webhooks**.
3. Subscribe to at least **`order.paid`** (add `order.refunded` later if/when the
   refund→ledger path is wired).
4. Copy the **signing secret** (`whsec_…`) → `POLAR_WEBHOOK_SECRET`. Our verifier
   follows the Standard Webhooks spec (HMAC-SHA256 over `id.timestamp.body`, base64).

`NEXT_PUBLIC_BASE_URL` (Step 3) must be correct — it builds the `success_url` Polar
redirects to after payment (`/manjat/selesai?order=<id>`).

## 6. Domain + admin host
- Attach the global domain to the project.
- Admin is served from `adm.<global-domain>` (same rule as panjat.id). `PUBLIC_HOSTS`
  hides `/admin` on the public host(s). Add the `adm.` DNS record.

## 7. Cron
Vercel Cron on this project runs the same routes (`/api/cron/*`) with its own
`CRON_SECRET`. Day/week resets follow `TZ_OVERRIDE` + `WEEK_ANCHOR_MS`.

## 8. Prove it end-to-end (sandbox)
manjat → server creates a Polar checkout (`POST /v1/checkouts/` with our `order_id`
in `metadata` + custom `amount`) → browser redirects to Polar's hosted checkout →
pay with a **test card** → Polar posts `order.paid` to `/api/webhook/polar` →
signature verified → `bayar` appended to `pegangan_ledger` → `pegangan_cached`
re-derived → rank changes on the board. Confirm a replayed webhook is idempotent
(no double grip) and a bad signature is rejected (401).

Offline shortcut (no tunnel/keys): `pnpm polar:sim` runs a signed `order.paid`
through the real verify→settle path against a seeded dev DB (24 checks).

## Polar production go-live
Live and sandbox are separate Polar accounts with separate credentials.
- [ ] **Business / payout onboarding** complete in the live org (MoR payout runs via
      Stripe Connect — start early; can take days).
- [ ] **Live** organization access token (`polar_oat_…`, `checkouts:write`) →
      `POLAR_ACCESS_TOKEN`; set `POLAR_ENV=production`.
- [ ] **Live product** (pay-what-you-want) → `POLAR_PRODUCT_ID`.
- [ ] **Live webhook** → `https://<domain>/api/webhook/polar`, `order.paid`
      subscribed; secret → `POLAR_WEBHOOK_SECRET`.
- [ ] **USD** enabled as the settlement currency; product tax category = digital
      goods (Polar as MoR computes VAT/sales tax).

## Code validation (do in sandbox first — the "validate before go-live" notes in `src/lib/gateways/polar-gateway.ts`)
- [ ] **Webhook secret encoding** — a real Polar `order.paid` verifies with our
      base64/Standard-Webhooks HMAC. If Polar signs differently, adjust
      `signPolar`/`verifyPolarSignature` or swap in `@polar-sh/sdk`'s validator.
- [ ] **Arbitrary amount** — `POST /v1/checkouts/` accepts our custom `amount`
      (minor units) for the pay-what-you-want product.
- [ ] **Create-checkout field names** — `products` / `amount` / `metadata` /
      `success_url` / `customer_email` match the current Polar API.
- [ ] **Amount = grip** — the order field we read (`data.amount`) equals what we
      charged (tax-exclusive), so `settle()`'s amount-match doesn't reject. If Polar
      reports tax-inclusive totals, read the pre-tax field instead.
- [ ] **`metadata` propagation** — checkout `metadata.order_id` appears on the
      `order.paid` payload (it is our idempotency key).
- [ ] **One real small live payment** (real card): redirect → webhook → `bayar` in
      `pegangan_ledger` → rank changes. Then refund it in Polar to check the
      needs-review path.

## Release gates (global deploy)
- [ ] `NEXT_PUBLIC_MARKET=global` set; all `MIDTRANS_*` unset
- [ ] `POLAR_ACCESS_TOKEN` / `POLAR_WEBHOOK_SECRET` / `POLAR_PRODUCT_ID` set;
      `POLAR_ENV` correct for the workspace
- [ ] `ADMIN_TOTP_SECRET`, `CRON_SECRET`, all `*_SECRET` fresh (not panjat.id's)
- [ ] Separate Neon + Upstash provisioned; migrate + seed run on the global DB
      (USD tunables verified)
- [ ] Global domain attached; admin on `adm.<domain>` (`PUBLIC_HOSTS` set)
- [ ] Cron jobs scheduled on the global Vercel project
- [ ] Sandbox end-to-end proven (Step 8) incl. idempotent replay + rejected bad signature

---

# Cross-board geo routing (optional)

Because IDR and USD are **separate boards on separate domains** (a single-currency
ledger is a ranking contract — you cannot mix currencies in one board), visitors
are routed by an **auto-redirect** in `middleware.ts`, kept SEO-safe:

- **Bots are excluded** (crawlers index each domain normally — no cloaking).
- **Remembered:** arriving via the footer switcher (`?stay=1`) sets a `board_pref`
  cookie so the visitor is never bounced away again.
- **Override:** a persistent **footer switcher** links to the sibling board with
  `?stay=1`, so anyone (VPN users, travellers) can pin the other board.
- **hreflang:** the two domains declare each other as locale variants (layout
  metadata), so the redirect reads as regionalisation, not cloaking.
- Only real page navigations redirect — never `/api`, assets, POSTs, or `adm.*`.

The two boards' rules are complementary, so they never loop (each only redirects
the *wrong* country away, and the target board treats that country as correct).

Set on **each** project (switcher label in the *target* board's language):
```bash
# On panjat.id — send non-Indonesian visitors to the global board:
ALT_BOARD_URL=https://<global-domain>
ALT_BOARD_LABEL=View the global board (USD)
ALT_BOARD_COUNTRIES=!ID        # redirect when visitor is NOT in ID

# On the global board — send Indonesian visitors home:
ALT_BOARD_URL=https://panjat.id
ALT_BOARD_LABEL=Buka Panjat versi Indonesia (Rupiah)
ALT_BOARD_COUNTRIES=ID         # redirect when visitor IS in ID
```
Country comes from Vercel's `x-vercel-ip-country`. Locally, set
`GEO_COUNTRY_OVERRIDE=ID` (or spoof the header) to test — no edge geo off Vercel.
Code: `src/lib/board-routing.ts` (rule), `middleware.ts` (redirect + `board_pref`),
`Footer.tsx` (switcher), `layout.tsx` (hreflang).
