import type { BoardEntry } from "@/domain/board";
import { formatRupiah } from "@/lib/format";
import { LencanaRow } from "./LencanaRow";
import { LogoTile } from "./LogoTile";
import { ManjatButton } from "./ManjatModal";
import { RankBadge } from "./RankBadge";

/**
 * One climber on the pole — a clean row: rank · logo · name · pegangan · Salip.
 * Summit (top 3) is larger and shows the description; secondary detail (clicks,
 * decay estimate) lives on the dashboard, not the board.
 */
export function ListingCard({
  entry,
  density = "row",
}: {
  entry: BoardEntry;
  max?: number;
  density?: "puncak" | "row";
}) {
  const puncak = density === "puncak";
  const wdth = puncak ? Math.max(100, 130 - (entry.rank - 1) * 12) : 100;

  return (
    <article
      className={`flex items-center gap-3 rounded-lg border border-garis bg-kertas-1 ${puncak ? "p-4" : "p-3"}`}
    >
      <div className="w-7 shrink-0 text-right">
        <RankBadge rank={entry.rank} />
      </div>
      <LogoTile
        nama={entry.nama}
        className={puncak ? "size-12 rounded-md text-xl" : "size-9 rounded-md text-base"}
      />
      <div className="min-w-0 flex-1">
        <a
          href={`/k/${entry.id}?asal=papan`}
          target="_blank"
          rel="noopener noreferrer"
          className={`block truncate font-display font-semibold text-tinta hover:text-merah ${puncak ? "text-lg" : "text-base"}`}
          style={{ fontStretch: `${wdth}%` }}
        >
          {entry.nama}
        </a>
        {puncak && entry.deskripsi ? (
          <p className="truncate text-xs text-tinta-redup">{entry.deskripsi}</p>
        ) : (
          entry.kategoriNama && <p className="text-xs text-tinta-redup">{entry.kategoriNama}</p>
        )}
        {entry.badges.length > 0 && (
          <div className="mt-1">
            <LencanaRow badges={entry.badges.slice(0, 2)} />
          </div>
        )}
      </div>
      <span
        className={`shrink-0 font-mono tabular font-semibold text-tinta ${puncak ? "text-lg" : "text-sm"}`}
      >
        {formatRupiah(entry.pegangan)}
      </span>
      <ManjatButton url={entry.urlNormal} size="sm">
        Salip
      </ManjatButton>
    </article>
  );
}
