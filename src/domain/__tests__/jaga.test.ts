import { describe, expect, it } from "vitest";
import { topUpAmount } from "../jaga";

describe("topUpAmount (Jaga Posisi decision, §13.1)", () => {
  const MIN = 1000;

  it("is 0 when already at or above target grip", () => {
    expect(topUpAmount(50_000, 40_000, 1_000_000, MIN)).toBe(0);
    expect(topUpAmount(40_000, 40_000, 1_000_000, MIN)).toBe(0);
  });

  it("tops up exactly the shortfall when it exceeds the minimum", () => {
    expect(topUpAmount(30_000, 45_000, 1_000_000, MIN)).toBe(15_000);
  });

  it("raises a tiny shortfall up to the minimum top-up", () => {
    expect(topUpAmount(44_500, 45_000, 1_000_000, MIN)).toBe(1_000);
  });

  it("returns 0 when the budget can't cover the needed amount", () => {
    expect(topUpAmount(30_000, 45_000, 10_000, MIN)).toBe(0);
  });

  it("returns 0 when the budget can't even cover the minimum", () => {
    expect(topUpAmount(44_900, 45_000, 500, MIN)).toBe(0);
  });

  it("charges exactly up to the remaining budget when it just covers the shortfall", () => {
    expect(topUpAmount(30_000, 45_000, 15_000, MIN)).toBe(15_000);
  });
});
