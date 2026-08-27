import { describe, expect, it } from "vitest";
import { wibDate, wibDayWindow } from "../papan-hari-ini";

describe("wibDate / wibDayWindow", () => {
  it("computes the WIB calendar date", () => {
    expect(wibDate(new Date("2026-08-26T17:30:00Z"))).toBe("2026-08-27"); // 00:30 WIB
    expect(wibDate(new Date("2026-08-27T16:59:00Z"))).toBe("2026-08-27"); // 23:59 WIB
  });

  it("gives a 24h [start,end) window starting at 00:00 WIB = 17:00 UTC prev day", () => {
    const { start, end } = wibDayWindow("2026-08-27");
    expect(start.toISOString()).toBe("2026-08-26T17:00:00.000Z");
    expect(end.toISOString()).toBe("2026-08-27T17:00:00.000Z");
    expect(end.getTime() - start.getTime()).toBe(24 * 3600_000);
  });
});
