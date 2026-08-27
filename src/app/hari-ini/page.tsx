import type { Metadata } from "next";
import { BoardTabs } from "@/components/BoardTabs";
import { HariIniBoard } from "@/components/HariIniBoard";
import { PageShell } from "@/components/PageShell";
import { copy } from "@/copy";
import { db } from "@/db";
import { getHariIni } from "@/domain/papan-hari-ini";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: copy.hariIni.metaTitle,
  description: copy.hariIni.metaDesc,
};

export default async function HariIniPage() {
  const entries = await getHariIni(db, new Date());
  return (
    <PageShell>
      <BoardTabs active="hari-ini" className="mb-5" />
      <p className="max-w-xl text-tinta-redup">{copy.hariIni.sub}</p>
      <HariIniBoard entries={entries} />
    </PageShell>
  );
}
