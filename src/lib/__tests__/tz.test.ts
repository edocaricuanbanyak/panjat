import { describe, expect, it } from "vitest";
import { zonedDate, zonedDayWindow, zonedHour } from "@/lib/tz";

// Default MARKET is Asia/Jakarta (UTC+7, no DST) — assert byte-identical to the
// previous hardcoded `T00:00:00+07:00` behavior.
describe("zonedDayWindow (default MARKET = Asia/Jakarta)", () => {
  it("maps a WIB day to the correct [start, end) UTC instants", () => {
    const { start, end } = zonedDayWindow("2026-08-27");
    expect(start.toISOString()).toBe("2026-08-26T17:00:00.000Z"); // 00:00 WIB
    expect(end.toISOString()).toBe("2026-08-27T17:00:00.000Z"); // next 00:00 WIB
  });

  it("zonedDate returns the WIB calendar date", () => {
    expect(zonedDate(new Date("2026-08-26T17:30:00Z"))).toBe("2026-08-27"); // 00:30 WIB
    expect(zonedHour(new Date("2026-08-27T02:00:00Z"))).toBe(9); // 09:00 WIB
  });
});

// Explicit-tz overrides prove the DST-safe path (America/New_York observes DST).
describe("zonedDayWindow with an explicit DST-observing timezone", () => {
  it("handles the US spring-forward day (23h) correctly", () => {
    // 2026-03-08: EST(-5) until 02:00 local, then EDT(-4).
    const { start, end } = zonedDayWindow("2026-03-08", "America/New_York");
    expect(start.toISOString()).toBe("2026-03-08T05:00:00.000Z"); // 00:00 EST
    expect(end.toISOString()).toBe("2026-03-09T04:00:00.000Z"); // 00:00 EDT
    expect(end.getTime() - start.getTime()).toBe(23 * 3600_000); // short day
  });

  it("handles the US fall-back day (25h) correctly", () => {
    // 2026-11-01: EDT(-4) until 02:00 local, then EST(-5).
    const { start, end } = zonedDayWindow("2026-11-01", "America/New_York");
    expect(start.toISOString()).toBe("2026-11-01T04:00:00.000Z"); // 00:00 EDT
    expect(end.toISOString()).toBe("2026-11-02T05:00:00.000Z"); // 00:00 EST
    expect(end.getTime() - start.getTime()).toBe(25 * 3600_000); // long day
  });
});
