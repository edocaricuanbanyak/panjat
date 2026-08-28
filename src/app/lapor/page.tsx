import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { PageShell } from "@/components/PageShell";
import { copy } from "@/copy";
import { db } from "@/db";
import { listing } from "@/db/schema";
import { LaporForm } from "./LaporForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: copy.lapor.metaTitle, robots: { index: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function LaporPage({ searchParams }: { searchParams: Promise<{ listing?: string }> }) {
  const { listing: id } = await searchParams;
  if (!id || !UUID.test(id)) notFound();
  const [l] = await db.select({ nama: listing.nama }).from(listing).where(eq(listing.id, id)).limit(1);
  if (!l) notFound();

  return (
    <PageShell>
      <h1
        className="font-display text-3xl font-bold text-tinta sm:text-4xl"
        style={{ fontStretch: "125%" }}
      >
        {copy.lapor.judul}
      </h1>
      <p className="mt-2 mb-6 max-w-md text-tinta-redup">{copy.lapor.intro(l.nama)}</p>
      <div className="max-w-md">
        <LaporForm listingId={id} />
      </div>
      <a href={`/l/${id}`} className="mt-6 inline-block text-sm text-tinta-redup hover:text-tinta">
        {copy.lapor.kembali}
      </a>
    </PageShell>
  );
}
