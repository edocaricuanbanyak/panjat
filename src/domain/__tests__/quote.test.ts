import { describe, expect, it } from "vitest";
import { nominalForTarget } from "../manjat";

const board = [100_000, 70_000, 60_000, 40_000, 35_000]; // grips desc
const MIN = 5000;

describe("nominalForTarget", () => {
  it("prices #1 as one rupiah over the current summit", () => {
    expect(nominalForTarget("#1", board, MIN)).toBe(100_001);
  });

  it("prices top3 / top10 off the grip at that rank (Rp1 local increment)", () => {
    expect(nominalForTarget("top3", board, MIN)).toBe(60_001);
    // Fewer than 10 listings → grip at rank 10 is 0 → clamped to the minimum.
    expect(nominalForTarget("top10", board, MIN)).toBe(MIN);
  });

  it("clamps to the first-climb minimum on an empty board", () => {
    expect(nominalForTarget("#1", [], MIN)).toBe(MIN);
    expect(nominalForTarget("top3", [], MIN)).toBe(MIN);
  });
});
