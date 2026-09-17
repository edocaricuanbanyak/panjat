import { PENNANT_D } from "./Pennant";

/**
 * The greased pole as a small standalone mark — a scaled-down echo of the
 * board's signature rail (TiangRail) for empty / 404 / error states, so those
 * moments still carry the product's identity. Purely decorative.
 *
 * Drawn as vector art (like Logomark) rather than stacked clip-path spans: the
 * red pennant's hoist sits flush against the pole tip and tapers out to the fly,
 * the way a flag actually hangs — not a triangle floating across the shaft. The
 * `licin` grease sheen runs down the wood; the gold bundle is the pinang prize.
 * Per §9.6.2, `merah` stays at the summit only.
 */
export function PoleMark({ className = "h-16 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 64" className={className} aria-hidden focusable="false">
      {/* footing where the pole meets the ground */}
      <ellipse cx="9.75" cy="57.5" rx="4.2" ry="1.1" className="fill-tiang opacity-40" />
      {/* the greased pole — pinang wood */}
      <rect x="8.05" y="8" width="3.4" height="49.5" rx="1.7" className="fill-tiang" />
      {/* the slick licin sheen running down the shaft (the grease) */}
      <rect x="8.55" y="11" width="1.3" height="44" rx="0.65" className="fill-licin opacity-60" />
      {/* the pinang prize bundle, just below the summit */}
      <circle cx="9.75" cy="20.5" r="2.3" className="fill-emas" />
      <circle cx="8.95" cy="19.7" r="0.7" className="fill-kertas-1 opacity-70" />
      {/* the shared red pennant — hoist flush to the pole tip, flying to the fly */}
      <path d={PENNANT_D} transform="translate(9.75 8.8)" className="fill-merah" />
    </svg>
  );
}
