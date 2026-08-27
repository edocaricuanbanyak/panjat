import { describe, expect, it } from "vitest";
import { detectDrops, isNightWIB, type Ambang } from "../notifikasi";

const ambang: Ambang = { top1: 1, top3: 3, top10: 10 };
const map = (o: Record<string, number>) => new Map(Object.entries(o));

describe("detectDrops", () => {
  it("flags losing #1", () => {
    const d = detectDrops(map({ a: 1 }), map({ a: 2 }), ambang);
    expect(d).toEqual([{ listingId: "a", fromRank: 1, toRank: 2, thresholdLost: 1 }]);
  });

  it("flags dropping out of Top 3 and Top 10", () => {
    expect(detectDrops(map({ a: 3 }), map({ a: 4 }), ambang)[0].thresholdLost).toBe(3);
    expect(detectDrops(map({ a: 10 }), map({ a: 11 }), ambang)[0].thresholdLost).toBe(10);
  });

  it("reports the most severe threshold when several are crossed", () => {
    // #1 → #15 crosses top1, top3, top10 — headline the most prestigious lost.
    expect(detectDrops(map({ a: 1 }), map({ a: 15 }), ambang)[0].thresholdLost).toBe(1);
  });

  it("ignores rank improvements, same rank, and non-crossing moves", () => {
    expect(detectDrops(map({ a: 5 }), map({ a: 2 }), ambang)).toEqual([]); // improved
    expect(detectDrops(map({ a: 4 }), map({ a: 4 }), ambang)).toEqual([]); // same
    expect(detectDrops(map({ a: 4 }), map({ a: 6 }), ambang)).toEqual([]); // 4→6, no threshold
    expect(detectDrops(map({ a: 12 }), map({ a: 20 }), ambang)).toEqual([]); // already out
  });

  it("ignores listings no longer on the board", () => {
    expect(detectDrops(map({ a: 1 }), map({ b: 1 }), ambang)).toEqual([]);
  });
});

describe("isNightWIB", () => {
  // WIB = UTC+7. Night pause is 22:00–07:00 WIB.
  it("is night at 22:00–06:59 WIB", () => {
    expect(isNightWIB(new Date("2026-08-27T15:30:00Z"))).toBe(true); // 22:30 WIB
    expect(isNightWIB(new Date("2026-08-27T22:00:00Z"))).toBe(true); // 05:00 WIB
    expect(isNightWIB(new Date("2026-08-26T23:30:00Z"))).toBe(true); // 06:30 WIB
  });
  it("is day at 07:00–21:59 WIB", () => {
    expect(isNightWIB(new Date("2026-08-27T00:00:00Z"))).toBe(false); // 07:00 WIB
    expect(isNightWIB(new Date("2026-08-27T05:00:00Z"))).toBe(false); // 12:00 WIB
    expect(isNightWIB(new Date("2026-08-27T14:59:00Z"))).toBe(false); // 21:59 WIB
  });
});
