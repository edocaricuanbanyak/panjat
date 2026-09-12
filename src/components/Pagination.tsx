import { copy } from "@/copy";

/** Minimal board pagination: prev/next + "Halaman X / Y" (R1 — board only). */
export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null;

  // Always carry ?hal (even page 1) so paginating keeps the "All time" tab
  // selected — the home tab defaults to "Hari Ini" when the URL is bare (/).
  const href = (p: number) => `/?hal=${p}`;
  const btn =
    "rounded-lg border border-garis bg-kertas-1 px-3 py-1.5 shadow-kartu transition hover:bg-kertas-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-merah";
  const off = "rounded-lg px-3 py-1.5 text-tinta-redup/40";

  return (
    <nav className="mt-8 flex items-center justify-center gap-4 text-sm">
      {page > 1 ? (
        <a href={href(page - 1)} className={btn}>
          {copy.papan.sebelumnya}
        </a>
      ) : (
        <span className={off}>{copy.papan.sebelumnya}</span>
      )}
      <span className="font-sans tabular text-tinta-redup">
        {copy.papan.pagination(page, totalPages)}
      </span>
      {page < totalPages ? (
        <a href={href(page + 1)} className={btn}>
          {copy.papan.berikutnya}
        </a>
      ) : (
        <span className={off}>{copy.papan.berikutnya}</span>
      )}
    </nav>
  );
}
