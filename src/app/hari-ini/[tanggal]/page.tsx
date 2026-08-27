import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HariIniBoard } from "@/components/HariIniBoard";
import { Nav } from "@/components/Nav";
import { db } from "@/db";
import { getPapanHariIni, wibDayWindow } from "@/domain/papan-hari-ini";

export const dynamic = "force-dynamic";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tanggal: string }>;
}): Promise<Metadata> {
  const { tanggal } = await params;
  return { title: `Papan Hari Ini ${tanggal} — Panjat` };
}

/** Archived day, recomputed from the immutable ledger — permanent & linkable (R7). */
export default async function ArsipHariIni({
  params,
}: {
  params: Promise<{ tanggal: string }>;
}) {
  const { tanggal } = await params;
  if (!DATE.test(tanggal)) notFound();

  const { start, end } = wibDayWindow(tanggal);
  const entries = await getPapanHariIni(db, start, end);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Nav active="hari-ini" />
      <p className="font-mono text-xs text-tinta-redup">Arsip</p>
      <h1 className="font-display text-2xl font-bold text-tinta" style={{ fontStretch: "120%" }}>
        Papan Hari Ini · {tanggal}
      </h1>
      <p className="mt-1 text-sm text-tinta-redup">
        Standings final hari itu, dihitung ulang dari ledger permanen.
      </p>
      <HariIniBoard entries={entries} />
      <a href="/hari-ini" className="mt-6 inline-block text-sm text-tinta-redup hover:text-tinta">
        ← Hari ini
      </a>
    </main>
  );
}
