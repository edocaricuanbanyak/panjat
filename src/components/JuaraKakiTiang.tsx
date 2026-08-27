import { Star } from "lucide-react";
import { copy } from "@/copy";
import type { KakiTiangEntry } from "@/domain/sorak";
import { LogoTile } from "./LogoTile";

/**
 * Wildcard showcase for the most-supported free (Kaki Tiang) listing, shown
 * BELOW the paid top-20 and clearly labelled "gratis". It is NOT a grip rank and
 * never displaces a paid listing — R16 / "ranking = grip" stay intact. A gentle
 * bridge from the free tier toward a first payment.
 */
export function JuaraKakiTiang({ entry }: { entry: KakiTiangEntry }) {
  return (
    <div className="mt-4 border-t border-dashed border-garis pt-4">
      <article className="flex items-center gap-4 rounded-xl border border-garis bg-kertas-2/60 px-4 py-3">
        <Star className="size-5 shrink-0 text-emas" aria-hidden />
        <LogoTile nama={entry.nama} className="size-9 rounded-md text-sm" />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] uppercase tracking-wide text-tinta-redup">
            {copy.papan.juaraKakiTiang}
          </p>
          <a
            href={`/k/${entry.id}?asal=papan`}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate font-display font-semibold text-tinta hover:text-merah-teks"
          >
            {entry.nama}
          </a>
        </div>
        <span className="shrink-0 font-mono tabular text-xs text-tinta-redup">
          {copy.kakiTiang.dukungan_n(entry.sorak)}
        </span>
      </article>
    </div>
  );
}
