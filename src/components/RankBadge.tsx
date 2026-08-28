/** Position marker. Summit zone (#1–3) wears merah; the rest stays quiet (§9.6.2). */
export function RankBadge({ rank }: { rank: number }) {
  const top = rank <= 3;
  return (
    <span
      className={`font-sans tabular text-sm font-semibold ${top ? "text-merah-teks" : "text-tinta-redup"}`}
    >
      #{rank}
    </span>
  );
}
