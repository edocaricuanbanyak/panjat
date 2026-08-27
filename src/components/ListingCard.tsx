import type { BoardEntry } from "@/domain/board";
import { formatRupiah } from "@/lib/format";
import { buttonClasses } from "./Button";
import { CategoryChip } from "./CategoryChip";
import { EstimateLabel } from "./EstimateLabel";
import { LencanaRow } from "./LencanaRow";
import { LogoTile } from "./LogoTile";
import { PeganganBar } from "./PeganganBar";
import { RankBadge } from "./RankBadge";

/**
 * One climber hanging at its height on the pole. `puncak` density for the summit
 * three (larger, name stretched wider — width is a data encoding, §9.6.3);
 * `row` for the denser tail.
 */
export function ListingCard({
  entry,
  max,
  density = "row",
}: {
  entry: BoardEntry;
  max: number;
  density?: "puncak" | "row";
}) {
  const puncak = density === "puncak";
  // Name width axis widest at #1, tapering down the summit zone (§9.6.3).
  const wdth = puncak ? Math.max(100, 130 - (entry.rank - 1) * 12) : 100;

  return (
    <article
      className={`flex items-center gap-4 rounded-lg border border-garis bg-kertas-1 ${puncak ? "p-4" : "p-3"}`}
    >
      <div className="w-8 shrink-0 text-right">
        <RankBadge rank={entry.rank} />
      </div>
      <LogoTile
        nama={entry.nama}
        className={
          puncak ? "size-14 rounded-md text-2xl" : "size-11 rounded-md text-lg"
        }
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <a
            href={`/k/${entry.id}?asal=papan`}
            target="_blank"
            rel="noopener noreferrer"
            className={`truncate font-display font-semibold text-tinta hover:text-merah ${puncak ? "text-xl" : "text-base"}`}
            style={{ fontStretch: `${wdth}%` }}
          >
            {entry.nama}
          </a>
          {entry.kategoriNama && (
            <span className="hidden sm:inline">
              <CategoryChip label={entry.kategoriNama} />
            </span>
          )}
        </div>
        {entry.deskripsi && (
          <p className="mt-0.5 truncate text-sm text-tinta-redup">{entry.deskripsi}</p>
        )}
        <div className="mt-2">
          <PeganganBar pegangan={entry.pegangan} max={max} />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
          <EstimateLabel rosotPerHari={entry.rosotPerHari} />
          <span className="font-mono tabular text-xs text-tinta-redup">
            {entry.klikHariIni} klik hari ini
          </span>
        </div>
        {entry.badges.length > 0 && (
          <div className="mt-2">
            <LencanaRow badges={entry.badges} />
          </div>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span
          className={`font-mono tabular font-semibold text-tinta ${puncak ? "text-lg" : "text-sm"}`}
        >
          {formatRupiah(entry.pegangan)}
        </span>
        <a href={`/manjat?url=${encodeURIComponent(entry.urlNormal)}`} className={buttonClasses("primary", "sm")}>
          Salip
        </a>
      </div>
    </article>
  );
}
