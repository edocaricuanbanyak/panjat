import { copy } from "@/copy";
import { KategoriIcon } from "./KategoriIcon";

type Kategori = { slug: string; nama: string };

/** Site footer — a category directory (internal links, R22/SEO) + honesty links (R9). */
export function Footer({ kategori = [] }: { kategori?: Kategori[] }) {
  return (
    <footer className="mt-14 border-t border-garis pt-5 text-xs">
      {kategori.length > 0 && (
        <nav className="mb-4 flex flex-wrap gap-x-3 gap-y-2">
          {kategori.map((k) => (
            <a
              key={k.slug}
              href={`/kategori/${k.slug}`}
              className="inline-flex items-center gap-1 text-tinta-redup hover:text-tinta"
            >
              <KategoriIcon slug={k.slug} className="size-3.5" />
              {k.nama}
            </a>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-display font-semibold text-tinta" style={{ fontStretch: "115%" }}>
          {copy.merek.nama}
        </span>
        {copy.footer.map(([href, label]) => (
          <a key={href} href={href} className="text-tinta-redup hover:text-tinta">
            {label}
          </a>
        ))}
      </div>
    </footer>
  );
}
