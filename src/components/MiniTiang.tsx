/**
 * A small pole with a marker at the chosen height — the target made visible
 * before paying (MI-2, simplified). Height is a fraction 0–1.
 */
export function MiniTiang({ height }: { height: number }) {
  const pct = Math.min(100, Math.max(4, Math.round(height * 100)));
  return (
    <div className="relative mx-auto h-44 w-3" aria-hidden>
      {/* flag at the summit */}
      <span
        className="absolute -top-2 left-1/2 block h-2 w-3 -translate-x-1/2 bg-merah"
        style={{ clipPath: "polygon(0 0, 100% 50%, 0 100%)" }}
      />
      <div className="relative h-full w-full rounded-full bg-tiang">
        <span className="absolute inset-y-0 left-0 w-0.5 rounded-full bg-licin/70" />
      </div>
      {/* the climbing marker */}
      <span
        className="absolute left-1/2 size-4 -translate-x-1/2 rounded-full border-2 border-kertas-1 bg-merah transition-all duration-300 ease-panjat"
        style={{ bottom: `calc(${pct}% - 0.5rem)` }}
      />
    </div>
  );
}
