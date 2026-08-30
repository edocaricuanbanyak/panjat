import { describe, expect, it } from "vitest";
import type { RosotConfig } from "../rosot";
import {
  dailyRateForRank,
  decayGripOneHour,
  estimateDaysToThreshold,
  hourlyFactor,
  listingFloor,
} from "../rosot";

// Mirrors the seeded §6.6 config.
const cfg: RosotConfig = {
  lajuRosot: { r1: 0.25, r2_3: 0.18, r4_10: 0.12, r11_30: 0.07, r31plus: 0.03 },
  ambang: { top1: 1, top3: 3, top10: 10, top30: 30 },
  kakiTiang: 1000,
  lantaiRasio: 0.1,
  lantaiMaks: 10000,
};

describe("dailyRateForRank", () => {
  it("maps each position tier to its daily rate", () => {
    expect(dailyRateForRank(1, 100_000, cfg)).toBe(0.25);
    expect(dailyRateForRank(2, 100_000, cfg)).toBe(0.18);
    expect(dailyRateForRank(3, 100_000, cfg)).toBe(0.18);
    expect(dailyRateForRank(4, 100_000, cfg)).toBe(0.12);
    expect(dailyRateForRank(10, 100_000, cfg)).toBe(0.12);
    expect(dailyRateForRank(11, 100_000, cfg)).toBe(0.07);
    expect(dailyRateForRank(30, 100_000, cfg)).toBe(0.07);
    expect(dailyRateForRank(31, 100_000, cfg)).toBe(0.03);
    expect(dailyRateForRank(999, 100_000, cfg)).toBe(0.03);
  });

  it("never decays grip at or below the Kaki Tiang floor, regardless of rank", () => {
    expect(dailyRateForRank(1, 1000, cfg)).toBe(0);
    expect(dailyRateForRank(1, 999, cfg)).toBe(0);
    expect(dailyRateForRank(5, 500, cfg)).toBe(0);
  });

  it("honors a per-listing protected floor (stops decay at that floor)", () => {
    // A listing whose protected floor is Rp10.000 doesn't decay once at/below it.
    expect(dailyRateForRank(1, 10_000, cfg, 10_000)).toBe(0);
    expect(dailyRateForRank(1, 9_999, cfg, 10_000)).toBe(0);
    // Above the floor it still decays at the tier rate.
    expect(dailyRateForRank(1, 10_001, cfg, 10_000)).toBe(0.25);
  });
});

describe("listingFloor", () => {
  it("protects a fraction of total paid, capped, never below Kaki Tiang", () => {
    expect(listingFloor(0, cfg)).toBe(1000); // free/unpaid → absolute floor
    expect(listingFloor(6_000, cfg)).toBe(1000); // 10% = 600 → below Kaki Tiang → 1000
    expect(listingFloor(50_000, cfg)).toBe(5_000); // 10% = 5.000
    expect(listingFloor(100_000, cfg)).toBe(10_000); // 10% = 10.000 (at cap)
    expect(listingFloor(1_000_000, cfg)).toBe(10_000); // capped — whale can't lock the summit
  });
});

describe("hourlyFactor", () => {
  it("compounds over 24 hours to the daily factor (1 - rate)", () => {
    for (const rate of [0.25, 0.18, 0.12, 0.07, 0.03]) {
      expect(hourlyFactor(rate) ** 24).toBeCloseTo(1 - rate, 10);
    }
  });
});

describe("decayGripOneHour", () => {
  it("decays #1 grip 100000 @25%/day to 98808 after one hour", () => {
    expect(decayGripOneHour(100_000, 0.25, 1000)).toBe(98_808);
  });

  it("is monotonic non-increasing and clamps at the floor", () => {
    let grip = 100_000;
    for (let h = 0; h < 24; h++) {
      const next = decayGripOneHour(grip, 0.25, 1000);
      expect(next).toBeLessThanOrEqual(grip);
      grip = next;
    }
    // After 24h at 25%/day, grip lands near 75000.
    expect(grip).toBeGreaterThan(74_000);
    expect(grip).toBeLessThan(76_000);
  });

  it("leaves grip unchanged when the rate is 0", () => {
    expect(decayGripOneHour(1000, 0, 1000)).toBe(1000);
    expect(decayGripOneHour(50_000, 0, 1000)).toBe(50_000);
  });

  it("never drops below the floor", () => {
    expect(decayGripOneHour(1001, 0.25, 1000)).toBe(1000);
    expect(decayGripOneHour(1200, 0.25, 1000)).toBeGreaterThanOrEqual(1000);
  });
});

describe("estimateDaysToThreshold", () => {
  it("estimates whole days of self-decay down to a threshold", () => {
    // 100000 @25%/day falling to 70000: 0.75^d = 0.7 → d ≈ 1.24 → 1
    expect(estimateDaysToThreshold(100_000, 0.25, 70_000)).toBe(1);
    // 100000 @12%/day to 50000: 0.88^d = 0.5 → d ≈ 5.4 → 5
    expect(estimateDaysToThreshold(100_000, 0.12, 50_000)).toBe(5);
  });

  it("returns Infinity when the grip never decays, 0 when already below", () => {
    expect(estimateDaysToThreshold(1000, 0, 500)).toBe(Infinity);
    expect(estimateDaysToThreshold(40_000, 0.12, 50_000)).toBe(0);
  });
});
