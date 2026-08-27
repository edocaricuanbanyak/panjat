/** Reports & URL-ownership claims (R8, §18.6). Decided by a human in /admin. */
import { desc, eq } from "drizzle-orm";
import type { Database } from "@/db";
import { laporan, listing } from "@/db/schema";

export async function createLaporan(
  db: Database,
  input: { listingId: string; jenis: "lapor" | "klaim"; pesan?: string; kontak?: string },
): Promise<void> {
  await db.insert(laporan).values({
    listingId: input.listingId,
    jenis: input.jenis,
    pesan: input.pesan ?? null,
    kontak: input.kontak ?? null,
  });
}

export interface LaporanItem {
  id: string;
  listingId: string;
  nama: string;
  urlNormal: string;
  jenis: string;
  pesan: string | null;
  kontak: string | null;
}

export async function getLaporanTerbuka(db: Database): Promise<LaporanItem[]> {
  return db
    .select({
      id: laporan.id,
      listingId: laporan.listingId,
      nama: listing.nama,
      urlNormal: listing.urlNormal,
      jenis: laporan.jenis,
      pesan: laporan.pesan,
      kontak: laporan.kontak,
    })
    .from(laporan)
    .innerJoin(listing, eq(listing.id, laporan.listingId))
    .where(eq(laporan.status, "baru"))
    .orderBy(desc(laporan.createdAt))
    .limit(50);
}

export async function tutupLaporan(db: Database, id: string): Promise<void> {
  await db.update(laporan).set({ status: "ditutup" }).where(eq(laporan.id, id));
}
