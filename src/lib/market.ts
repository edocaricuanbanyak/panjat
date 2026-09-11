/**
 * Per-deployment market configuration — the single source of truth for
 * currency, locale, timezone, weekly-reset anchor, default UI language, and the
 * payment gateway. Resolved ONCE from the environment at module load.
 *
 * Every field DEFAULTS to today's hardcoded Indonesian value, so a deployment
 * with none of these env vars set (panjat.id) behaves byte-for-byte as before.
 * A global deployment sets `MARKET=global` (or the granular vars) to flip to
 * USD / English / Paddle without any code change.
 *
 * Never read these env vars at a callsite — import `MARKET` and thread it, so
 * the defaulting logic lives in exactly one place.
 */

export interface MarketConfig {
  /** ISO 4217 currency code, e.g. "IDR" | "USD". */
  currency: string;
  /** Minor-unit decimal places: IDR=0, USD=2. All money is integer minor units. */
  currencyDecimals: number;
  /** Intl locale for number/currency/date formatting, e.g. "id-ID" | "en-US". */
  locale: string;
  /** IANA timezone for day/week windows and display, e.g. "Asia/Jakarta". */
  timeZone: string;
  /**
   * Epoch ms of any reference instant that falls on the desired weekly-reset
   * weekday+time in `timeZone`. Weekly bucketing is anchor-relative, so any
   * such instant works. Default: a Wednesday 17:00 WIB (matches favorit.ts).
   */
  weekAnchorMs: number;
  /** Default UI language for this deployment. */
  defaultLocale: "id" | "en";
  /** Which payment gateway grants grip on this deployment. */
  paymentGateway: "midtrans" | "paddle" | "polar";
}

/** Today's Indonesian defaults — the exact values previously hardcoded. */
const ID_DEFAULTS: MarketConfig = {
  currency: "IDR",
  currencyDecimals: 0,
  locale: "id-ID",
  timeZone: "Asia/Jakarta",
  weekAnchorMs: Date.UTC(1970, 0, 7, 10, 0, 0), // a Wednesday 17:00 WIB
  defaultLocale: "id",
  paymentGateway: "midtrans",
};

/** Preset for the English/USD global board. Granular env vars still override. */
const GLOBAL_DEFAULTS: MarketConfig = {
  currency: "USD",
  currencyDecimals: 2,
  locale: "en-US",
  timeZone: "UTC",
  weekAnchorMs: Date.UTC(1970, 0, 4, 0, 0, 0), // a Sunday 00:00 UTC
  defaultLocale: "en",
  paymentGateway: "paddle",
};

/** Minor-unit decimals per known currency; falls back to 2 for unknowns. */
function decimalsFor(currency: string): number {
  const zero = new Set(["IDR", "JPY", "KRW", "VND"]);
  return zero.has(currency) ? 0 : 2;
}

// Config must be readable in the BROWSER too (client components format money,
// pick copy, show times). Next only inlines statically-accessed NEXT_PUBLIC_*
// vars into the client bundle, so those are primary; the non-public names are a
// fallback for server-only CLI (seed/migrate/jobs run with e.g. MARKET=global).
// Each access is a static member expression so Next's inliner can replace it.
const MARKET_ENV = process.env.NEXT_PUBLIC_MARKET ?? process.env.MARKET;
const CURRENCY_ENV = process.env.NEXT_PUBLIC_CURRENCY ?? process.env.CURRENCY;
const LOCALE_ENV = process.env.NEXT_PUBLIC_LOCALE ?? process.env.LOCALE;
const TZ_ENV = process.env.NEXT_PUBLIC_TZ_OVERRIDE ?? process.env.TZ_OVERRIDE;
const DEFAULT_LOCALE_ENV =
  process.env.NEXT_PUBLIC_DEFAULT_LOCALE ?? process.env.DEFAULT_LOCALE;
const WEEK_ANCHOR_ENV =
  process.env.NEXT_PUBLIC_WEEK_ANCHOR_MS ?? process.env.WEEK_ANCHOR_MS;
// Gateway selection is server-only, but reading the public name too is harmless.
const GATEWAY_ENV =
  process.env.NEXT_PUBLIC_PAYMENT_GATEWAY ?? process.env.PAYMENT_GATEWAY;

function resolveFromEnv(): MarketConfig {
  const base = MARKET_ENV === "global" ? GLOBAL_DEFAULTS : ID_DEFAULTS;

  const currency = CURRENCY_ENV?.trim() || base.currency;
  const defaultLocale = (DEFAULT_LOCALE_ENV?.trim() as "id" | "en") || base.defaultLocale;
  const paymentGateway =
    (GATEWAY_ENV?.trim() as MarketConfig["paymentGateway"]) || base.paymentGateway;

  return {
    currency,
    currencyDecimals: CURRENCY_ENV ? decimalsFor(currency) : base.currencyDecimals,
    locale: LOCALE_ENV?.trim() || base.locale,
    timeZone: TZ_ENV?.trim() || base.timeZone,
    weekAnchorMs: WEEK_ANCHOR_ENV ? Number(WEEK_ANCHOR_ENV) : base.weekAnchorMs,
    defaultLocale: defaultLocale === "en" ? "en" : "id",
    paymentGateway:
      paymentGateway === "paddle" || paymentGateway === "polar" ? paymentGateway : "midtrans",
  };
}

export const MARKET: MarketConfig = resolveFromEnv();
