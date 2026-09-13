# Polar sandbox test checklist

Run this once the global board is deployed (Preview or a sandbox project) with
Polar **sandbox** credentials set. Goal: prove real money moves correctly end to
end before switching to production keys. Full setup is in `DEPLOY-GLOBAL.md`; this
is the run-it-and-tick-boxes list.

**How money activates (so you know what to watch):** grip is granted ONLY when
Polar POSTs a verified `order.paid` to `/api/webhook/polar`, the amount matches
the invoice, and `settle()` appends a `bayar` row. A checkout that never fires a
valid webhook = no grip (a functional failure, never a money leak).

**Where to look:**
- **Webhook result** — Polar dashboard → your endpoint → Deliveries (shows HTTP
  status + retries); or Vercel → the project → Logs, filter `/api/webhook/polar`.
  Our route returns: `200 {status:"settled"|"ignored"|"refunded"}`,
  `401 {reason:"bad_signature"}`, `404 {reason:"unknown_order"}`.
- **DB (global Postgres):**
  ```sql
  select status, pegangan_cached from listing where url_normal = '<your test url>';
  select jenis, nominal_signed, ref from pegangan_ledger where listing_id = '<id>' order by created_at;
  select order_id, status, nominal from transaksi where order_id = '<mnjt_...>';
  ```
- **Board** — the listing appears/moves on the homepage board after settle.

---

## A. Pre-flight (offline, before any real payment)
- [ ] **Secret rotated.** Regenerate the webhook signing secret in Polar (the one
      shared earlier is burned). Set the new `POLAR_WEBHOOK_SECRET`.
- [ ] **Round-trip with the real secret:**
      `POLAR_WEBHOOK_SECRET='whsec_…' pnpm db:seed && POLAR_WEBHOOK_SECRET='whsec_…' pnpm polar:sim`
      → **31 checks pass**. Confirms our SDK verify + settle + refund + reconcile
      work with your actual secret. (Then `pnpm db:seed` to clean.)
- [ ] **Env sanity:** `PAYMENT_GATEWAY` unset or `polar`; `NEXT_PUBLIC_MARKET=global`;
      `POLAR_ACCESS_TOKEN` (`polar_oat_…`), `POLAR_PRODUCT_ID`, `POLAR_WEBHOOK_SECRET`
      (`whsec_…`), `POLAR_ENV=sandbox`, `NEXT_PUBLIC_BASE_URL` all set; all `MIDTRANS_*`
      and `PADDLE_*` unset.
- [ ] **Webhook endpoint** in Polar points at `https://<deploy>/api/webhook/polar`,
      Format = Raw/Standard Webhooks, events `order.paid` + `order.refunded`.

## B. Checkout creation (the SEND side — unproven vs live API)
- [ ] Start a climb on the deployed board (paste a URL, set an amount, pay).
- [ ] Server creates a checkout without error → you are **redirected to Polar's
      hosted checkout** (sandbox). If it 500s: inspect the Vercel log for
      `Polar checkout error` — likely a field-name mismatch in
      `polarCheckoutClient.createTransaction` (`products`/`amount`/`metadata`/
      `success_url`/`customer_email`) or the product isn't "pay what you want".
- [ ] The checkout shows the **custom amount** you entered (grip = board-top + 1
      minor unit), not a fixed catalog price.

## C. Webhook + settle (the RECEIVE side — money-critical)
- [ ] Pay with a **Polar sandbox test card**. Browser returns to
      `/manjat/selesai?order=<id>`.
- [ ] Polar delivery for `order.paid` shows **HTTP 200** with `status:"settled"`.
      - **401 `bad_signature`** → secret mismatch (shouldn't happen now — we use
        Polar's own validator; re-check `POLAR_WEBHOOK_SECRET`).
      - **200 `ignored`** → the payload had no `metadata.order_id` → **metadata
        didn't propagate** to the order (validate item — see D-note).
      - **held / `perlu_review`** (transaksi status) → **amount mismatch**:
        `data.amount` ≠ the grip we charged. Likely Polar sent a **tax-inclusive**
        total; read the tax-exclusive field instead (see the note below).
- [ ] **DB:** `pegangan_ledger` has one `bayar` row (`ref` = your `mnjt_…`),
      `listing.pegangan_cached` = the grip, `transaksi.status = 'settlement'`,
      `listing.status = 'tayang'`.
- [ ] **Board:** the listing is on the money board at the expected rank.
- [ ] **Idempotent replay:** in Polar, "Resend" the same `order.paid` →
      **200 `ignored` (replay)**, grip **unchanged**, still one `bayar` row.

> **metadata / amount validate note.** Confirm on the real payload (Polar
> dashboard delivery body or the Vercel log): (1) `data.metadata.order_id` equals
> your `mnjt_…`; (2) the amount field we read (`data.amount`) equals the grip
> (tax-exclusive). If Polar's field names differ, adjust the extraction in
> `src/lib/gateways/polar-gateway.ts` (`verifyAndParse`).

## D. Refund (grip reversal)
- [ ] **Refund the order** in the Polar dashboard.
- [ ] `order.refunded` delivery → **200 `refunded`**.
- [ ] **DB:** a `refund` row (negative) in `pegangan_ledger`,
      `listing.pegangan_cached` reduced accordingly, `transaksi.status = 'refund'`.
- [ ] **Board:** the listing dropped (or fell off if grip → 0).
- [ ] **Idempotent:** resend `order.refunded` → **200 `ignored`**, grip unchanged.

## E. Security spot-checks
- [ ] **Forged webhook rejected:** `curl -X POST https://<deploy>/api/webhook/polar
      -H 'content-type: application/json' -d '{"type":"order.paid"}'` → **401**
      (no valid signature).
- [ ] **dev/settle disabled:** `curl -X POST https://<deploy>/api/dev/settle
      -d '{"order_id":"mnjt_x"}'` → **404** (a webhook secret is configured, so the
      dev shortcut is off — no free grip).
- [ ] **Integrity:** `pnpm db:reconcile` (against the global DB) → **0 mismatches**.

## F. Go-live gate (only after A–E pass in sandbox)
- [ ] Repeat B–D once against **Polar production** (separate account; business /
      payout onboarding done), `POLAR_ENV=production`, live token/product/webhook.
- [ ] One **real small live payment** (real card) → settle → refund it.
- [ ] Production webhook subscribed to `order.paid` + `order.refunded`.
- [ ] Release gates in `DEPLOY-GLOBAL.md` all ticked.
