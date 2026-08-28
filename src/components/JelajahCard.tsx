import { copy } from "@/copy";
import type { JelajahCard as Card } from "@/domain/jelajah";
import { KategoriIcon } from "./KategoriIcon";
import { SiteLogo } from "./SiteLogo";

/**
 * Directory card for Jelajah/search surfaces. The name links out to the site
 * (via the counted /k/ redirect); "Lihat detail" opens the listing's public
 * page (/l/[id]) with its stats, chart, and Salip action.
 */
export function JelajahCard({ card, asal }: { card: Card; asal: "jelajah" | "pencarian" }) {
  return (
    <article className="flex gap-3 rounded-lg border border-garis bg-kertas-1 p-3">
      <SiteLogo listingId={card.id} nama={card.nama} />
      <div className="min-w-0 flex-1">
        <a
          href={`/k/${card.id}?asal=${asal}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate font-display font-semibold text-tinta hover:text-merah-teks"
        >
          {card.nama}
        </a>
        {card.deskripsi && (
          <p className="mt-0.5 line-clamp-2 text-sm text-tinta-redup">{card.deskripsi}</p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-tinta-redup">
          {card.kategoriSlug && (
            <a href={`/kategori/${card.kategoriSlug}`} className="inline-flex items-center gap-1 hover:text-tinta">
              <KategoriIcon slug={card.kategoriSlug} className="size-3.5" />
              {card.kategoriNama}
            </a>
          )}
          <span>{card.klikTotal} klik</span>
          <a href={`/l/${card.id}`} className="hover:text-tinta">
            {copy.jelajah.lihatDetail}
          </a>
        </div>
      </div>
    </article>
  );
}
