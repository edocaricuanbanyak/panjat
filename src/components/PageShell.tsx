import { db } from "@/db";
import { listCategories } from "@/domain/jelajah";
import { Footer } from "./Footer";
import { ManjatProvider } from "./ManjatModal";
import { SiteHeader } from "./SiteHeader";

type Kategori = { slug: string; nama: string };

/**
 * One page frame for the whole app: consistent container, a sticky glass top
 * region (optional running topbar + header), footer, AND the Manjat/Salip modal
 * on every page (so the header action opens the modal everywhere, not just home).
 * Pass `manjatKategori` to reuse a category list the page already fetched;
 * otherwise the shell fetches it. `topbar` renders a strip (e.g. the Spotlight
 * ticker) above the header inside the sticky region.
 */
export async function PageShell({
  manjatKategori,
  topbar,
  children,
}: {
  manjatKategori?: Kategori[];
  topbar?: React.ReactNode;
  children: React.ReactNode;
}) {
  const kats = manjatKategori ?? (await listCategories(db));
  return (
    <ManjatProvider kategori={kats}>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-2 sm:py-4">
        <div className="sticky top-0 z-30 -mx-5 border-b border-garis/70 px-5 kaca-header">
          {topbar}
          <SiteHeader />
        </div>
        <div className="flex-1 pt-4">{children}</div>
        <Footer />
      </main>
    </ManjatProvider>
  );
}
