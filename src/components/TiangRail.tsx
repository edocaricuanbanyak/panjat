/**
 * The signature: the greased pole (tiang) the summit climbs. It rises in a left
 * gutter through the top-3, prize + flag at the top (§9.6.2 — merah is summit).
 * Wood shaft carries the `licin` sheen (the grease), so the slippery-pole thesis
 * finally reads on screen. Decorative + informational; height is position.
 */
export function TiangRail({ className }: { className?: string }) {
  return (
    <div className={`relative flex justify-center ${className ?? ""}`} aria-hidden>
      {/* prize bundle + flag at the summit */}
      <div className="absolute -top-4 left-1/2 flex -translate-x-1/2 flex-col items-center">
        <span
          className="block h-2.5 w-3.5 bg-merah"
          style={{ clipPath: "polygon(0 0, 100% 50%, 0 100%)" }}
        />
        <span className="mt-0.5 block size-2.5 rounded-full bg-emas shadow-baris" />
      </div>
      {/* the greased pole — wood with a slick sheen running down it */}
      <div className="relative h-full w-2 overflow-hidden rounded-full bg-tiang">
        <span className="sheen-licin absolute inset-y-0 left-0.5 w-1 rounded-full opacity-80" />
      </div>
      {/* footing where the pole meets the ground */}
      <span className="absolute -bottom-1 left-1/2 h-1.5 w-4 -translate-x-1/2 rounded-full bg-tiang/60" />
    </div>
  );
}
