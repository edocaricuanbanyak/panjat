/** Permanent sponsor badges (R17). The trophy stays even as the position decays. */
export function LencanaRow({ badges }: { badges: string[] }) {
  if (badges.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {badges.map((b) => {
        const puncak = b === "Pernah di Puncak" || b === "Juara Kategori";
        return (
          <span
            key={b}
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${
              puncak ? "border-merah/40 bg-merah/5 text-merah" : "border-garis bg-kertas-2 text-tinta-redup"
            }`}
          >
            {b}
          </span>
        );
      })}
    </div>
  );
}
