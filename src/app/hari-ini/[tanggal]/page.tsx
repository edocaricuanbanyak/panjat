import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BoardTabs } from "@/components/BoardTabs";
import { HariIniBoard } from "@/components/HariIniBoard";
import { JsonLd } from "@/components/JsonLd";
import { PageShell } from "@/components/PageShell";
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
  return {
    title,
    description: `Standings final Papan Hari Ini ${tanggal} di Panjat — dihitung ulang dari ledger permanen.`,
    alternates: { canonical: `${BASE_URL}/hari-ini/${tanggal}` },
    openGraph: { type: "website", title },
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
  if (!DATE.test(tanggal) || Number.isNaN(new Date(`${tanggal}T00:00:00+07:00`).getTime())) {
    notFound();
  }

  const { start, end } = wibDayWindow(tanggal);
  const entries = await getPapanHariIni(db, start, end);

  return (
    <PageShell>
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
      <BoardTabs active="hari-ini" className="mb-5" />
      <p className="tabular text-xs text-tinta-redup">Arsip</p>
      <h1
        className="font-display text-3xl font-bold text-tinta sm:text-4xl"
        style={{ fontStretch: "125%" }}
      >
        Papan Hari Ini · {tanggal}
      </h1>
      <p className="mt-2 text-tinta-redup">
        Standings final hari itu, dihitung ulang dari ledger permanen.
      </p>
      <HariIniBoard entries={entries} />
      <a href="/hari-ini" className="mt-6 inline-block text-sm text-tinta-redup hover:text-tinta">
        ← Hari ini
      </a>
    </PageShell>
  );
}
