import { copy } from "@/copy";
import type { BoardEntry } from "@/domain/board";
import { formatRupiah } from "@/lib/format";
import { LencanaRow } from "./LencanaRow";
import { SiteLogo } from "./SiteLogo";
import { ManjatButton } from "./ManjatModal";

// Top-3 podium medals: gold crown, silver, bronze (ribbon-style corner badge).
const MEDALI: Record<1 | 2 | 3, { bg: string; label: string }> = {
  1: { bg: "pita-emas", label: "Juara 1 (emas)" },
  2: { bg: "pita-perak", label: "Juara 2 (perak)" },
  3: { bg: "pita-perunggu", label: "Juara 3 (perunggu)" },
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
  // Cost hint to overtake this listing (just above its grip; final amount is
  // computed in the modal). The board never floors below Rp1.000.
  const salipCost = entry.pegangan + 1000;
  const medali = puncak
    ? MEDALI[entry.rank as 1 | 2 | 3]
    : undefined;

  return (
    <article
      className={`group relative flex flex-col gap-1.5 rounded-xl px-3 transition-all ease-panjat hover:z-10 sm:flex-row sm:items-center sm:gap-4 sm:px-4 ${puncak ? "py-3.5" : "py-3"}`}
    >
      {/* Medal ribbon (pita) on the card's top-left — top-3 only. */}
      {medali && (
        <span
          aria-label={medali.label}
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 66%, 50% 100%, 0 66%)" }}
          className={`absolute -top-2.5 left-3 z-20 flex h-7 w-11 items-start justify-center pt-1 font-display text-xs font-bold leading-none text-kertas-1 drop-shadow-md sm:left-4 ${medali.bg}`}
        >
          #{entry.rank}
        </span>
      )}

      {/* Above-center floating action, revealed on hover (pointer devices). */}
      <div className="pointer-events-none absolute -top-3 left-1/2 z-20 hidden -translate-x-1/2 opacity-0 transition-all ease-panjat group-hover:pointer-events-auto group-hover:-top-3.5 group-hover:opacity-100 md:block">
        <ManjatButton nominal={salipCost} size="sm" className="h-7 px-2.5 text-xs">
          {copy.papan.salipRank(entry.rank, formatRupiah(salipCost))}
        </ManjatButton>
      </div>

      {/* Desktop hover-card: the site screenshot after ~400ms (R21) — never a
          board-row thumbnail, only this on-hover preview. */}
      {entry.screenshotUrl && (
        <div className="pointer-events-none absolute right-2 top-full z-30 mt-1 hidden w-64 overflow-hidden rounded-lg border border-garis bg-kertas-1 opacity-0 shadow-naik transition-opacity delay-0 duration-150 group-hover:opacity-100 group-hover:delay-[400ms] md:block">
          {/* biome-ignore lint/performance/noImgElement: user-captured screenshot */}
          <img
            src={entry.screenshotUrl}
            alt={copy.listing.pratinjauAlt(entry.nama)}
            width={1200}
            height={800}
            className="w-full"
          />
        </div>
      )}

      {/* Rank + logo + the listing block. On sm+ the wrapper dissolves (contents)
          into the editorial row. */}
      <div className="flex min-w-0 items-center gap-3 sm:contents">
        {/* Rank 4+ shows the number inline; the podium wears its medal as a badge
            on the logo, freeing the whole row width for a one-line title. */}
        {/* Rank 4+ shows the number inline; podium wears its medal ribbon on the
            card (above), so the row is just logo + text. */}
        {!puncak && (
          <div className="w-9 shrink-0 text-right font-mono tabular text-base font-semibold text-tinta-redup">
            #{entry.rank}
          </div>
        )}
        <SiteLogo
          urlNormal={entry.urlNormal}
          nama={entry.nama}
          className={puncak ? "size-11 rounded-md text-lg" : "size-9 rounded-md text-sm"}
        />
        <div className="min-w-0 flex-1">
          {/* Title stretches; grip pinned to the end of the line — same position
              on every card (podium just larger + summit-red). */}
          <div className="flex items-baseline gap-2">
            <a
              href={`/k/${entry.id}?asal=papan`}
              target="_blank"
              rel="noopener noreferrer"
              className={`min-w-0 flex-1 truncate font-display font-semibold text-tinta transition-colors after:absolute after:inset-0 group-hover:text-merah-teks ${puncak ? "text-lg" : "text-base"}`}
              style={{ fontStretch: `${wdth}%` }}
            >
              {entry.nama}
            </a>
            <span
              className={`shrink-0 font-mono tabular font-semibold ${puncak ? "text-base text-merah-teks sm:text-lg" : "text-sm text-tinta sm:text-base"}`}
            >
              {formatRupiah(entry.pegangan)}
            </span>
          </div>

          {/* Description — full card width; 2 lines on the podium, 1 line below. */}
          {entry.deskripsi && (
            <p
              className={`mt-0.5 text-tinta-redup ${
                puncak ? "line-clamp-2 text-sm" : "line-clamp-1 text-xs sm:text-sm"
              }`}
            >
              {entry.deskripsi}
            </p>
          )}

          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-tinta-redup">
            <span className="truncate font-mono text-tinta-redup">{host}</span>
            {entry.kategoriNama && (
              <span className="hidden shrink-0 items-center gap-1.5 sm:flex">
                <span aria-hidden>·</span>
                {entry.kategoriNama}
              </span>
            )}
            <span aria-hidden>·</span>
            <span className="shrink-0 font-mono tabular">{copy.papan.klik(entry.klikHariIni)}</span>
          </p>

          {entry.badges.length > 0 && (
            <div className="mt-1">
              <LencanaRow badges={entry.badges.slice(0, 2)} />
            </div>
          )}

          {/* Mobile: full-width red Salip CTA. */}
          <div className="relative z-10 mt-2 sm:hidden">
            <ManjatButton nominal={salipCost} size="sm" className="h-9 w-full">
              {copy.papan.salip(formatRupiah(salipCost))}
            </ManjatButton>
          </div>
        </div>
      </div>

      {/* Tablet (sm–md) inline Salip; desktop uses the hover button above. */}
      <div className="relative z-10 hidden shrink-0 items-center sm:flex md:hidden">
        <ManjatButton nominal={salipCost} size="sm" variant="secondary" className="h-7 px-2.5 text-xs">
          {copy.papan.salipSingkat}
        </ManjatButton>
      </div>
    </article>
  );
}
