import type { JelajahCard as Card } from "@/domain/jelajah";
import { LogoTile } from "./LogoTile";

/**
 * Directory card for Jelajah/category surfaces. Always offers a way back to the
 * board ("di papan") — Jelajah feeds the board, never replaces it (R22).
 */
export function JelajahCard({ card, asal }: { card: Card; asal: "jelajah" | "pencarian" }) {
  return (
    <article className="flex gap-3 rounded-lg border border-garis bg-kertas-1 p-3">
      <LogoTile nama={card.nama} />
      <div className="min-w-0 flex-1">
        <a
          href={`/k/${card.id}?asal=${asal}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate font-display font-semibold text-tinta hover:text-merah"
        >
          {card.nama}
        </a>
        {card.deskripsi && (
          <p className="mt-0.5 line-clamp-2 text-sm text-tinta-redup">{card.deskripsi}</p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-tinta-redup">
          {card.kategoriSlug && (
            <a href={`/kategori/${card.kategoriSlug}`} className="hover:text-tinta">
              {card.kategoriNama}
            </a>
          )}
          <span>{card.klikTotal} klik</span>
          <a href={`/?f=${card.id}`} className="hover:text-tinta">
            di papan →
          </a>
        </div>
      </div>
    </article>
  );
}
