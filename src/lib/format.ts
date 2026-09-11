/**
 * Single money formatter and single date/time formatter (R13). Everything that
 * shows money or time goes through here — no ad-hoc formatting in components.
 * Money is integer minor units of the deployment currency (IDR=rupiah, USD=cents);
 * timestamps are stored UTC, displayed in the market timezone (§17.2).
 *
 * Currency, locale, and timezone come from `MARKET` (src/lib/market.ts). On the
 * default (Indonesian) deployment this yields exactly the previous output:
 * `formatRupiah(30000) === "Rp30.000"`, WIB times, etc.
 */
import { MARKET } from "./market";

const money = new Intl.NumberFormat(MARKET.locale, {
  style: "currency",
  currency: MARKET.currency,
  minimumFractionDigits: MARKET.currencyDecimals,
  maximumFractionDigits: MARKET.currencyDecimals,
});

const MINOR_SCALE = 10 ** MARKET.currencyDecimals;

/**
 * Integer minor units -> localized currency string.
 * IDR: 30000 -> "Rp30.000" (space after the symbol stripped, as before).
 * USD: 500 -> "$5.00".
 */
export function formatMoney(amountMinor: number): string {
  const formatted = money.format(amountMinor / MINOR_SCALE);
  // Intl (id-ID) yields "Rp 100.000"; strip the space after the "Rp" symbol to
  // preserve the established Indonesian rendering. Other currencies unchanged.
  return MARKET.currency === "IDR"
    ? formatted.replace(/^(Rp)\s*/u, "$1")
    : formatted;
}

/**
 * Backwards-compatible alias. On the IDR deployment this is identical to the
 * old `formatRupiah`; kept so existing callsites need no change.
 */
export const formatRupiah = formatMoney;

const counts = new Intl.NumberFormat(MARKET.locale);

/** Integer count with locale grouping, e.g. 12345 -> "12.345" (id) / "12,345" (en). */
export function formatCount(n: number): string {
  return counts.format(n);
}

/** The currency symbol for this market, e.g. "Rp" / "$". */
export const moneySymbol =
  money.formatToParts(0).find((p) => p.type === "currency")?.value ?? "";

/**
 * Format a raw digit string (minor units) for a money input field.
 * IDR (0 decimals): "5000" -> "5.000" (grouping only — unchanged behavior).
 * USD (2 decimals): digits fill from the right past the decimal —
 * "5" -> "0.05", "500" -> "5.00", "2500" -> "25.00". A natural cents-entry UX.
 * Empty in -> empty out (lets the placeholder show).
 */
export function formatMoneyInput(digits: string): string {
  if (!digits) return "";
  const n = Number(digits);
  if (!Number.isFinite(n)) return "";
  if (MARKET.currencyDecimals === 0) return formatCount(n);
  const scale = MINOR_SCALE;
  const major = Math.floor(n / scale);
  const minor = String(n % scale).padStart(MARKET.currencyDecimals, "0");
  return `${formatCount(major)}.${minor}`;
}

const dateTimeFmt = new Intl.DateTimeFormat(MARKET.locale, {
  timeZone: MARKET.timeZone,
  dateStyle: "medium",
  timeStyle: "short",
});

const timeFmt = new Intl.DateTimeFormat(MARKET.locale, {
  timeZone: MARKET.timeZone,
  timeStyle: "short",
});

/** UTC instant -> localized date+time in the market timezone (WIB by default). */
export function formatWIB(instant: Date): string {
  return dateTimeFmt.format(instant);
}

/** UTC instant -> localized time in the market timezone (WIB by default). */
export function formatWIBTime(instant: Date): string {
  return timeFmt.format(instant);
}
