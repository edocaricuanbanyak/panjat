@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> Next.js here is v16 (App Router) — newer than most training data. See `AGENTS.md` (imported above) and the guides under `node_modules/next/dist/docs/` before writing Next-specific code.

## Getting started (local dev)

```bash
docker compose up -d      # Postgres :5432 + Redis :6379 (compose plugin required — see below)
cp .env.example .env.local  # then adjust if needed
pnpm install
pnpm db:migrate           # apply Drizzle migrations incl. hand-authored triggers
pnpm db:seed              # 15 sample listings + categories + config tunables
pnpm dev                  # Next dev server
```

Package manager is **pnpm** (installed to `~/.npm-global`; if `pnpm` is missing, `npm i -g pnpm`). Docker runtime here is **colima** (`colima start`), not Docker Desktop; the `docker compose` plugin lives at `~/.docker/cli-plugins/docker-compose`.

Other scripts: `pnpm build` / `pnpm start` / `pnpm lint`; `pnpm db:generate` (regenerate migration SQL from `src/db/schema.ts`).

## Current state

Early foundation. Implemented so far: Next.js scaffold, `docker-compose.yml` (Postgres + Redis), the full §17.2 Drizzle schema with DB-level state-machine + append-only triggers, and a 15-listing seed. **No product UI yet** — the default Next landing page is untouched. `docs/PRD-Panjat.md` (v1.3, Indonesian) is the source of truth; follow its decisions rather than re-deciding them. Sections are cited below as `§n` / requirements as `Rn`.

## What Panjat is

A paid public leaderboard ("papan") for Indonesian indie makers/UMKM. You pay to climb a pole; the amount you paid **is** your grip ("pegangan") and sets your rank. The pole is slippery — everyone decays ("rosot") over time, faster near the top, so the summit is always affordable (~Rp95k) and always contestable. This decay mechanic is the entire product thesis (§1, §5, §6). Comparators: pamerin.lol, pake.ai.

Planned stack (decided in the PRD): **Next.js on Vercel** (SSR for SEO — R20-d), **Postgres** (first-party system of record) via **Drizzle**, **Redis**, **Midtrans Snap** (payments), **PostHog** (product analytics), **Tailwind with CSS-variable design tokens over Radix/shadcn primitives** (§9.5), a **Playwright headless-browser worker** for listing screenshots (R21), and **Claude Haiku / Fable** for moderation & copy suggestions (Prinsip Penggunaan AI).

## Non-negotiable product contracts

These are invariants ("kontrak produk"), not preferences. The PRD marks them non-negotiable because breaking one silently destroys a differentiator. Enforce them in code and reviews.

