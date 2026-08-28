import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { BoardTabs } from "@/components/BoardTabs";
import { JelajahCard } from "@/components/JelajahCard";
import { KategoriIcon } from "@/components/KategoriIcon";
import { SiteLogo } from "@/components/SiteLogo";
import { PageShell } from "@/components/PageShell";
import { copy } from "@/copy";
import { db } from "@/db";
import { kategori } from "@/db/schema";
import { categoryDirectory, KATEGORI_INTRO, parseSort, SORT_LABELS, type Sort } from "@/domain/jelajah";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [kat] = await db.select({ nama: kategori.nama }).from(kategori).where(eq(kategori.slug, slug)).limit(1);
  if (!kat) return { title: "Kategori — Panjat" };
  return {
    title: `${kat.nama} — Panjat`,
    description: KATEGORI_INTRO[slug] ?? `Direktori ${kat.nama} di Panjat.`,
  };
}

const SORTS: Sort[] = ["terbaru", "klik", "sorak"];

export default async function KategoriPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const [{ slug }, { sort }] = await Promise.all([params, searchParams]);
  const active = parseSort(sort);
  const dir = await categoryDirectory(db, slug, active);
  if (!dir) notFound();

  return (
    <PageShell>
      <BoardTabs active="jelajah" className="mb-5" />
      <h1
        className="flex items-center gap-2.5 font-display text-3xl font-bold text-tinta sm:text-4xl"
        style={{ fontStretch: "125%" }}
      >
        <KategoriIcon slug={slug} className="size-7 shrink-0 text-merah-teks sm:size-8" />
        {dir.kategori.nama}
      </h1>
      {dir.kategori.intro && <p className="mt-2 max-w-xl text-tinta-redup">{dir.kategori.intro}</p>}

      {dir.champion && (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-emas/50 bg-emas/8 p-3">
          <SiteLogo listingId={dir.champion.id} nama={dir.champion.nama} />
          <div className="min-w-0">
            <p className="font-mono text-xs text-tinta-redup">{copy.jelajah.juaraKategori}</p>
            <a
              href={`/k/${dir.champion.id}?asal=jelajah`}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate font-display font-semibold text-tinta hover:text-merah-teks"
            >
              {dir.champion.nama}
            </a>
          </div>
          <a href="/" className="ml-auto shrink-0 font-mono text-xs text-tinta-redup hover:text-tinta">
            {copy.jelajah.diPapan}
          </a>
        </div>
      )}

      {/* Explicit, visible ordering — no hidden "smart" sort (R22). */}
      <div className="mt-6 flex flex-wrap gap-2">
        {SORTS.map((s) => (
          <a
            key={s}
            href={`/kategori/${slug}?sort=${s}`}
            className={`inline-flex h-8 items-center rounded-full border px-3 text-xs ${
              s === active ? "border-tinta bg-tinta text-kertas-1" : "border-garis bg-kertas-1 text-tinta-redup"
            }`}
          >
            {SORT_LABELS[s]}
          </a>
        ))}
      </div>

      {dir.items.length === 0 ? (
        <p className="mt-6 text-sm text-tinta-redup">Belum ada listing di kategori ini.</p>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {dir.items.map((c) => (
            <JelajahCard key={c.id} card={c} asal="jelajah" />
          ))}
        </div>
      )}
    </PageShell>
  );
}
