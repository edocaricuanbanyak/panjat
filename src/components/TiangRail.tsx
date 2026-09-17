import { Pennant } from "./Pennant";

/**
 * The signature: the greased pole (tiang) the summit climbs. It rises in a left
 * gutter through the top-3, prize + flag at the top (§9.6.2 — merah is summit).
 * Wood shaft carries the `licin` sheen (the grease), so the slippery-pole thesis
 * finally reads on screen. Decorative + informational; height is position.
 *
 * The summit uses the shared Pennant (hoist flush to the mast, flying to the
 * fly) so the flag matches every other pole mark — see PoleMark / MiniTiang.
 */
export function TiangRail({ className }: { className?: string }) {
  return (
    <div className={`relative flex justify-center ${className ?? ""}`} aria-hidden>
      {/* the greased pole — wood with a slick sheen running down it */}
      <div className="relative h-full w-2 overflow-hidden rounded-full bg-tiang">
        <span className="sheen-licin absolute inset-y-0 left-0.5 w-1 rounded-full opacity-80" />
      </div>
      {/* footing where the pole meets the ground */}
      <span className="absolute -bottom-1 left-1/2 h-1.5 w-4 -translate-x-1/2 rounded-full bg-tiang/60" />
      {/* the mast at the summit — the pole's tip that carries the prize + flag */}
      <span className="absolute -top-4 left-1/2 h-5 w-2 -translate-x-1/2 overflow-hidden rounded-t-full bg-tiang">
        <span className="sheen-licin absolute inset-y-0 left-0.5 w-1 rounded-full opacity-80" />
      </span>
      {/* the pinang prize bundle, on the mast just below the flag */}
      <span className="absolute -top-1 left-1/2 block size-2.5 -translate-x-1/2 rounded-full bg-emas shadow-baris" />
      {/* the shared red pennant — hoist flush to the mast tip, flying to the fly */}
      <Pennant className="absolute -top-4 left-1/2 h-2.5 w-3" />
    </div>
  );
}
