import { Pennant } from "./Pennant";

/**
 * The signature: the greased pole (tiang) the summit climbs. It rises in a left
 * gutter through the top-3, prize + flag at the top (§9.6.2 — merah is summit).
 * The shaft is shaded as a rounded wooden cylinder (.tiang-shaft) with a slick
 * `licin` grease glint, so the slippery-pole thesis reads on screen instead of a
 * flat bar. Decorative + informational; height is position.
 *
 * The summit uses the shared Pennant (hoist flush to the mast, flying to the
 * fly) so the flag matches every other pole mark — see PoleMark / MiniTiang.
 */
export function TiangRail({ className }: { className?: string }) {
  return (
    <div className={`relative flex justify-center ${className ?? ""}`} aria-hidden>
      {/* the greased pole — a rounded wooden shaft with a slick grease glint */}
      <div className="relative h-full w-2.5 overflow-hidden rounded-full tiang-shaft shadow-baris">
        <span className="sheen-licin absolute inset-y-0 left-1 w-0.5 rounded-full opacity-90" />
      </div>
      {/* footing — a soft ground shadow where the pole is planted */}
      <span className="absolute -bottom-1 left-1/2 h-1.5 w-5 -translate-x-1/2 rounded-full bg-tiang/45" />
      {/* the mast at the summit — the pole's tip that carries the prize + flag */}
      <span className="absolute -top-4 left-1/2 h-5 w-2.5 -translate-x-1/2 overflow-hidden rounded-t-full tiang-shaft">
        <span className="sheen-licin absolute inset-y-0 left-1 w-0.5 rounded-full opacity-90" />
      </span>
      {/* the pinang prize bundle, on the mast just below the flag */}
      <span className="absolute -top-1 left-1/2 block size-2.5 -translate-x-1/2 rounded-full bg-emas shadow-baris" />
      {/* the shared red pennant — hoist flush to the mast tip, flying to the fly */}
      <Pennant className="absolute -top-4 left-1/2 h-2.5 w-3" />
    </div>
  );
}
