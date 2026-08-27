import type { Metadata } from "next";
import { BoardTabs } from "@/components/BoardTabs";
import { HariIniBoard } from "@/components/HariIniBoard";
import { PageShell } from "@/components/PageShell";
import { db } from "@/db";
import { getHariIni } from "@/domain/papan-hari-ini";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Papan Hari Ini — Panjat",
  description: "Papan yang reset tiap tengah malam WIB. Siapa pun bisa juara hari ini.",
};

export default async function HariIniPage() {
  const entries = await getHariIni(db, new Date());
  return (
    <PageShell>
      <BoardTabs active="hari-ini" className="mb-5" />
      <p className="max-w-xl text-tinta-redup">
        Hanya pegangan yang dibayar sejak tengah malam. Uang kemarin tidak berlaku — siapa pun
        dengan Rp20.000 punya peluang jadi juara. Reset 00:00 WIB.
      </p>
      <HariIniBoard entries={entries} />
    </PageShell>
  );
}
