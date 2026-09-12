# Deploy — global board (English / USD / Paddle **or** Polar)

The global board runs the **same codebase** as panjat.id as a **separate Vercel
project** with a **separate database**. There is no `board_id` multi-tenancy: each
deployment is one board, distinguished entirely by environment variables. panjat.id
is untouched — with none of the market vars set it stays IDR / id / Asia/Jakarta /
Midtrans exactly as before.

> **Gateway choice.** The global board can be powered by **Paddle** (§5, default of
> `MARKET=global`) or **Polar** (`PAYMENT_GATEWAY=polar`). Steps 1–4, 6, 7 are
> identical; only the payments part differs. For Paddle follow Step 5 below; for
> Polar jump to **"Alternative gateway: Polar"** at the end and skip Step 5 +
> the Paddle env vars.

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
# Market (NEXT_PUBLIC_ so the browser gets them too — client formats money/copy/time)
vercel env add NEXT_PUBLIC_MARKET production      # "global"  (USD + en + UTC + paddle)
vercel env add NEXT_PUBLIC_TZ_OVERRIDE production # e.g. "America/New_York" (or leave UTC)
vercel env add PUBLIC_HOSTS production            # e.g. "panjat.global,www.panjat.global"
vercel env add NEXT_PUBLIC_BASE_URL production    # https://<global-domain>
# Data
vercel env add DATABASE_URL production            # the new Postgres
vercel env add REDIS_URL production               # the new Upstash
# Payments (Paddle — Merchant of Record)
vercel env add PAYMENT_GATEWAY production          # "paddle"
vercel env add PADDLE_API_KEY production            # server: create transaction
vercel env add PADDLE_WEBHOOK_SECRET production     # server: verify webhook HMAC
vercel env add PADDLE_PRODUCT_ID production         # server: product for custom-price txns
vercel env add PADDLE_ENV production                # "sandbox" first, then "production"
vercel env add NEXT_PUBLIC_PADDLE_CLIENT_TOKEN production  # client: Paddle.js overlay
vercel env add NEXT_PUBLIC_PADDLE_ENV production           # "sandbox" | "production"
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
Checkout flow (Paddle Billing): the **server** creates a transaction with a
non-catalog **custom price** (`unit_price.amount = <minor units>`) + our `order_id`
in `custom_data` (`src/lib/gateways/paddle-gateway.ts`); the **client** opens the
Paddle.js overlay for that transaction id (`src/lib/paddle-client.ts`). Grip still
activates only via the verified webhook.
- Developer Tools → Authentication: get the **server API key** (`PADDLE_API_KEY`)
  and the **client-side token** (`NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`).
- Catalog → create a **product** (get `PADDLE_PRODUCT_ID`); custom per-order price is
  passed inline, so one product is enough.
- Notifications → add a destination `https://<global-domain>/api/webhook/paddle`;
  copy the signing secret into `PADDLE_WEBHOOK_SECRET`. Subscribe to at least
  `transaction.completed` / `transaction.paid` (+ `payment_failed`/`canceled`).
- Until server keys are set, checkout falls back to the local mock-pay page, so the
  flow is exercisable offline.

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

## Paddle production go-live (operational — mostly in the Paddle dashboard)
Sandbox and production are separate Paddle accounts with separate credentials. Do
all of this in the **live** workspace once sandbox is proven.
- [ ] **Business verification** approved (Paddle reviews your business; can take
      days — start early). Live checkout won't accept payments until verified.
- [ ] **Payout details** added (bank account) so Paddle can settle funds to you.
- [ ] **Website/domain approved** in Paddle → Checkout settings. Live Paddle.js
      overlay only opens on an approved domain — this is the #1 prod gotcha.
- [ ] **Default payment link** set (Checkout settings) to your domain.
- [ ] **Product tax category** set to digital goods so Paddle (as MoR) computes
      the right VAT/sales tax.
