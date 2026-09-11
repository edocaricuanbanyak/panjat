import { headers } from "next/headers";
import { MARKET, type MarketConfig } from "./market";

/**
 * Visitor geolocation, used only for the sibling-board suggestion banner — never
 * for money, ranking, or gating. Vercel injects the ISO-3166-1 alpha-2 country
 * on every request as `x-vercel-ip-country`; `GEO_COUNTRY_OVERRIDE` forces a
 * value for local dev (no edge geo off Vercel).
 */
export async function visitorCountry(): Promise<string | null> {
  const override = process.env.GEO_COUNTRY_OVERRIDE?.trim();
  if (override) return override.toUpperCase();
  const c = (await headers()).get("x-vercel-ip-country");
  return c ? c.toUpperCase() : null;
}

/** `"ID"` → true when country is ID; `"!ID,MY"` → true when country is NOT listed. */
function matchesShowFor(country: string, rule: string): boolean {
  const negate = rule.startsWith("!");
  const list = (negate ? rule.slice(1) : rule)
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  const inList = list.includes(country);
  return negate ? !inList : inList;
}

/**
 * The sibling-board suggestion to show this visitor, or null when the feature is
 * off (no `MARKET.altBoard`), the country is unknown, or the rule doesn't match.
 */
export function altBoardSuggestion(
  country: string | null,
): NonNullable<MarketConfig["altBoard"]> | null {
  const alt = MARKET.altBoard;
  if (!alt || !country) return null;
  return matchesShowFor(country, alt.showFor) ? alt : null;
}
