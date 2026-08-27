/**
 * Single rupiah formatter and single WIB time formatter (R13). Everything that
 * shows money or time goes through here — no ad-hoc formatting in components.
 * Money is integer rupiah; timestamps are stored UTC, displayed WIB (§17.2).
 */

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

/** 30000 -> "Rp30.000" (no space between the symbol and the number). */
export function formatRupiah(amount: number): string {
  // Intl (id-ID) yields "Rp 100.000"; strip the space after the symbol.
  return rupiah.format(amount).replace(/^(Rp)\s*/u, "$1");
}

const wibDateTime = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  dateStyle: "medium",
  timeStyle: "short",
});

const wibTime = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  timeStyle: "short",
});

/** UTC instant -> "27 Agu 2026, 09.00" (WIB). */
export function formatWIB(instant: Date): string {
  return wibDateTime.format(instant);
}

/** UTC instant -> "09.00" (WIB). */
export function formatWIBTime(instant: Date): string {
  return wibTime.format(instant);
}
