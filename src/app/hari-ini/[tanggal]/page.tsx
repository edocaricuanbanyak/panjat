import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BoardTabs } from "@/components/BoardTabs";
import { HariIniBoard } from "@/components/HariIniBoard";
import { JsonLd } from "@/components/JsonLd";
import { PageShell } from "@/components/PageShell";
import { ListRowsSkeleton } from "@/components/Skeleton";
import { copy } from "@/copy";
import { db } from "@/db";
import { getPapanHariIni, wibDayWindow } from "@/domain/papan-hari-ini";
import { boardItemListJsonLd, breadcrumbJsonLd } from "@/lib/jsonld";
import { BASE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tanggal: string }>;
}): Promise<Metadata> {
  const { tanggal } = await params;
  const title = `Papan Hari Ini ${tanggal} — ${copy.merek.nama}`;
  const description = `Standings final Papan Hari Ini ${tanggal} di Panjat — dihitung ulang dari ledger permanen.`;
  const image = {
    url: `${BASE_URL}/api/og/hari-ini/${tanggal}`,
    width: 1200,
    height: 630,
    alt: `Papan Hari Ini ${tanggal} di Panjat`,
  };
  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/hari-ini/${tanggal}` },
    openGraph: { type: "website", title, description, images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

/** Archived day, recomputed from the immutable ledger — permanent & linkable (R7). */
export default async function ArsipHariIni({
  params,
}: {
  params: Promise<{ tanggal: string }>;
}) {
  const { tanggal } = await params;
  // Guard the format AND that it's a real calendar date — "9999-99-99" passes the
  // regex but would otherwise crash the day-window math (500 → should be 404).
  // This runs BEFORE any streaming, so a bad date is a real 404, not a soft-404.
  if (!DATE.test(tanggal) || Number.isNaN(new Date(`${tanggal}T00:00:00+07:00`).getTime())) {
    notFound();
  }

  return (
    <PageShell>
      <BoardTabs active="hari-ini" className="mb-5" />
      <p className="tabular text-xs text-tinta-redup">Arsip</p>
      <h1 className="display-lg">Papan Hari Ini · {tanggal}</h1>
      <p className="mt-2 text-tinta-redup">
        Standings final hari itu, dihitung ulang dari ledger permanen.
      </p>
      {/* The header renders instantly; the recomputed board (a heavier ledger
          scan) streams in behind a skeleton. No notFound() lives past this
          point, so streaming can't soft-404. */}
      <Suspense fallback={<ListRowsSkeleton n={10} />}>
        <ArsipBoard tanggal={tanggal} />
      </Suspense>
      <a href="/hari-ini" className="mt-6 inline-block text-sm text-tinta-redup hover:text-tinta">
        ← Hari ini
      </a>
    </PageShell>
  );
}

async function ArsipBoard({ tanggal }: { tanggal: string }) {
  const { start, end } = wibDayWindow(tanggal);
  const entries = await getPapanHariIni(db, start, end);
  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: copy.nav.beranda, path: "/" },
            { name: copy.nav.hariIni, path: "/hari-ini" },
            { name: tanggal, path: `/hari-ini/${tanggal}` },
          ]),
          ...(entries.length > 0
            ? [boardItemListJsonLd(`Papan Hari Ini ${tanggal} — ${copy.merek.nama}`, entries)]
            : []),
        ]}
      />
      <HariIniBoard entries={entries} />
    </>
  );
}
