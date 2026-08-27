import type { BoardEntry } from "@/domain/board";
import { formatRupiah } from "@/lib/format";
import { LencanaRow } from "./LencanaRow";
import { LogoTile } from "./LogoTile";
import { ManjatButton } from "./ManjatModal";

/**
 * One climber, as an editorial row: big rank numeral · logo · name · grip · Salip.
 * Summit (top 3) is larger, shows the description, and carries the flag-red rank
 * (§9.6.2 — merah only in the summit zone). Rows are hairline-divided by the
 * containing list, not individually boxed.
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
  const wdth = puncak ? Math.max(105, 130 - (entry.rank - 1) * 10) : 100;

  return (
    <article className={`flex items-center gap-4 ${puncak ? "py-3.5" : "py-3"}`}>
      <div
        className={`shrink-0 text-right font-mono tabular font-semibold ${
          puncak ? "w-10 text-2xl" : "w-8 text-base"
        } ${entry.rank <= 3 ? "text-merah" : "text-tinta-redup"}`}
      >
        {entry.rank}
      </div>
      <LogoTile
        nama={entry.nama}
        className={puncak ? "size-11 rounded-md text-lg" : "size-9 rounded-md text-sm"}
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
          <p className="truncate text-sm text-tinta-redup">{entry.deskripsi}</p>
        ) : (
          entry.kategoriNama && <p className="text-xs text-tinta-redup">{entry.kategoriNama}</p>
        )}
        {entry.badges.length > 0 && (
          <div className="mt-1">
            <LencanaRow badges={entry.badges.slice(0, 2)} />
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span
          className={`font-mono tabular font-semibold text-tinta ${puncak ? "text-xl" : "text-base"}`}
        >
          {formatRupiah(entry.pegangan)}
        </span>
        <ManjatButton url={entry.urlNormal} size="sm" variant="secondary">
          Salip
        </ManjatButton>
      </div>
    </article>
  );
}
