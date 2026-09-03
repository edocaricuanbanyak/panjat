import { copy } from "@/copy";
import { db } from "@/db";
import { listCategories } from "@/domain/jelajah";
import { recentAktivitas } from "@/lib/aktivitas";
import { Footer } from "./Footer";
import { ManjatProvider } from "./ManjatModal";
import { SiteHeader } from "./SiteHeader";
import { Spotlight } from "./Spotlight";

type Kategori = { slug: string; nama: string };

/**
 * One page frame for the whole app: consistent container, a sticky glass top
 * region (the live Aktivitas ticker + header), footer, AND the Manjat/Salip modal
 * on every page (so the header action opens the modal everywhere, not just home).
 * The ticker runs above the header on every page. Pass `manjatKategori` to reuse a
 * category list the page already fetched; otherwise the shell fetches it.
 */
export async function PageShell({
  manjatKategori,
  padBottomMobile = false,
  children,
}: {
  manjatKategori?: Kategori[];
  /** Reserve extra bottom space on mobile for a floating bar (home board toggle). */
  padBottomMobile?: boolean;
  children: React.ReactNode;
}) {
  const [kats, aktivitas] = await Promise.all([
    manjatKategori ? Promise.resolve(manjatKategori) : listCategories(db),
    recentAktivitas(20),
  ]);
  const pbMobile = padBottomMobile
    ? "pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:pb-[calc(1rem+env(safe-area-inset-bottom))]"
    : "pb-[calc(1rem+env(safe-area-inset-bottom))]";
  return (
    <ManjatProvider kategori={kats}>
      <main
        className={`mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pt-2 sm:px-5 sm:pt-4 ${pbMobile}`}
      >
        <a
          href="#isi"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:border focus:border-garis focus:bg-kertas-1 focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-tinta focus:shadow-naik focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-merah"
        >
          {copy.sistem.lompatKeIsi}
        </a>
        <div className="sticky top-0 z-30 -mx-4 border-b border-garis/70 bg-kertas px-4 pt-[env(safe-area-inset-top)] sm:-mx-5 sm:px-5">
          <Spotlight initialItems={aktivitas} />
          <SiteHeader />
        </div>
        <div id="isi" tabIndex={-1} className="flex-1 pt-4 focus:outline-none">
          {children}
        </div>
        <Footer />
      </main>
    </ManjatProvider>
  );
}
