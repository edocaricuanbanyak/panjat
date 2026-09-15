/**
 * 7-day rank sparkline (R4). Rank #1 sits at the top (lower is better). Pure
 * SVG, no dependency (§17.3). Needs ≥2 points.
 */
export function Sparkline({ ranks }: { ranks: number[] }) {
  if (ranks.length < 2) {
    return <p className="text-xs text-tinta-redup">Data posisi belum cukup untuk grafik.</p>;
  }
  const w = 300;
  const h = 80;
  const pad = 6;
  const maxRank = Math.max(...ranks, 2);
  const xy = ranks.map((r, i) => {
    const x = pad + (i / (ranks.length - 1)) * (w - 2 * pad);
    const y = pad + ((r - 1) / (maxRank - 1)) * (h - 2 * pad); // rank 1 → top
    return [x, y] as const;
  });
  const points = xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  // Area under the line, filled with the licin sheen — the slippery slope.
  const area = `${pad},${h} ${points} ${(w - pad).toFixed(1)},${h}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-20 w-full" preserveAspectRatio="none" role="img" aria-label="Grafik posisi 7 hari">
      <defs>
        <linearGradient id="sparkLicin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-licin)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--color-licin)" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#sparkLicin)" stroke="none" />
      <polyline
        points={points}
        fill="none"
        stroke="var(--color-tiang)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
