import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { LogoTile } from "@/components/LogoTile";
import { PageShell } from "@/components/PageShell";
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
    <PageShell>
      <h1
        className="font-display text-3xl font-bold text-tinta sm:text-4xl"
        style={{ fontStretch: "125%" }}
      >
        Arsip Juara
      </h1>
      <p className="mt-2 max-w-xl text-tinta-redup">
        Posisi disewa, tapi sejarah permanen. Setiap juara harian tersimpan selamanya.
      </p>

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-tinta-redup">Belum ada juara yang diarsipkan.</p>
      ) : (
        <ul className="mt-6 divide-y divide-garis">
          {rows.map((r) => (
            <li key={r.tanggal}>
              <a
                href={`/hari-ini/${r.tanggal}`}
                className="flex items-center gap-3 py-3 hover:text-merah-teks"
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
    </PageShell>
  );
}
