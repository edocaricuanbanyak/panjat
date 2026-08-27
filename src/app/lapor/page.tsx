import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { PageShell } from "@/components/PageShell";
import { db } from "@/db";
import { listing } from "@/db/schema";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Laporkan / klaim — Panjat", robots: { index: false } };

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
        Laporkan / klaim
      </h1>
      <p className="mt-2 mb-4 max-w-md text-tinta-redup">
        Listing: <span className="text-tinta">{l.nama}</span>. Laporan diputus manusia. Pemilik sah URL
        berhak meminta penurunan listing atas URL-nya.
      </p>
      <form action="/api/lapor" method="post" className="flex max-w-md flex-col gap-3">
        <input type="hidden" name="listingId" value={id} />
        <label className="block">
          <span className="text-sm text-tinta-redup">Jenis</span>
          <select name="jenis" className="mt-1 h-11 w-full rounded-md border border-garis bg-kertas-1 px-3 text-base text-tinta">
            <option value="lapor">Laporkan konten bermasalah</option>
            <option value="klaim">Klaim: saya pemilik URL ini</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm text-tinta-redup">Pesan</span>
          <textarea name="pesan" rows={3} className="mt-1 w-full rounded-md border border-garis bg-kertas-1 p-2 text-base text-tinta" />
        </label>
        <label className="block">
          <span className="text-sm text-tinta-redup">Kontak kamu (untuk verifikasi klaim)</span>
          <input name="kontak" placeholder="email atau WA" className="mt-1 h-11 w-full rounded-md border border-garis bg-kertas-1 px-3 text-base text-tinta" />
        </label>
        <button className="h-11 rounded-md bg-merah px-4 text-sm font-medium text-kertas-1">Kirim</button>
      </form>
      <a href={`/l/${id}`} className="mt-6 inline-block text-sm text-tinta-redup hover:text-tinta">← Kembali</a>
    </PageShell>
  );
}
