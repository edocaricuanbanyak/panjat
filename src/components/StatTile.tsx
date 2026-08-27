/** A labeled metric cell for the dashboard (§9.5 StatTile). */
export function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-garis bg-kertas-1 p-3">
      <div className="text-xs text-tinta-redup">{label}</div>
      <div className="mt-1 font-mono tabular text-lg font-semibold text-tinta">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-tinta-redup">{sub}</div>}
    </div>
  );
}
