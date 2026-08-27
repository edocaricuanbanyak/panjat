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
  const points = ranks
    .map((r, i) => {
      const x = pad + (i / (ranks.length - 1)) * (w - 2 * pad);
      const y = pad + ((r - 1) / (maxRank - 1)) * (h - 2 * pad); // rank 1 → top
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-20 w-full" preserveAspectRatio="none" role="img" aria-label="Grafik posisi 7 hari">
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
