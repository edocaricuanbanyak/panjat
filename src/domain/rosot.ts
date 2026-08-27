/**
 * Rosot — the slippery pole (§6.1). Grip decays hourly, faster near the top.
 * Pure functions here are DB-free and unit-tested; the orchestrator lives in
 * rosot-run.ts.
 */

/** Config sourced from the `konfigurasi` table (§6.6) — never hard-coded. */
export interface RosotConfig {
  /** Daily decay rate per position tier (fractions, e.g. 0.25 = 25%/day). */
  lajuRosot: {
    r1: number;
    r2_3: number;
    r4_10: number;
    r11_30: number;
    r31plus: number;
  };
  /** Upper rank bound of each tier. */
  ambang: { top1: number; top3: number; top10: number; top30: number };
  /** Grip floor (Kaki Tiang); at or below this, decay rate is 0. */
  kakiTiang: number;
}

/**
 * Daily decay rate for a listing at a given rank and grip.
 * Grip at/below the floor never decays (§6.1: "Pegangan ≤ Rp1.000 → 0%").
 */
export function dailyRateForRank(rank: number, grip: number, cfg: RosotConfig): number {
  if (grip <= cfg.kakiTiang) return 0;
  const { ambang, lajuRosot } = cfg;
  if (rank <= ambang.top1) return lajuRosot.r1;
  if (rank <= ambang.top3) return lajuRosot.r2_3;
  if (rank <= ambang.top10) return lajuRosot.r4_10;
  if (rank <= ambang.top30) return lajuRosot.r11_30;
  return lajuRosot.r31plus;
}

/**
 * Per-hour multiplicative factor whose 24-fold product equals (1 − dailyRate).
 * Applying decay hourly keeps the pole visibly slippery without midnight jumps
 * (§6.1: "Dihitung per jam agar halus").
 */
export function hourlyFactor(dailyRate: number): number {
  return (1 - dailyRate) ** (1 / 24);
}

/**
 * New integer grip after one hour of decay. Monotonic non-increasing, clamped
 * at `floor`. A zero rate (or grip already at the floor) leaves grip unchanged.
 */
export function decayGripOneHour(grip: number, dailyRate: number, floor: number): number {
  if (dailyRate <= 0) return grip;
  const next = Math.round(grip * hourlyFactor(dailyRate));
  return Math.max(floor, next);
}
