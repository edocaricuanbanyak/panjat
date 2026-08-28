/** A labeled metric cell for the dashboard (§9.5 StatTile). `metode` states how the
 *  number is measured — the honesty line that makes a public stat trustworthy. */
export function StatTile({
  label,
  value,
  sub,
  metode,
}: {
  label: string;
  value: string;
  sub?: string;
  metode?: string;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-garis bg-kertas-1 p-3.5 shadow-kartu">
      <div className="text-xs text-tinta-redup">{label}</div>
      <div className="mt-1 font-sans tabular text-xl font-semibold text-tinta">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-tinta-redup">{sub}</div>}
      {metode && (
        <div className="mt-2 border-t border-garis/60 pt-1.5 text-[11px] leading-snug text-tinta-redup">
          {metode}
        </div>
      )}
    </div>
  );
}
