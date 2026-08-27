/**
 * The signature: a pole rail down the left of the board, prize + flag at the
 * summit (§9.6.2). Decorative and informational — height is position. Purely
 * visual here; per-listing markers/decay animation ship with the realtime slice.
 */
export function TiangRail({ className }: { className?: string }) {
  return (
    <div className={`relative flex justify-center ${className ?? ""}`} aria-hidden>
      {/* prize + flag at the top of the pole */}
      <div className="absolute -top-3 left-1/2 flex -translate-x-1/2 flex-col items-center">
        <span
          className="block h-2 w-3 bg-merah"
          style={{ clipPath: "polygon(0 0, 100% 50%, 0 100%)" }}
        />
        <span className="mt-0.5 block size-2 rounded-sm bg-tiang" />
      </div>
      {/* the pole */}
      <div className="relative h-full w-1.5 rounded-full bg-tiang">
        <span className="absolute inset-y-0 left-0 w-0.5 rounded-full bg-licin/70" />
      </div>
    </div>
  );
}
