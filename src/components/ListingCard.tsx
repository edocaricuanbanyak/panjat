import { Crown } from "lucide-react";
import { copy } from "@/copy";
import type { BoardEntry } from "@/domain/board";
import { formatRupiah } from "@/lib/format";
import { LencanaRow } from "./LencanaRow";
import { LogoTile } from "./LogoTile";
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
      {/* Podium ribbon — a little pennant hanging over the top-left (top-3 only). */}
      {medali && (
        <span
          aria-label={medali.label}
          title={medali.label}
          style={{ clipPath: "polygon(10% 0, 90% 0, 100% 8%, 100% 100%, 50% 72%, 0 100%, 0 8%)" }}
          className={`absolute left-4 -top-2 z-20 flex h-10 w-6 items-start justify-center pt-2 leading-none drop-shadow-md ${medali.bg}`}
        >
          {entry.rank === 1 && (
            <Crown className="size-3.5 text-kertas-1" strokeWidth={2.5} aria-hidden />
          )}
        </span>
      )}

      {/* Above-center floating action, revealed on hover (pointer devices). */}
      <div className="pointer-events-none absolute -top-3 left-1/2 z-20 hidden -translate-x-1/2 opacity-0 transition-all ease-panjat group-hover:pointer-events-auto group-hover:-top-3.5 group-hover:opacity-100 md:block">
        <ManjatButton url={entry.urlNormal} nominal={salipCost} size="sm" className="h-7 px-2.5 text-xs">
          {copy.papan.salip(formatRupiah(salipCost))}
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

      {/* Mobile: rank + logo + name share the top line (name gets full width);
          on sm+ this wrapper dissolves (contents) into the original editorial row. */}
      <div className="flex min-w-0 items-center gap-3 sm:contents">
        <div
          className={`shrink-0 text-right font-mono tabular font-semibold ${
            puncak ? "w-10 text-xl sm:w-12 sm:text-2xl" : "w-9 text-base"
          } ${entry.rank <= 3 ? "text-merah-teks" : "text-tinta-redup"}`}
        >
          #{entry.rank}
        </div>
        <LogoTile
          nama={entry.nama}
          className={puncak ? "size-11 rounded-md text-lg" : "size-9 rounded-md text-sm"}
        />
        <div className="min-w-0 flex-1">
        {/* Stretched link: the whole card navigates to the tracked redirect. */}
        <a
          href={`/k/${entry.id}?asal=papan`}
          target="_blank"
          rel="noopener noreferrer"
          className={`block truncate font-display font-semibold text-tinta transition-colors group-hover:text-merah-teks after:absolute after:inset-0 ${puncak ? "text-lg" : "text-base"}`}
          style={{ fontStretch: `${wdth}%` }}
        >
          {entry.nama}
        </a>
        {puncak && entry.deskripsi && (
          <p className="truncate text-sm text-tinta-redup">{entry.deskripsi}</p>
        )}
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-tinta-redup">
          <span className="truncate font-mono text-tinta-redup">{host}</span>
          {/* Category is secondary — hide it below sm so the name/host keep room. */}
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
          {/* Mobile: pegangan (left) + Salip (right) on one tidy line under the
              name — replaces the cramped right-justified cluster. */}
          <div className="mt-2 flex items-center justify-between gap-2 sm:hidden">
            <span className="font-mono tabular text-base font-semibold text-tinta">
              {formatRupiah(entry.pegangan)}
            </span>
            <span className="relative z-10 shrink-0">
              <ManjatButton
                url={entry.urlNormal}
                nominal={salipCost}
                size="sm"
                variant="secondary"
                className="h-7 px-3 text-xs"
              >
                {copy.papan.salipSingkat}
              </ManjatButton>
            </span>
          </div>
        </div>
      </div>
      {/* Desktop (sm+): pegangan on the far right; tablet keeps an inline Salip. */}
      <div className="hidden shrink-0 items-center justify-end gap-3 sm:flex">
        <span
          className={`font-mono tabular font-semibold text-tinta ${puncak ? "text-lg sm:text-xl" : "text-base"}`}
        >
          {formatRupiah(entry.pegangan)}
        </span>
        <span className="relative z-10 md:hidden">
          <ManjatButton url={entry.urlNormal} nominal={salipCost} size="sm" variant="secondary" className="h-7 px-2.5 text-xs">
            {copy.papan.salipSingkat}
          </ManjatButton>
        </span>
      </div>
    </article>
  );
}
