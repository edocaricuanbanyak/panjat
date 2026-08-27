/** Category tag / filter pill. */
export function CategoryChip({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-full border px-2.5 text-xs whitespace-nowrap ${
        active
          ? "border-tinta bg-tinta text-kertas-1"
          : "border-garis bg-kertas-1 text-tinta-redup"
      }`}
    >
      {label}
    </span>
  );
}
