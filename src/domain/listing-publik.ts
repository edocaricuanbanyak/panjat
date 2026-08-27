/**
 * Public listing page read model (R20-d) — SEO landing + share target. Ordered
 * from first-party data; "Serupa di kategori ini" feeds discovery back into the
 * board (R22).
 */
import { and, desc, eq, ne } from "drizzle-orm";
import type { Database } from "@/db";
import { kategori, listing, posisiSnapshot } from "@/db/schema";
import { badgesFor } from "./lencana";
import { getMomenForListing } from "./momen";

export interface ListingPublik {
  id: string;
  nama: string;
  deskripsi: string | null;
  urlNormal: string;
  kategoriNama: string | null;
  kategoriSlug: string | null;
  pegangan: number;
  rank: number | null;
  screenshotUrl: string | null;
  badges: string[];
  riwayat: { jam: Date; rank: number }[];
  serupa: { id: string; nama: string; deskripsi: string | null }[];
}

export async function getListingPublik(db: Database, id: string): Promise<ListingPublik | null> {
  const [l] = await db
    .select({
      id: listing.id,
      nama: listing.nama,
      deskripsi: listing.deskripsi,
      urlNormal: listing.urlNormal,
      status: listing.status,
      pegangan: listing.peganganCached,
      screenshotUrl: listing.screenshotUrl,
      kategoriId: listing.kategoriId,
      kategoriNama: kategori.nama,
      kategoriSlug: kategori.slug,
    })
    .from(listing)
    .leftJoin(kategori, eq(kategori.id, listing.kategoriId))
    .where(eq(listing.id, id))
    .limit(1);
  if (!l || l.status !== "tayang") return null;

  const [momen, badges, riwayat, serupa] = await Promise.all([
    getMomenForListing(db, id),
    badgesFor(db, [id]),
    db
      .select({ jam: posisiSnapshot.jam, rank: posisiSnapshot.rank })
      .from(posisiSnapshot)
      .where(eq(posisiSnapshot.listingId, id))
      .orderBy(desc(posisiSnapshot.jam))
      .limit(14),
    l.kategoriId
      ? db
          .select({ id: listing.id, nama: listing.nama, deskripsi: listing.deskripsi })
          .from(listing)
          .where(and(eq(listing.status, "tayang"), eq(listing.kategoriId, l.kategoriId), ne(listing.id, id)))
          .orderBy(desc(listing.createdAt))
          .limit(4)
      : Promise.resolve([]),
  ]);

  return {
    id: l.id,
    nama: l.nama,
    deskripsi: l.deskripsi,
    urlNormal: l.urlNormal,
    kategoriNama: l.kategoriNama,
    kategoriSlug: l.kategoriSlug,
    pegangan: l.pegangan,
    rank: momen?.rank ?? null,
    screenshotUrl: l.screenshotUrl,
    badges: badges.get(id) ?? [],
    riwayat: riwayat.reverse(),
    serupa,
  };
}

/** All tayang listing ids (for the sitemap). */
export async function allTayangIds(db: Database): Promise<string[]> {
  const rows = await db.select({ id: listing.id }).from(listing).where(eq(listing.status, "tayang"));
  return rows.map((r) => r.id);
}
