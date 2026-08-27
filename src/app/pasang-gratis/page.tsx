import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { PageShell } from "@/components/PageShell";
import { db } from "@/db";
import { kategori } from "@/db/schema";
import { PasangGratisForm } from "./PasangGratisForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pasang gratis — Panjat",
  description: "Pasang listing gratis di Kaki Tiang. Dapat dukungan dari pengunjung.",
};

export default async function PasangGratisPage() {
  const kats = await db
    .select({ slug: kategori.slug, nama: kategori.nama })
    .from(kategori)
    .orderBy(asc(kategori.nama));

  return (
    <PageShell>
      <h1
        className="font-display text-3xl font-bold text-tinta sm:text-4xl"
        style={{ fontStretch: "125%" }}
      >
        Pasang gratis
      </h1>
      <p className="mt-2 mb-6 max-w-xl text-tinta-redup">
        Listing gratis masuk Kaki Tiang di bawah listing berbayar, diurut dukungan pengunjung. Kapan
        pun bisa manjat ke papan berbayar.
      </p>
      <div className="max-w-md">
        <PasangGratisForm kategori={kats} />
      </div>
      <a href="/" className="mt-6 inline-block text-sm text-tinta-redup hover:text-tinta">← Papan</a>
    </PageShell>
  );
}
