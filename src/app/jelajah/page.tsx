import type { Metadata } from "next";
import { EmptyState } from "@/components/EmptyState";
import { JelajahCard } from "@/components/JelajahCard";
import { JelajahSearch } from "@/components/JelajahSearch";
import { KategoriIcon } from "@/components/KategoriIcon";
import { PageShell } from "@/components/PageShell";
import { TrackJelajahSearch } from "@/components/TrackJelajahSearch";
import { copy } from "@/copy";
import { db } from "@/db";
import { jelajahAll, listCategories, searchListings } from "@/domain/jelajah";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jelajah — Panjat",
  description: "Cari produk, tools, dan jasa buatan Indonesia di Panjat.",
};

export default async function JelajahPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  // Search runs server-side through Postgres FTS (relevance-ranked); the empty
  // state falls back to the full directory ordered by clicks (visitor-chosen,
  // never money — R22). Both are SSR, so every query is crawlable/shareable.
  const [items, cats] = await Promise.all([
    query ? searchListings(db, query) : jelajahAll(db),
    listCategories(db),
  ]);
  const browse = items.slice().sort((a, b) => b.klikTotal - a.klikTotal);
  const results = query ? items : browse;
  const asal = query ? ("pencarian" as const) : ("jelajah" as const);

  return (
    <PageShell>
      {query && <TrackJelajahSearch query={query} jumlah={results.length} />}
      {/* Search + category chips stick just under the app header, matching the
          old in-place panel. Chips link to the dedicated (crawlable) category
          pages rather than filtering in place. */}
      <div className="sticky top-[77px] z-20 -mx-4 border-b border-garis/70 bg-kertas px-4 pb-3 pt-2 sm:top-[85px] sm:-mx-5 sm:px-5">
        <JelajahSearch initialQuery={query} />
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          <span className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-merah bg-merah px-3 text-sm text-kertas-1">
            <KategoriIcon slug={null} className="size-3.5" />
            {copy.jelajah.semua}
          </span>
          {cats.map((k) => (
            <a
              key={k.slug}
              href={`/kategori/${k.slug}`}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-garis bg-kertas-1 px-3 text-sm text-tinta-redup transition hover:bg-kertas-2"
            >
              <KategoriIcon slug={k.slug} className="size-3.5" />
              {k.nama}
            </a>
          ))}
        </div>
      </div>

      <p className="mt-4 tabular text-xs text-tinta-redup">
        {query ? copy.jelajah.hasil(results.length, query) : copy.jelajah.semuaListing(results.length)}
      </p>

      {results.length === 0 ? (
        <EmptyState compact message={query ? copy.jelajah.kosongCari(query) : copy.jelajah.kosong} />
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {results.map((c) => (
            <JelajahCard key={c.id} card={c} asal={asal} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
