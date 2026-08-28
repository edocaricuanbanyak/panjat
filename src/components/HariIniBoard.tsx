import type { HariIniEntry } from "@/domain/papan-hari-ini";
import { formatRupiah } from "@/lib/format";
import { RankBadge } from "./RankBadge";
import { SiteLogo } from "./SiteLogo";

/** Papan Hari Ini standings — same money-ranked shape as the board, 24h window. */
export function HariIniBoard({ entries }: { entries: HariIniEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="mt-6 text-sm text-tinta-redup">
        Belum ada yang membayar hari ini. Juara hari ini masih terbuka lebar.
      </p>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-3">
      {entries.map((e) => (
        <article key={e.id} className="flex items-center gap-4 rounded-lg border border-garis bg-kertas-1 p-3">
          <div className="w-8 shrink-0 text-right">
            <RankBadge rank={e.rank} />
          </div>
          <SiteLogo listingId={e.id} nama={e.nama} />
          <div className="min-w-0 flex-1">
            <a
              href={`/k/${e.id}?asal=papan`}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate font-display font-semibold text-tinta hover:text-merah-teks"
            >
              {e.nama}
            </a>
            {e.kategoriNama && <p className="text-xs text-tinta-redup">{e.kategoriNama}</p>}
          </div>
          <span className="font-sans tabular text-sm font-semibold text-tinta">
            {formatRupiah(e.todayGrip)}
          </span>
        </article>
      ))}
    </div>
  );
}
