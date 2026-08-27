import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { PageShell } from "@/components/PageShell";
import { copy } from "@/copy";
import { db } from "@/db";
import { listing } from "@/db/schema";

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
      <p className="mt-2 mb-4 max-w-md text-tinta-redup">{copy.lapor.intro(l.nama)}</p>
      <form action="/api/lapor" method="post" className="flex max-w-md flex-col gap-3">
        <input type="hidden" name="listingId" value={id} />
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-tinta-redup">{copy.lapor.jenis}</span>
          <select name="jenis" className="h-11 w-full rounded-lg border border-garis bg-kertas-1 px-3.5 text-base text-tinta shadow-kartu focus-visible:border-merah focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-merah/25">
            <option value="lapor">{copy.lapor.jenisLapor}</option>
            <option value="klaim">{copy.lapor.jenisKlaim}</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-tinta-redup">{copy.lapor.pesan}</span>
          <textarea name="pesan" rows={3} className="w-full rounded-lg border border-garis bg-kertas-1 p-2.5 text-base text-tinta shadow-kartu focus-visible:border-merah focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-merah/25" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-tinta-redup">{copy.lapor.kontak}</span>
          <input name="kontak" placeholder={copy.lapor.kontakPlaceholder} className="h-11 w-full rounded-lg border border-garis bg-kertas-1 px-3.5 text-base text-tinta shadow-kartu focus-visible:border-merah focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-merah/25" />
        </label>
        <button className="h-11 rounded-lg bg-merah px-5 text-sm font-medium text-kertas-1 shadow-kartu transition-all ease-panjat hover:-translate-y-px hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-merah">{copy.lapor.kirim}</button>
      </form>
      <a href={`/l/${id}`} className="mt-6 inline-block text-sm text-tinta-redup hover:text-tinta">{copy.lapor.kembali}</a>
    </PageShell>
  );
}
