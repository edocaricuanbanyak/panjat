import type { BoardEntry } from "@/domain/board";
import { formatRupiah } from "@/lib/format";
import { LencanaRow } from "./LencanaRow";
import { LogoTile } from "./LogoTile";
import { ManjatButton } from "./ManjatModal";

// Top-3 podium medals: gold crown, silver, bronze (ribbon-style corner badge).
const MEDALI: Record<1 | 2 | 3, { bg: string; icon: string; label: string }> = {
  1: { bg: "bg-emas", icon: "👑", label: "Juara 1" },
  2: { bg: "bg-perak", icon: "2", label: "Juara 2" },
  3: { bg: "bg-perunggu", icon: "3", label: "Juara 3" },
};

/**
 * One climber, as an editorial row: #rank · logo · name · grip. On hover the row
 * lifts into focus and a Salip button floats in above-center (outbid-style);
 * on touch the button sits inline. Summit (top 3) is larger, shows the
 * description, and carries the flag-red rank (§9.6.2 — merah = summit only).
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
  // Title is owner-editable; show the real URL host so the board stays honest.
  const host = entry.urlNormal.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const medali = puncak
    ? MEDALI[entry.rank as 1 | 2 | 3]
    : undefined;

  return (
    <article
      className={`group relative flex items-center gap-4 rounded-xl px-4 transition-all ease-panjat hover:z-10 ${puncak ? "py-3.5" : "py-3"}`}
    >
      {/* Podium ribbon — top-left, overlapping the corner (top-3 only). */}
      {medali && (
        <span
          aria-label={medali.label}
          title={medali.label}
          className={`absolute -left-2 -top-2 z-20 grid size-6 place-items-center rounded-full text-xs font-bold leading-none text-kertas-1 shadow-kartu ring-2 ring-kertas-1 ${medali.bg}`}
        >
          {medali.icon}
        </span>
      )}

      {/* Above-center floating action, revealed on hover (pointer devices). */}
      <div className="pointer-events-none absolute -top-3.5 left-1/2 z-20 hidden -translate-x-1/2 opacity-0 transition-all ease-panjat group-hover:pointer-events-auto group-hover:-top-4 group-hover:opacity-100 md:block">
        <ManjatButton url={entry.urlNormal} size="sm">
          Salip {entry.nama} →
        </ManjatButton>
      </div>

      <div
        className={`shrink-0 text-right font-mono tabular font-semibold ${
          puncak ? "w-12 text-2xl" : "w-9 text-base"
        } ${entry.rank <= 3 ? "text-merah" : "text-tinta-redup"}`}
      >
        #{entry.rank}
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
        {puncak && entry.deskripsi && (
          <p className="truncate text-sm text-tinta-redup">{entry.deskripsi}</p>
        )}
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-tinta-redup">
          <span className="truncate font-mono text-tinta-redup/80">{host}</span>
          {entry.kategoriNama && (
            <>
              <span aria-hidden>·</span>
              <span className="shrink-0">{entry.kategoriNama}</span>
            </>
          )}
          <span aria-hidden>·</span>
          <span className="shrink-0 font-mono tabular">
            {entry.klikHariIni.toLocaleString("id-ID")} klik
          </span>
        </p>
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
        {/* Inline action for touch/small screens (no hover). */}
        <span className="md:hidden">
          <ManjatButton url={entry.urlNormal} size="sm" variant="secondary">
            Salip
          </ManjatButton>
        </span>
      </div>
    </article>
  );
}
