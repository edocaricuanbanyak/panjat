import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { Nav } from "@/components/Nav";
import { db } from "@/db";
import { kategori } from "@/db/schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pasang gratis — Panjat",
  description: "Pasang listing gratis di Kaki Tiang. Dapat Sorak dari pengunjung.",
};

const ERR: Record<string, string> = {
  wajib: "URL dan email wajib diisi.",
  ada: "URL ini sudah terdaftar.",
  limit: "Terlalu banyak listing gratis dari kamu. Coba lagi nanti.",
  gagal: "Gagal memproses. Coba lagi.",
};

export default async function PasangGratisPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const [{ e }, kats] = await Promise.all([
    searchParams,
    db.select({ slug: kategori.slug, nama: kategori.nama }).from(kategori).orderBy(asc(kategori.nama)),
  ]);

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
      {e && ERR[e] && (
        <p className="mb-4 rounded-md border border-merah/40 bg-merah/10 px-3 py-2 text-sm text-merah">
          {ERR[e]}
        </p>
      )}

      <form action="/api/pasang-gratis" method="post" className="flex flex-col gap-3">
        <label className="block">
          <span className="text-sm text-tinta-redup">URL atau @username</span>
          <input name="url" required placeholder="produkku.id" className="mt-1 h-11 w-full rounded-md border border-garis bg-kertas-1 px-3 text-base text-tinta" />
        </label>
        <label className="block">
          <span className="text-sm text-tinta-redup">Nama listing</span>
          <input name="nama" placeholder="Produkku" className="mt-1 h-11 w-full rounded-md border border-garis bg-kertas-1 px-3 text-base text-tinta" />
        </label>
        <label className="block">
          <span className="text-sm text-tinta-redup">Email</span>
          <input name="email" type="email" required placeholder="kamu@email.com" className="mt-1 h-11 w-full rounded-md border border-garis bg-kertas-1 px-3 text-base text-tinta" />
        </label>
        <label className="block">
          <span className="text-sm text-tinta-redup">Deskripsi (opsional, 160 kar.)</span>
          <textarea name="deskripsi" maxLength={160} rows={2} className="mt-1 w-full rounded-md border border-garis bg-kertas-1 p-2 text-base text-tinta" />
        </label>
        <label className="block">
          <span className="text-sm text-tinta-redup">Kategori (opsional)</span>
          <select name="kategoriSlug" className="mt-1 h-11 w-full rounded-md border border-garis bg-kertas-1 px-3 text-base text-tinta">
            <option value="">—</option>
            {kats.map((k) => (
              <option key={k.slug} value={k.slug}>{k.nama}</option>
            ))}
          </select>
        </label>
        <button className="h-11 rounded-md bg-merah px-4 text-sm font-medium text-kertas-1">
          Pasang di Kaki Tiang
        </button>
      </form>
      <a href="/" className="mt-6 inline-block text-sm text-tinta-redup hover:text-tinta">← Papan</a>
    </main>
  );
}
