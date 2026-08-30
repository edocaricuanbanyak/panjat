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
  /** Absolute grip floor (Kaki Tiang); at or below this, decay rate is 0. */
  kakiTiang: number;
  /** Fraction of a listing's total paid protected from decay (e.g. 0.10 = 10%). */
  lantaiRasio: number;
  /** Hard cap on the protected floor — must stay ≪ summit so #1 stays contestable. */
  lantaiMaks: number;
}

/**
 * Per-listing decay floor: what a sponsor paid is protected from rosot, but
 * capped so a big payer can never lock the summit (§1.5 D1). Floor rises with
 * total paid up to `lantaiMaks`, and never below the absolute Kaki Tiang floor.
 *   floor = max(kakiTiang, min(lantaiMaks, round(lantaiRasio × totalBayar)))
 * A free/unpaid listing (totalBayar 0) floors at kakiTiang, unchanged.
 */
export function listingFloor(totalBayar: number, cfg: RosotConfig): number {
  const proporsional = Math.min(cfg.lantaiMaks, Math.round(cfg.lantaiRasio * totalBayar));
  return Math.max(cfg.kakiTiang, proporsional);
}

/**
 * Daily decay rate for a listing at a given rank and grip. Grip at/below its
 * floor never decays (§6.1). `floor` defaults to the absolute Kaki Tiang floor;
 * the hourly job passes the per-listing protected floor (see listingFloor).
 */
export function dailyRateForRank(
  rank: number,
  grip: number,
  cfg: RosotConfig,
  floor: number = cfg.kakiTiang,
): number {
  if (grip <= floor) return 0;
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

/**
 * Rough whole-day estimate of how long a grip stays above `threshold` under
 * self-decay at `dailyRate` (§6.5: "estimasi bertahan"). Returns Infinity when
 * grip never decays (floored), 0 when already at/below the threshold. This is an
 * approximation — it ignores that others decay too and that the tier changes.
 */
export function estimateDaysToThreshold(
  startGrip: number,
  dailyRate: number,
  threshold: number,
): number {
  if (dailyRate <= 0) return Infinity;
  if (startGrip <= threshold || threshold <= 0) return 0;
  return Math.floor(Math.log(threshold / startGrip) / Math.log(1 - dailyRate));
}
