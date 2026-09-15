/** A labeled metric cell for the dashboard (§9.5 StatTile). `metode` renders as a
 *  below-the-line note explaining how the number is computed (transparency). */
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
      <div className="text-xs font-semibold uppercase tracking-wide text-tinta-redup">{label}</div>
      <div className="mt-1.5 font-sans tabular text-2xl font-bold leading-none text-tinta">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-tinta-redup">{sub}</div>}
      {metode && (
        <div className="mt-2 border-t border-garis pt-2 text-xs leading-snug text-tinta-redup">
          {metode}
        </div>
      )}
    </div>
  );
}
