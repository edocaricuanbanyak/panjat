import { Footer } from "./Footer";
import { ManjatProvider } from "./ManjatModal";
import { SiteHeader } from "./SiteHeader";

type Kategori = { slug: string; nama: string };

/**
 * One page frame for the whole app: consistent container, a sticky glass top
 * region (optional running topbar + header), and footer. Pass `manjatKategori`
 * to make the Manjat/Salip modal available on this page; `topbar` renders a
 * strip (e.g. the Spotlight ticker) above the header inside the sticky region.
 */
export function PageShell({
  manjatKategori,
  topbar,
  children,
}: {
  manjatKategori?: Kategori[];
  topbar?: React.ReactNode;
  children: React.ReactNode;
}) {
  const inner = (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-2 sm:py-4">
      <div className="sticky top-0 z-30 -mx-5 border-b border-garis/70 px-5 kaca-header">
        {topbar}
        <SiteHeader />
      </div>
      <div className="flex-1 pt-4">{children}</div>
      <Footer />
    </main>
  );
  return manjatKategori ? (
    <ManjatProvider kategori={manjatKategori}>{inner}</ManjatProvider>
  ) : (
    inner
  );
}