- [ ] **USD** enabled as a presentment/settlement currency.
- [ ] **Live credentials** captured (from the live workspace):
      `PADDLE_API_KEY` (`pdl_live_apikey_…`), `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`
      (`live_…`), `PADDLE_WEBHOOK_SECRET`, `PADDLE_PRODUCT_ID`, and set
      `PADDLE_ENV=production` + `NEXT_PUBLIC_PADDLE_ENV=production`.
- [ ] **Live webhook destination** → `https://<domain>/api/webhook/paddle`,
      subscribed to `transaction.completed`, `transaction.paid`,
      `transaction.payment_failed`, `transaction.canceled`.

## Code validation (do in sandbox first)
- [ ] **Arbitrary-amount custom-price** transaction confirmed against the Paddle
      API (grip = board-top + 1¢ → inline `unit_price.amount`; see
      `src/lib/gateways/paddle-gateway.ts`).
- [ ] Overlay opens in `production` mode on the approved domain (client token +
      `NEXT_PUBLIC_PADDLE_ENV=production`).
- [ ] **One real small live payment** end-to-end (real card): overlay → webhook →
      `bayar` in `pegangan_ledger` → rank changes. Then **refund it** in Paddle to
      confirm the refund/needs-review path.
- [ ] Replayed webhook is idempotent (no double grip); amount mismatch is held.

## Release gates (global deploy)
- [ ] `NEXT_PUBLIC_MARKET=global` set; all `MIDTRANS_*` unset
- [ ] `ADMIN_TOTP_SECRET`, `CRON_SECRET`, all `*_SECRET` fresh (not panjat.id's)
- [ ] Separate Neon + Upstash provisioned; migrate + seed run on the global DB
      (USD tunables verified)
- [ ] Global domain attached; admin on `adm.<domain>` (`PUBLIC_HOSTS` set)
- [ ] Cron jobs scheduled on the global Vercel project

---

# Alternative gateway: Polar

Polar is a Merchant-of-Record like Paddle. It differs in one nice way: checkout is
a **redirect to a hosted page**, so **no client-side SDK ships** and there is no
"approved domain" gotcha for an overlay. Code lives in
`src/lib/gateways/polar-gateway.ts` (verify + normalize + checkout) and
`/api/webhook/polar`. Selected with `PAYMENT_GATEWAY=polar`. Until credentials are
set, checkout falls back to the local mock-pay page (exercisable offline).

Do everything below in **Polar sandbox first** (a fully separate environment from
production — separate account, tokens, products, and webhooks), prove one payment,
then repeat in the live workspace.

## P1. Create the Polar organization
1. Sandbox: sign up / log in at **sandbox.polar.sh** (production later at
   **polar.sh** — they are separate accounts, not a mode toggle).
2. **Create an Organization** (this is your seller identity; its slug appears in
   checkout URLs). Note the org.

## P2. Organization Access Token (this is `POLAR_ACCESS_TOKEN`)
Polar's server API is authenticated with an **Organization Access Token** (prefix
`polar_oat_…`). It is scoped to one organization — exactly what we want.
1. In the org, open **Settings → (Developers / API — "Organization Access Tokens")**.
2. **Create Token**. Give it a name (e.g. `panjat-checkout`), an expiration, and
   the **minimum scopes** the flow needs:
   - `checkouts:write` — create checkout sessions (required)
   - `checkouts:read` — optional, for debugging/reads
   - `products:read` — optional
   Grant nothing else (least privilege — this token can move money-adjacent
   resources).
3. **Copy the token now** — it is shown only once. This is `POLAR_ACCESS_TOKEN`.
   Store it in Vercel env, never in the repo. Regenerate if it ever leaks.
4. The token is environment-bound: a **sandbox** token only works against
   `sandbox-api.polar.sh`, a **production** token only against `api.polar.sh`. The
   code picks the base URL from `POLAR_ENV`.

