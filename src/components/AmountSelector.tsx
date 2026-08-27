/**
 * Target-position selector (R2) — the user picks a position, the system computes
 * the rupiah. "Jangan pernah suruh user menebak angka" (§9.1).
 */
export type TargetChoice = "#1" | "top3" | "top10" | "nominal";

const OPTIONS: { key: TargetChoice; label: string; sub: string }[] = [
  { key: "#1", label: "Puncak", sub: "#1" },
  { key: "top3", label: "Top 3", sub: "#2–3" },
  { key: "top10", label: "Top 10", sub: "#4–10" },
  { key: "nominal", label: "Nominal bebas", sub: "atur sendiri" },
];

export function AmountSelector({
  value,
  onSelect,
}: {
  value: TargetChoice | null;
  onSelect: (choice: TargetChoice) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {OPTIONS.map((o) => {
        const active = value === o.key;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onSelect(o.key)}
            aria-pressed={active}
            className={`flex h-16 flex-col items-start justify-center rounded-xl border px-3.5 text-left shadow-kartu transition-all ease-panjat hover:-translate-y-px ${
              active
                ? "border-merah bg-kertas-1 ring-2 ring-merah/30"
                : "border-garis bg-kertas-1 hover:bg-kertas-2"
            }`}
          >
            <span className="font-display text-base font-semibold text-tinta">{o.label}</span>
            <span className="font-mono text-xs text-tinta-redup">{o.sub}</span>
          </button>
        );
      })}
    </div>
  );
}
