import { Footer } from "./Footer";
import { ManjatProvider } from "./ManjatModal";
import { SiteHeader } from "./SiteHeader";

type Kategori = { slug: string; nama: string };

/**
 * One page frame for the whole app: consistent container, header, footer. Pass
 * `manjatKategori` to make the Manjat/Salip modal available on this page (header
 * button + any triggers inside); without it, those buttons fall back to /manjat.
 */
export function PageShell({
  manjatKategori,
  children,
}: {
  manjatKategori?: Kategori[];
  children: React.ReactNode;
}) {
  const inner = (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-2 sm:py-4">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <Footer />
    </main>
  );
  return manjatKategori ? (
    <ManjatProvider kategori={manjatKategori}>{inner}</ManjatProvider>
  ) : (
    inner
  );
}
