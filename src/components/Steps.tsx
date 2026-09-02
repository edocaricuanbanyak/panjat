/** 1-2-3 progress indicator for the manjat wizard (§9.4). */
export function Steps({ current, labels }: { current: number; labels: string[] }) {
  return (
    <ol className="flex flex-wrap gap-x-4 gap-y-2">
      {labels.map((label, i) => {
        const n = i + 1;
        const active = n === current;
        const done = n < current;
        return (
          <li key={label} className="flex items-center gap-2 text-xs">
            <span
              className={`grid size-6 place-items-center rounded-full tabular ${
                active
                  ? "bg-merah text-kertas-1"
                  : done
                    ? "bg-tiang text-kertas-1"
                    : "bg-kertas-2 text-tinta-redup"
              }`}
            >
              {n}
            </span>
            <span className={active ? "text-tinta" : "text-tinta-redup"}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}
