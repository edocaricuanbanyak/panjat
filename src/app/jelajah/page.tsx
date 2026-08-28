import type { Metadata } from "next";
import { BoardTabs } from "@/components/BoardTabs";
import { JelajahCard } from "@/components/JelajahCard";
import { PageShell } from "@/components/PageShell";
import { db } from "@/db";
import { listCategories, searchListings } from "@/domain/jelajah";

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
  const [results, cats] = await Promise.all([
    query ? searchListings(db, query) : Promise.resolve([]),
    listCategories(db),
  ]);

  return (
    <PageShell>
      <BoardTabs active="jelajah" className="mb-5" />

      <form action="/jelajah" method="get" className="flex gap-2">
        <input
          name="q"
          defaultValue={query}
          placeholder="cari AI tools, jasa, game…"
          className="h-11 flex-1 rounded-lg border border-garis bg-kertas-1 px-3.5 text-base text-tinta shadow-kartu focus-visible:border-merah focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-merah/25"
        />
        <button className="h-11 rounded-lg bg-merah px-5 text-sm font-display font-semibold text-kertas-1 shadow-kartu transition-all ease-panjat hover:-translate-y-px hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-merah">
          Cari
        </button>
      </form>

      {query ? (
        results.length === 0 ? (
          <p className="mt-6 text-sm text-tinta-redup">Tidak ada hasil untuk “{query}”.</p>
        ) : (
          <div className="mt-6 flex flex-col gap-2">
            {results.map((c) => (
              <JelajahCard key={c.id} card={c} asal="pencarian" />
            ))}
          </div>
        )
      ) : (
        <div className="mt-8">
          <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-tinta-redup">
            Jelajahi per kategori
          </h2>
          <div className="flex flex-wrap gap-2">
            {cats.map((k) => (
              <a
                key={k.slug}
                href={`/kategori/${k.slug}`}
                className="inline-flex h-8 items-center rounded-full border border-garis bg-kertas-1 px-3 text-sm text-tinta-redup hover:bg-kertas-2"
              >
                {k.nama}
              </a>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}
