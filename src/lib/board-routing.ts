/**
 * Pure helper for sibling-board geo routing, shared by the edge middleware (which
 * cannot import `next/headers`). Kept dependency-free so it runs in the edge
 * runtime. Used only for routing between the IDR and USD boards — never money.
 */

/**
 * Match a visitor's ISO country against an `ALT_BOARD_COUNTRIES` rule.
 * `"ID"` (or `"ID,MY"`) → true when the country IS listed.
 * `"!ID"` → true when the country is NOT listed.
 * Empty/unknown country → false (never route on a guess).
 */
export function matchesShowFor(country: string, rule: string): boolean {
  if (!country) return false;
  const negate = rule.startsWith("!");
  const list = (negate ? rule.slice(1) : rule)
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  const inList = list.includes(country.toUpperCase());
  return negate ? !inList : inList;
}
