/**
 * The signature summit pennant — the merah flag that flies from the top of the
 * greased pole. Its hoist (the flat left edge) sits flush against the pole and
 * the banner tapers out to the fly, the way a flag actually hangs. Shared by
 * every pole mark (PoleMark / TiangRail / MiniTiang) so the flag reads the same
 * everywhere; §9.6.2 keeps `merah` at the summit only. Purely decorative.
 *
 * `PENNANT_D` is the path in a 9×8 box with the hoist on x=0 — reused directly
 * by PoleMark inside its own scene so the shape never drifts between the marks.
 */
export const PENNANT_D = "M0 0 Q4.5 0.4 9 3.8 Q4.5 5.2 0 8 Z";

export function Pennant({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 9 8" className={className} aria-hidden focusable="false">
      <path d={PENNANT_D} className="fill-merah" />
    </svg>
  );
}
