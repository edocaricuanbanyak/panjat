import type { Metadata } from "next";
import { Suspense } from "react";
import { BoardTabs } from "@/components/BoardTabs";
import { HariIniBoard } from "@/components/HariIniBoard";
import { JsonLd } from "@/components/JsonLd";
import { PageShell } from "@/components/PageShell";
import { ListRowsSkeleton } from "@/components/Skeleton";
import { copy } from "@/copy";
import { db } from "@/db";
import { getHariIni, wibDate } from "@/domain/papan-hari-ini";
import { boardItemListJsonLd } from "@/lib/jsonld";
import { BASE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  // Point the share card at today's WIB board (recomputed per request).
  const image = {
    url: `${BASE_URL}/api/og/hari-ini/${wibDate(new Date())}`,
    width: 1200,
    height: 630,
    alt: copy.hariIni.metaTitle,
  };
  return {
    title: copy.hariIni.metaTitle,
    description: copy.hariIni.metaDesc,
    alternates: { canonical: `${BASE_URL}/hari-ini` },
    openGraph: { type: "website", title: copy.hariIni.metaTitle, description: copy.hariIni.metaDesc, images: [image] },
    twitter: { card: "summary_large_image", title: copy.hariIni.metaTitle, description: copy.hariIni.metaDesc, images: [image] },
  };
}

// This page has no notFound(), but a route-level loading.tsx here would ALSO wrap
// the /hari-ini/[tanggal] child (which DOES notFound) and soft-404 it. So the
// skeleton lives in an in-page Suspense instead, scoped to just the board list.
export default function HariIniPage() {
  return (
    <PageShell>
      <BoardTabs active="hari-ini" className="mb-5" />
      <Suspense fallback={<ListRowsSkeleton n={10} />}>
        <HariIniList />
      </Suspense>
    </PageShell>
  );
}

async function HariIniList() {
  const entries = await getHariIni(db, new Date());
  return (
    <>
      {/* Today's board is money-ranked (payments since 00:00 WIB), so a
          descending ItemList mirrors the on-page order (R7). */}
      {entries.length > 0 && <JsonLd data={boardItemListJsonLd(copy.hariIni.metaTitle, entries)} />}
      <HariIniBoard entries={entries} />
    </>
  );
}
