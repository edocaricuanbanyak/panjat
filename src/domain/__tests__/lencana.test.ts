import { describe, expect, it } from "vitest";
import { bangkitKakiTiang, comeback, everRank1, held7dTop3, type Snap } from "../lencana";

const HOUR = 3600_000;
const base = Date.parse("2026-08-01T00:00:00Z");
/** Build an hourly series from [rank, pegangan] pairs. */
const series = (pairs: [number, number][], stepH = 1): Snap[] =>
  pairs.map(([rank, pegangan], i) => ({ jam: new Date(base + i * stepH * HOUR), rank, pegangan }));

describe("everRank1", () => {
  it("true iff any snapshot was #1", () => {
    expect(everRank1(series([[5, 100], [1, 200]]))).toBe(true);
    expect(everRank1(series([[2, 100], [3, 90]]))).toBe(false);
  });
});

describe("held7dTop3", () => {
  it("true for a 7-day consecutive Top-3 run", () => {
    const s = Array.from({ length: 24 * 7 + 1 }, (_, i) => ({
      jam: new Date(base + i * HOUR),
      rank: 2,
      pegangan: 1000,
    }));
    expect(held7dTop3(s)).toBe(true);
  });
  it("false when the run is broken before 7 days", () => {
    const s: Snap[] = [];
    for (let i = 0; i < 24 * 7 + 1; i++) {
      s.push({ jam: new Date(base + i * HOUR), rank: i === 100 ? 5 : 2, pegangan: 1000 });
    }
    expect(held7dTop3(s)).toBe(false);
  });
  it("false for under 7 days", () => {
    const s = Array.from({ length: 24 * 6 }, (_, i) => ({ jam: new Date(base + i * HOUR), rank: 1, pegangan: 1 }));
    expect(held7dTop3(s)).toBe(false);
  });
});

describe("comeback", () => {
  it("true when out of Top 10 then later #1", () => {
    expect(comeback(series([[15, 100], [4, 200], [1, 300]]))).toBe(true);
  });
  it("false when #1 came before falling out", () => {
    expect(comeback(series([[1, 300], [15, 50]]))).toBe(false);
  });
});

describe("bangkitKakiTiang", () => {
  it("true when grip hit the floor then climbed back to Top 10", () => {
    expect(bangkitKakiTiang(series([[40, 1000], [8, 30000]]), 1000)).toBe(true);
  });
  it("false when floored but never returned to Top 10", () => {
    expect(bangkitKakiTiang(series([[40, 1000], [20, 3000]]), 1000)).toBe(false);
  });
});