- **Ranking = grip, nothing else.** Order is strictly by `pegangan` descending — "tidak ada algoritma tersembunyi" (§5). Ties: whoever reached the amount first.
- **AI must never touch money-critical paths.** No AI in ranking, `pegangan`, pricing, click counts, or CPC; these must be deterministic and auditable. AI is allowed only for moderation classification (R8) and description/category *suggestions* (R18), always with a human final decision and a deterministic fallback (Prinsip Penggunaan AI, §18.5).
- **Grip is a ledger, not a mutable number.** `pegangan = Σbayar − Σrosot − Σrefund ± koreksi`, reconstructable from the append-only `pegangan_ledger`. `listing.pegangan_cached` is a sort cache only; a nightly job must verify cache vs ledger and alarm on drift (§17.2). The `pegangan_ledger` and `klik` tables are enforced append-only by DB triggers — never UPDATE/DELETE them.
- **Rosot is server-side and hourly.** Clients never compute rank. Decay rate is chosen by *current position* each hour, per the tier table (§6.1). Grip floors at Rp1.000 ("Kaki Tiang") and listings are never deleted for decaying.
- **Money enters only via verified signed webhook.** Grip activates *only* from a Midtrans webhook with a verified `signature_key`, idempotent per `order_id`, never from a browser redirect. Webhook amount must match invoice amount. Process webhooks **serial per board** (advisory lock/single queue) so tie-ordering is decided by commit order (R2, §17.2, §18.3).
- **Clicks are counted at the server redirect** `/k/{listing}` (adblock-proof, auditable). Dedup per IP+UA per 6h. IPs are **never stored raw** — hashed with a daily-rotating salt (UU PDP compliance) (R10, §17.1).
- **Anonymous gamification never touches money, paid ranking, or clicks.** It may only affect Kaki-Tiang ordering, cosmetics, and visit ritual. Never reward clicks to sponsor listings (would fake CPC and kill differentiator D2). Anon identity is a server-signed `httpOnly` cookie, never `localStorage` (§7.5.2–3, R14).
- **Jelajah (discovery) and the board are strictly separated.** Board is ordered by money; Jelajah/search by relevance and explicit visitor-chosen sort. No money buys Jelajah position; no relevance moves the board (R22).
- **Third-party content is untrusted.** Listing name/description render as plain text only — no HTML/markdown. Strict CSP, sanitized/rasterized SVG logos, http/https URLs only. Scraped page content must not influence AI classification (prompt-injection) (§18.1, R8).
- **SSRF guarding on any URL fetch.** `/api/preview` and the screenshot worker resolve DNS then reject private/link-local/metadata IPs (`169.254.169.254`), cap response size, reject internal redirects; the screenshot worker additionally runs sandboxed because it executes target-page JS (R2, R21, §18.4).
- **Design tokens are the only source of truth.** No raw hex/px/durations in feature code (lint should reject). The flag color `merah` (`#C93A2E`) appears *only* in the summit zone (#1–3) and primary actions — anywhere else is a bug (§9.5, §9.6.2).
- **Time & money formatting:** store all timestamps in UTC (`timestamptz`), display WIB. Money is integer rupiah (`BIGINT`) — no floats. Exactly one rupiah formatter and one WIB time formatter across the app (§17.2, R13).

## Data model (Postgres via Drizzle, first-party)

Schema lives in `src/db/schema.ts`; the DB client in `src/db/index.ts`; hand-authored triggers/constraints in the SQL migration under `drizzle/` (state-machine on `listing`, append-only on `pegangan_ledger`/`klik`). Full 13-table schema and the listing **state machine** are in §17.2 — read it before touching persistence. Key tables: `listing`, `sponsor_kontak`, `kategori`, `pegangan_ledger` (append-only), `transaksi` (financial truth), `klik` (append-only, hashed IP) + `klik_harian` rollup, `posisi_snapshot` (feeds 7-day chart and is the *only* source for badges/lencana R17), `moderasi_log`, `notifikasi_log`, `konfigurasi` (the §6.6 tunable params — never hard-code them), and anon tables `pengunjung_anon` / `tebakan` / `sorak` / `lencana`.

Valid `listing.status` transitions (enforced by DB trigger): `draft→menunggu_bayar`; `menunggu_bayar→tayang|kedaluwarsa`; `tayang→ditahan|diturunkan`; `ditahan→tayang|ditolak`. Anything else raises.

Scale guidance (§17.3): stay on Postgres. **No ClickHouse/Timescale/Elasticsearch/Algolia** on the roadmap — Postgres full-text search is the plan (R22); partition `klik` monthly before reaching for a new engine.

## Domain vocabulary (Indonesian — used verbatim in code, schema, and copy)

The product's identity is the panjat-pinang (greased-pole) metaphor; the vocabulary is fixed (§10.1) and appears directly in table/column names. Do not translate or substitute:

`pegangan` = grip / rank value · `manjat` / `naik tiang` = buy in · `manjat lagi` = top up · `salip` / `disalip` = overtake / overtaken · `rosot` / `melorot` = decay/slide down · `puncak` = #1 · `tiang` = the pole · `Kaki Tiang` = free Rp0 tier at the bottom · `Papan` = the leaderboard · `Papan Hari Ini` = 24h board (resets 00:00 WIB) · `Sorak` = visitor upvote (free tier only) · `Arsip Juara` = champions archive · `kertas`/`tinta`/`licin`/`merah` = design tokens.

Copy tone is tiered (§10.2): marketing surfaces may be playful; **money surfaces (payment, amounts, rules, dashboard, errors) must be plain and literal.** The retired "api/bara" (fire) vocabulary must never reappear. All UI/error/notification text lives in one central copy deck, not inline in components (R20-c).

## Build phases

`F0` validation (interviews, register panjat.id/PDKI, Midtrans sandbox) → **`F1` live board** = tokens+components first, then R1, R2, R8, R9, R11, R12, R19-P0 (§18), R20 a–c/e–f → `F2` retention engine (R3–R7, R21) → `F3` spectator loop (R14–R17, R22) → `F4` calibration. See §14. F1 security P0 items (§18) are release gates equal to functional requirements. Target: ship F1 in ≤4 weeks — the category is easily copied, so release speed beats feature completeness (§1.5, §14).
