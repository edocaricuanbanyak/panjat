/**
 * Timezone helpers bound to the deployment's market timezone (MARKET.timeZone).
 * Day/week windows are computed in local time then expressed as UTC instants.
 *
 * DST-safe: unlike the previous `T00:00:00+07:00` string construction (which
 * assumed a fixed offset), `zonedDayWindow` derives the true UTC instant of
 * local midnight for the target date, so it is correct in DST-observing zones
 * too. On Asia/Jakarta (no DST, +07:00) the results are byte-identical to before.
 */
import { MARKET } from "./market";

/** Offset (localTime − UTC) in ms for `instant` in `tz`. */
function offsetMs(instant: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p = Object.fromEntries(dtf.formatToParts(instant).map((x) => [x.type, x.value]));
  const asUTC = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour),
    Number(p.minute),
    Number(p.second),
  );
  return asUTC - instant.getTime();
}

/** UTC instant of local midnight for `dateStr` (YYYY-MM-DD) in `tz` (DST-safe). */
function zonedMidnight(dateStr: string, tz: string): Date {
  const guess = Date.parse(`${dateStr}T00:00:00Z`);
  const off = offsetMs(new Date(guess), tz);
  let t = guess - off;
  // Re-check across a DST boundary: the offset at the corrected instant may differ.
  const off2 = offsetMs(new Date(t), tz);
  if (off2 !== off) t = guess - off2;
  return new Date(t);
}

/** The day after `dateStr` (YYYY-MM-DD), calendar-correct. */
function nextDateStr(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Calendar date "YYYY-MM-DD" for an instant, in the market timezone. */
export function zonedDate(now: Date, tz: string = MARKET.timeZone): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(now);
}

/** The [start, end) UTC instants of a market-timezone calendar day (DST-safe). */
export function zonedDayWindow(
  dateStr: string,
  tz: string = MARKET.timeZone,
): { start: Date; end: Date } {
  return { start: zonedMidnight(dateStr, tz), end: zonedMidnight(nextDateStr(dateStr), tz) };
}

/** Hour-of-day (0–23) for an instant, in the market timezone. */
export function zonedHour(now: Date, tz: string = MARKET.timeZone): number {
  return Number(
    new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", hour: "2-digit" }).format(
      now,
    ),
  );
}
