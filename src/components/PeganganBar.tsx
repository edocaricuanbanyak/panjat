/**
 * Grip strength relative to the current leader. The width encodes how strong a
 * grip is; "rosot harus terlihat" (§9.1) — a weakening bar, not just a number.
 */
export function PeganganBar({ pegangan, max }: { pegangan: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.max(2, Math.round((pegangan / max) * 100))) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-kertas-2" aria-hidden>
      <div className="relative h-full rounded-full bg-tiang" style={{ width: `${pct}%` }}>
        {/* the slick sheen */}
        <span className="absolute inset-y-0 left-0 w-0.5 rounded-full bg-licin/70" />
      </div>
    </div>
  );
}
