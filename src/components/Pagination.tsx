/** Minimal board pagination: prev/next + "Halaman X / Y" (R1 — board only). */
export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null;

  const href = (p: number) => (p <= 1 ? "/" : `/?hal=${p}`);
  const btn =
    "rounded-lg border border-garis bg-kertas-1 px-3 py-1.5 shadow-kartu transition hover:bg-kertas-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-merah";
  const off = "rounded-lg px-3 py-1.5 text-tinta-redup/40";

  return (
    <nav className="mt-8 flex items-center justify-center gap-4 text-sm">
      {page > 1 ? (
        <a href={href(page - 1)} className={btn}>
          ← Sebelumnya
        </a>
      ) : (
        <span className={off}>← Sebelumnya</span>
      )}
      <span className="font-sans tabular text-tinta-redup">
        Halaman {page} / {totalPages}
      </span>
      {page < totalPages ? (
        <a href={href(page + 1)} className={btn}>
          Berikutnya →
        </a>
      ) : (
        <span className={off}>Berikutnya →</span>
      )}
    </nav>
  );
}
