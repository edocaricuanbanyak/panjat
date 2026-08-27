# Deploy (Vercel)

Panjat targets Vercel + a Postgres/Redis marketplace add-on. Notes for a
production deploy.

## Environment variables

Set every var from `.env.example` in the Vercel project (Production + Preview):

- `DATABASE_URL`, `REDIS_URL` — from the marketplace add-ons.
- `NEXT_PUBLIC_BASE_URL` — `https://panjat.id`.
- `MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`, `MIDTRANS_IS_PRODUCTION=false` (sandbox for F1), `MIDTRANS_MOCK=false`.
- Secrets: `KLIK_HASH_SECRET`, `SESSION_SECRET`, `NOTIF_SECRET`, `ANON_SECRET`, `CRON_SECRET`, `ADMIN_PASSWORD`, `ADMIN_SECRET`, `ADMIN_TOTP_SECRET` — generate fresh (`openssl rand -hex 32`).
- `ANTHROPIC_API_KEY` — layer-2 AI moderation (empty ⇒ fails safe to the manual queue).
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob, for screenshot storage (R21). Unset ⇒ local dir (dev only).

## Cron (Vercel Pro)

`vercel.json` declares the schedules (hourly rosot, nightly reconcile/lencana,
daily tebak, hourly moderasi + screenshot). Vercel Cron authenticates with
`CRON_SECRET` as a Bearer token — the routes fail closed without it. Hourly
crons require the **Pro** plan.

## Screenshots (R21) — headless Chromium

The screenshot worker needs a Chromium binary at build time:

```
# Vercel build command
pnpm exec playwright install chromium && pnpm build
```

Captures are transcoded to WebP (sharp) and stored in Vercel Blob when
`BLOB_READ_WRITE_TOKEN` is set. If the browser is missing or a capture fails, the
listing still goes live and the UI falls back to og:image/logo — never blocking.

## Database

Run migrations against the production DB before first traffic:

```
pnpm db:migrate   # applies drizzle/ incl. hand-authored triggers
pnpm db:seed      # optional: 35 sample listings for a non-empty launch board (R11)
```

## Payments

Point the Midtrans **Payment Notification URL** at
`https://panjat.id/api/webhook/midtrans`. Grip activates only from that verified,
idempotent webhook — never from the browser redirect.
