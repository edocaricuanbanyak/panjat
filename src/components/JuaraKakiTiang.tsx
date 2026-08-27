import { Star } from "lucide-react";
import { copy } from "@/copy";
import type { JuaraKakiTiang as Juara } from "@/domain/sorak";
import { LogoTile } from "./LogoTile";

/**
 * Weekly Kaki Tiang champion — the most-cheered free (Rp0) listing of the last 7
 * days, featured at the TOP of the board as a clearly-labelled showcase. It is
 * NOT a grip rank and never displaces a paid listing (R16 / "ranking = grip").
 * A gentle bridge from the free tier toward a first payment; shows the pitch and
 * the traffic it earned this week.
 */
export function JuaraKakiTiang({ entry }: { entry: Juara }) {
  return (
    <div className="mt-5 rounded-2xl border border-emas/50 bg-gradient-to-b from-emas/12 to-kertas-1 p-4 shadow-kartu">
      <p className="mb-2 flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-tinta-redup">
        <Star className="size-3.5 shrink-0 text-emas" aria-hidden />
        {copy.papan.juaraKakiTiang}
      </p>
      <article className="flex items-center gap-4">
        <LogoTile nama={entry.nama} className="size-11 rounded-md text-lg" />
        <div className="min-w-0 flex-1">
          <a
            href={`/k/${entry.id}?asal=papan`}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate font-display text-lg font-semibold text-tinta hover:text-merah-teks"
          >
            {entry.nama}
          </a>
          {entry.deskripsi && (
            <p className="truncate text-sm text-tinta-redup">{entry.deskripsi}</p>
          )}
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono tabular text-xs text-tinta-redup">
            <span className="truncate">{entry.urlNormal.replace(/^https?:\/\//, "").replace(/\/+$/, "")}</span>
            <span aria-hidden>·</span>
            <span className="shrink-0 text-emas">{copy.kakiTiang.dukungan_n(entry.sorak)}</span>
            <span aria-hidden>·</span>
            <span className="shrink-0">{copy.papan.klik(entry.klik)}</span>
          </p>
        </div>
      </article>
    </div>
  );
}
