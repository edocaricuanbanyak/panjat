import { copy } from "@/copy";
import type { Aktivitas } from "@/lib/aktivitas";

/**
 * Live activity ticker (§6.4) — a sticky running strip of the latest things that
 * happened on the board (vote, dukung, naik/salip). The track is duplicated so
 * the marquee loops seamlessly; it pauses on hover and stops under reduced-motion.
 */
function label(a: Aktivitas): string {
  switch (a.jenis) {
    case "vote":
      return "baru divote";
    case "dukung":
      return "baru didukung";
    case "naik":
      return a.rank ? `naik ke #${a.rank}` : "baru manjat";
  }
}

export function Spotlight({ items }: { items: Aktivitas[] }) {
  if (items.length === 0) return null;
  const loop = items.length < 6 ? [...items, ...items, ...items] : [...items, ...items];

  return (
    <div className="flex items-center gap-3 overflow-hidden py-1.5">
      <span className="shrink-0 font-mono text-[11px] font-semibold uppercase tracking-wide text-merah-teks">
        {copy.papan.aktivitas}
      </span>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="ticker-track flex w-max gap-8 whitespace-nowrap">
          {loop.map((a, i) => (
            <a
              key={`${a.id}-${i}`}
              href={`/l/${a.id}`}
              className="flex items-center gap-1.5 text-sm hover:text-merah-teks"
              aria-hidden={i >= items.length ? true : undefined}
            >
              <span className="font-display font-semibold text-tinta">{a.nama}</span>
              <span className="text-tinta-redup">{label(a)}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
