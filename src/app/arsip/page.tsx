import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { Footer } from "@/components/Footer";
import { LogoTile } from "@/components/LogoTile";
import { Nav } from "@/components/Nav";
import { db } from "@/db";
import { juaraHarian, listing } from "@/db/schema";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Arsip Juara — Panjat",
  description: "Setiap juara harian, tersimpan permanen.",
};

export default async function ArsipPage() {
  const rows = await db
    .select({ tanggal: juaraHarian.tanggal, id: listing.id, nama: listing.nama })
    .from(juaraHarian)
    .innerJoin(listing, eq(listing.id, juaraHarian.listingId))
    .orderBy(desc(juaraHarian.tanggal))
    .limit(90);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <Nav active="hari-ini" />
      <h1 className="font-display text-2xl font-bold text-tinta" style={{ fontStretch: "120%" }}>
        Arsip Juara
      </h1>
      <p className="mt-1 text-sm text-tinta-redup">
        Posisi disewa, tapi sejarah permanen. Setiap juara harian tersimpan selamanya.
      </p>

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-tinta-redup">Belum ada juara yang diarsipkan.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {rows.map((r) => (
            <li key={r.tanggal}>
              <a
                href={`/hari-ini/${r.tanggal}`}
                className="flex items-center gap-3 rounded-lg border border-garis bg-kertas-1 p-3 hover:bg-kertas-2"
              >
                <LogoTile nama={r.nama} />
                <div className="min-w-0">
                  <span className="block truncate font-display font-semibold text-tinta">{r.nama}</span>
                  <span className="font-mono text-xs text-tinta-redup">{r.tanggal}</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}

      <Footer />
    </main>
  );
}
