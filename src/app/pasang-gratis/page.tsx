import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { Nav } from "@/components/Nav";
import { db } from "@/db";
import { kategori } from "@/db/schema";
import { PasangGratisForm } from "./PasangGratisForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pasang gratis — Panjat",
  description: "Pasang listing gratis di Kaki Tiang. Dapat Sorak dari pengunjung.",
};

export default async function PasangGratisPage() {
  const kats = await db
    .select({ slug: kategori.slug, nama: kategori.nama })
    .from(kategori)
    .orderBy(asc(kategori.nama));

  return (
    <main className="mx-auto w-full max-w-md px-4 py-8">
      <Nav active="papan" />
      <h1 className="font-display text-2xl font-bold text-tinta" style={{ fontStretch: "120%" }}>
        Pasang gratis
      </h1>
      <p className="mt-1 mb-4 text-sm text-tinta-redup">
        Listing gratis masuk Kaki Tiang di bawah listing berbayar, diurut Sorak pengunjung. Kapan
        pun bisa manjat ke papan berbayar.
      </p>
      <PasangGratisForm kategori={kats} />
      <a href="/" className="mt-6 inline-block text-sm text-tinta-redup hover:text-tinta">← Papan</a>
    </main>
  );
}
