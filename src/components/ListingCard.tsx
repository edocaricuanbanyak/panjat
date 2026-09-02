import { Heart, Star } from "lucide-react";
import { copy } from "@/copy";
import type { BoardEntry } from "@/domain/board";
import { formatRupiah } from "@/lib/format";
import { KategoriIcon } from "./KategoriIcon";
import { KlikChip } from "./KlikChip";
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
  terfavoritId = null,
  showRosot = true,
}: {
  entry: BoardEntry;
  max?: number;
  density?: "puncak" | "row";
  /** When this card is the reigning weekly Terfavorit, show a cosmetic chip. */
  terfavoritId?: string | null;
  /** Rosot status is an all-time-board mechanic; hide it on the 24h Hari Ini board. */
  showRosot?: boolean;
}) {
  const puncak = density === "puncak";
  const terfavorit = terfavoritId != null && entry.id === terfavoritId;
  const wdth = puncak ? Math.max(105, 130 - (entry.rank - 1) * 10) : 100;
  // Title is owner-editable; show the real URL host so the board stays honest.
  const host = entry.urlNormal.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  // Cost hint to overtake this listing (just above its grip; final amount is
  // computed in the modal). The board never floors below Rp1.000.
  const salipCost = entry.pegangan + 1000;
  const medali = puncak ? MEDALI[entry.rank as 1 | 2 | 3] : undefined;

  return (
    <article
      className={`group relative flex flex-col gap-1.5 rounded-xl px-3 transition-all ease-panjat hover:z-10 lg:flex-row lg:items-center lg:gap-4 lg:px-4 ${puncak ? "py-3.5" : "py-3"}`}
    >
      {/* Medal ribbon (pita) on the card's top-left — top-3 only. */}
      {medali && (
        <span
          aria-label={medali.label}
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 72%, 50% 100%, 0 72%)" }}
          className={`absolute -top-2.5 left-3 z-20 flex h-11 w-11 items-center justify-center pb-2 font-display text-xs font-bold leading-none text-kertas-1 drop-shadow-md sm:h-8 sm:pb-1.5 lg:left-4 ${medali.bg}`}
        >
          #{entry.rank}
        </span>
      )}

      {/* Above-center floating action, revealed on hover (desktop pointer devices).
          A free (Rp0) showcase — the Kaki Tiang champion — has nothing to salip. */}
      {entry.pegangan > 0 && (
        <div className="pointer-events-none absolute -top-3 left-1/2 z-20 hidden -translate-x-1/2 opacity-0 transition-all ease-panjat group-hover:pointer-events-auto group-hover:-top-3.5 group-hover:opacity-100 lg:block">
          <ManjatButton nominal={salipCost} size="sm" className="h-7 px-2.5 text-xs">
            {copy.papan.salipRank(entry.rank, formatRupiah(salipCost))}
          </ManjatButton>
        </div>
      )}

      {/* Rank + logo + the listing block. Only on lg+ (desktop) the wrapper dissolves
          (contents) into the editorial row; tablet & mobile keep the stacked card. */}
      <div className={`flex min-w-0 gap-3 lg:contents ${puncak ? "items-center" : "items-start"}`}>
        {/* Podium wears its medal ribbon; rank 4+ shows the number stacked above
            the logo, in line with the title — same hierarchy, no ribbon. */}
        {puncak ? (
          <SiteLogo listingId={entry.id} nama={entry.nama} className="size-11 rounded-md text-lg" />
        ) : (
          <div className="flex shrink-0 flex-col items-center">
            {/* Rank shares the title row's baseline (leading-6 = title line-height,
                top-aligned), so it lines up with the name and the grip. A free
                (Rp0) showcase — the Kaki Tiang champion — has no paid rank, so it
                shows a star instead of a number. */}
            {entry.pegangan > 0 ? (
              <span className="font-sans tabular text-sm font-semibold leading-6 text-tinta-redup">
                #{entry.rank}
              </span>
            ) : (
              <span className="flex h-6 items-center text-emas" aria-label={copy.papan.juaraKakiTiang}>
                <Star className="size-4" aria-hidden />
              </span>
            )}
            <SiteLogo listingId={entry.id} nama={entry.nama} className="mt-0.5 size-9 rounded-md text-sm" />
          </div>
        )}
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
              <span className="sr-only"> ({copy.papan.bukaTabBaru})</span>
            </a>
            <span
              className={`shrink-0 font-sans tabular font-medium text-tinta-redup ${puncak ? "text-sm lg:text-base" : "text-xs lg:text-sm"}`}
            >
              {formatRupiah(entry.pegangan)}
            </span>
          </div>

          {/* Description — full card width; 2 lines on the podium, 1 line below. */}
          {entry.deskripsi && (
            <p
              className={`mt-0.5 text-tinta-redup ${
                puncak ? "line-clamp-2 text-sm" : "line-clamp-2 text-xs lg:text-sm"
              }`}
            >
              {entry.deskripsi}
            </p>
          )}

          <p className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-tinta-redup">
            <span className="min-w-0 max-w-full truncate tabular text-tinta-redup">{host}</span>
            {entry.kategoriNama && (
              <span className="hidden shrink-0 items-center gap-1 lg:flex">
                <span aria-hidden>·</span>
                <KategoriIcon slug={entry.kategoriSlug} className="size-3.5 text-tinta-redup" />
                {entry.kategoriNama}
              </span>
            )}
            {entry.klikTotal > 0 && (
              <>
                <span aria-hidden>·</span>
                <KlikChip n={entry.klikTotal} />
              </>
            )}
            {/* Reigning weekly Terfavorit — a quiet, cosmetic honour (never a rank
                or a lencana; merah stays summit-only, so the heart is neutral). */}
            {terfavorit && (
              <span className="inline-flex shrink-0 items-center gap-1 text-tinta-redup">
                <span aria-hidden>·</span>
                <Heart className="size-3 fill-tinta-redup" aria-hidden />
                {copy.papan.terfavoritPekanIni}
              </span>
            )}
            {/* Rosot status — always visible on touch, revealed on hover on desktop. */}
            {showRosot && (
              <span
                className={`shrink-0 opacity-100 transition-opacity ease-panjat lg:opacity-0 lg:group-hover:opacity-100 ${
                  entry.masihTerjaga ? "text-hidup" : "text-tinta-redup"
                }`}
              >
                <span aria-hidden> · </span>
                {entry.masihTerjaga
                  ? copy.papan.rosotTerjaga
                  : entry.rosotPerHari > 0
                    ? copy.papan.rosotAktif(formatRupiah(entry.rosotPerHari))
                    : copy.papan.rosotLantai}
              </span>
            )}
          </p>

          {entry.badges.length > 0 && (
            <div className="mt-1">
              <LencanaRow badges={entry.badges.slice(0, 2)} />
            </div>
          )}

          {/* Mobile & tablet: full-width Salip CTA (desktop uses the hover button).
              Summit stays primary red; rank 4+ gets an outline (secondary) button.
              A free (Rp0) showcase has nothing to salip. */}
          {entry.pegangan > 0 && (
            <div className="relative z-10 mt-2 lg:hidden">
              <ManjatButton
                nominal={salipCost}
                size="sm"
                variant={puncak ? "primary" : "secondary"}
                className="h-9 w-full"
              >
                {copy.papan.salipRank(entry.rank, formatRupiah(salipCost))}
              </ManjatButton>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
