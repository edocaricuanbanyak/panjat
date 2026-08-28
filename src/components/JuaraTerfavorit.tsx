import { Heart } from "lucide-react";
import { copy } from "@/copy";
import type { JuaraTerfavoritArsip as Juara } from "@/domain/juara-mingguan";
import { SiteLogo } from "./SiteLogo";

/**
 * Weekly "Pemanjat terfavorit" — the most-voted climber of the last archived
 * week, featured on the board as a clearly-labelled showcase. This is a free
 * spectator vote (§7.5), NOT a grip rank, and never displaces a paid listing
 * (R16 / "ranking = grip"). Sibling of the Kaki Tiang champion showcase.
 */
export function JuaraTerfavorit({ entry }: { entry: Juara }) {
  return (
    <div className="mt-5 rounded-2xl border border-merah/40 bg-gradient-to-b from-merah/8 to-kertas-1 p-4 shadow-kartu">
      <p className="mb-2 flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-tinta-redup">
        <Heart className="size-3.5 shrink-0 fill-merah text-merah" aria-hidden />
        {copy.papan.juaraTerfavorit}
      </p>
      <article className="flex items-center gap-4">
        <SiteLogo listingId={entry.id} nama={entry.nama} className="size-11 rounded-md text-lg" />
        <div className="min-w-0 flex-1">
          <a
            href={`/k/${entry.id}?asal=papan`}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate font-display text-lg font-semibold text-tinta hover:text-merah-teks"
          >
            {entry.nama}
          </a>
          {entry.deskripsi && <p className="truncate text-sm text-tinta-redup">{entry.deskripsi}</p>}
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-sans tabular text-xs text-tinta-redup">
            <span className="truncate">
              {entry.urlNormal.replace(/^https?:\/\//, "").replace(/\/+$/, "")}
            </span>
            <span aria-hidden>·</span>
            <span className="shrink-0 text-merah-teks">{copy.papan.juaraTerfavoritVote(entry.votes)}</span>
            <span aria-hidden>·</span>
            <span className="shrink-0">{copy.papan.klik(entry.klik)}</span>
          </p>
        </div>
      </article>
    </div>
  );
}
