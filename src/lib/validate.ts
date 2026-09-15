/**
 * Lightweight client-side field checks — for surfacing an inline error before a
 * round-trip, never as the security boundary (the API re-validates every field).
 * Deliberately lenient: catch obvious typos ("kamu@", "no-at-sign"), not police
 * every RFC edge case.
 */
export function isEmailish(value: string): boolean {
  const v = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
