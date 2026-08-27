import { formatRupiah } from "@/lib/format";

/**
 * Spotlight ticker (§6.4) — a sticky running-text strip giving every listing
 * above-the-fold airtime, not just the summit. The track is duplicated so the
 * marquee loops seamlessly; it pauses on hover and stops under reduced-motion.
 */
export interface SpotlightItem {
  id: string;
  nama: string;
  pegangan: number;
}

export function Spotlight({ items }: { items: SpotlightItem[] }) {
  if (items.length === 0) return null;
  const loop = [...items, ...items]; // duplicate for a seamless wrap

  return (
    <div className="flex items-center gap-3 overflow-hidden py-1.5">
      <span className="shrink-0 font-mono text-[11px] font-semibold uppercase tracking-wide text-merah">
        Spotlight
      </span>
      <div className="overflow-hidden">
        <div className="ticker-track flex w-max gap-8 whitespace-nowrap">
          {loop.map((it, i) => (
            <a
              key={`${it.id}-${i}`}
              href={`/k/${it.id}?asal=papan`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm hover:text-merah"
              aria-hidden={i >= items.length ? true : undefined}
            >
              <span className="font-display font-semibold text-tinta">{it.nama}</span>
              <span className="font-mono text-xs text-tinta-redup">{formatRupiah(it.pegangan)}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