## P3. Product with a custom (pay-what-you-want) price
Grip is an arbitrary per-order amount (board-top + 1 minor unit), so the product's
price must accept a custom amount.
1. **Products → New Product**. Name it (e.g. "Panjat — climb").
2. Set pricing to **"Pay what you want"** (custom amount). Set a sensible
   **minimum** (≈ the board's `minimum_naik` = $5.00 = `500`). A single product is
   enough — the exact amount is passed per checkout.
3. Copy the **product ID** → `POLAR_PRODUCT_ID`.

## P4. Webhook endpoint (this is `POLAR_WEBHOOK_SECRET`)
1. **Settings → Webhooks → Add Endpoint**.
2. URL: `https://<global-domain>/api/webhook/polar` (Format: **Raw / Standard
   Webhooks**).
3. Subscribe to at least **`order.paid`** (add `order.refunded` later if/when the
   refund→ledger path is wired).
4. Copy the endpoint's **signing secret** (`whsec_…`) → `POLAR_WEBHOOK_SECRET`.
   Our verifier follows the Standard Webhooks spec (HMAC-SHA256 over
   `id.timestamp.body`, base64).

## P5. Vercel env (Polar variant of Step 3)
Same as Step 3 but swap the payments block — set **no `PADDLE_*` and no
`MIDTRANS_*`**:
```bash
vercel env add PAYMENT_GATEWAY production      # "polar"
vercel env add POLAR_ACCESS_TOKEN production   # polar_oat_…  (from P2; server-only)
vercel env add POLAR_WEBHOOK_SECRET production # whsec_…      (from P4)
vercel env add POLAR_PRODUCT_ID production     # from P3
vercel env add POLAR_ENV production            # "sandbox" first, then "production"
```
`PAYMENT_GATEWAY` is read server-side only, so the non-public name is enough.
`NEXT_PUBLIC_BASE_URL` (Step 3) must be correct — it builds the `success_url` Polar
redirects to after payment (`/manjat/selesai?order=<id>`).

## P6. Prove it end-to-end (sandbox)
manjat → server creates a Polar checkout (`POST /v1/checkouts/` with our `order_id`
in `metadata` + custom `amount`) → browser redirects to Polar's hosted checkout →
pay with a **test card** → Polar posts `order.paid` to `/api/webhook/polar` →
signature verified → `bayar` appended to `pegangan_ledger` → `pegangan_cached`
re-derived → rank changes. Confirm a replayed webhook is idempotent (no double grip)
and a bad signature is rejected (401).

## Polar production go-live
Live and sandbox are separate Polar accounts with separate credentials.
- [ ] **Business / payout onboarding** complete in the live org (MoR payout runs via
      Stripe Connect — start early; can take days).
- [ ] **Live** organization access token (`polar_oat_…`, `checkouts:write`) captured
      → `POLAR_ACCESS_TOKEN`; set `POLAR_ENV=production`.
- [ ] **Live product** (pay-what-you-want) created → `POLAR_PRODUCT_ID`.
- [ ] **Live webhook** → `https://<domain>/api/webhook/polar`, `order.paid`
      subscribed; secret → `POLAR_WEBHOOK_SECRET`.
- [ ] **USD** enabled as the settlement currency; product tax category = digital
      goods (Polar as MoR computes VAT/sales tax).

## Code validation (do in sandbox first — these are the "validate before go-live"
notes in `src/lib/gateways/polar-gateway.ts`)
- [ ] **Webhook secret encoding** — a real Polar `order.paid` verifies with our
      base64/Standard-Webhooks HMAC. If Polar signs differently, either adjust
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

## Release gates (Polar variant)
- [ ] `NEXT_PUBLIC_MARKET=global` + `PAYMENT_GATEWAY=polar`; all `MIDTRANS_*` and
      `PADDLE_*` unset
- [ ] `POLAR_ACCESS_TOKEN` / `POLAR_WEBHOOK_SECRET` / `POLAR_PRODUCT_ID` set;
      `POLAR_ENV` correct for the workspace
- [ ] Sandbox end-to-end proven (P6) incl. idempotent replay + rejected bad signature
- [ ] Code-validation checklist above cleared against live Polar

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
