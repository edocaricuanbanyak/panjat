import type { Metadata } from "next";
import { HariIniBoard } from "@/components/HariIniBoard";
import { Nav } from "@/components/Nav";
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
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Nav active="hari-ini" />
      <h1 className="font-display text-2xl font-bold text-tinta" style={{ fontStretch: "120%" }}>
        Papan Hari Ini
      </h1>
      <p className="mt-1 text-sm text-tinta-redup">
        Hanya pegangan yang dibayar sejak tengah malam. Uang kemarin tidak berlaku — siapa pun
        dengan Rp20.000 punya peluang jadi juara. Reset 00:00 WIB.
      </p>
      <HariIniBoard entries={entries} />
    </main>
  );
}
