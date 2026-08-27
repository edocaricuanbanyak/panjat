import type { KakiTiangEntry } from "@/domain/sorak";
import { LogoTile } from "./LogoTile";

/**
 * Kaki Tiang — the free (Rp0) tier below all paid listings, ordered by Sorak
 * (R16). Visitors give 3 free Sorak/day; the most-cheered rise. A gentle door
 * to a first payment.
 */
export function KakiTiang({ entries, remaining }: { entries: KakiTiangEntry[]; remaining: number }) {
  return (
    <section id="kaki-tiang" className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-tinta">Kaki Tiang</h2>
        <span className="font-mono text-xs text-tinta-redup">{remaining} sorak tersisa hari ini</span>
      </div>
      <p className="mt-1 text-xs text-tinta-redup">
        Listing gratis. Beri Sorak untuk yang bagus — yang paling disoraki naik di sini.
      </p>

      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-tinta-redup">Belum ada yang manjat. Tiangnya masih kinclong.</p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {entries.map((e) => (
            <article key={e.id} className="flex items-center gap-3 rounded-lg border border-garis bg-kertas-2 p-3">
              <LogoTile nama={e.nama} />
              <div className="min-w-0 flex-1">
                <a
                  href={`/k/${e.id}?asal=papan`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate font-display font-semibold text-tinta hover:text-merah"
                >
                  {e.nama}
                </a>
                {e.deskripsi && <p className="truncate text-xs text-tinta-redup">{e.deskripsi}</p>}
              </div>
              <span className="font-mono tabular text-xs text-tinta-redup">{e.sorak} sorak</span>
              <form action="/api/sorak" method="post">
                <input type="hidden" name="listingId" value={e.id} />
                <button
                  disabled={remaining <= 0}
                  className="h-9 rounded-md border border-garis bg-kertas-1 px-3 text-sm text-tinta hover:bg-kertas-2 disabled:opacity-50"
                >
                  Sorak
                </button>
              </form>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
