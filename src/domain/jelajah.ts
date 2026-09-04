/**
 * Jelajah & Pencarian (R22) — the discovery surface. Ordered by relevance and
 * explicit visitor choice, NEVER by money. No rupiah can buy a position here,
 * and no relevance moves the board. Postgres full-text is enough at this scale
 * (§17.3 — no Elasticsearch/Algolia).
 */
import { and, desc, eq, gt, sql } from "drizzle-orm";
import type { Database } from "@/db";
import { kategori, klikHarian, listing, sorak } from "@/db/schema";

export type Sort = "terbaru" | "klik" | "sorak";
export const SORT_LABELS: Record<Sort, string> = {
  terbaru: "Terbaru",
  klik: "Paling diklik minggu ini",
  sorak: "Paling didukung",
};

/** Sanitize a visitor-supplied sort (label always visible, no hidden ordering). */
export function parseSort(s: string | undefined): Sort {
  return s === "klik" || s === "sorak" ? s : "terbaru";
}

const ASAL = new Set(["papan", "jelajah", "pencarian"]);
/** Sanitize the click-origin marker (R22). */
export function parseAsal(s: string | undefined | null): string | null {
  return s && ASAL.has(s) ? s : null;
}

/** One-line intro per category — SEO copy (R22). */
export const KATEGORI_INTRO: Record<string, string> = {
  "ai-tools": "AI tools buatan dan untuk orang Indonesia.",
  saas: "Produk SaaS dan aplikasi web lokal.",
  jasa: "Jasa dan layanan digital.",
  ecommerce: "Toko online dan produk e-commerce.",
  konten: "Konten, media, dan kreator.",
  game: "Game buatan developer Indonesia.",
  edukasi: "Belajar, kursus, dan alat edukasi.",
  fintech: "Keuangan, pembayaran, dan fintech.",
  produktivitas: "Alat bantu kerja dan produktivitas.",
  komunitas: "Komunitas dan tempat berkumpul.",
  marketplace: "Marketplace dan platform jual-beli.",
};

export interface JelajahCard {
  id: string;
  nama: string;
  urlNormal: string;
  deskripsi: string | null;
  kategoriNama: string | null;
  kategoriSlug: string | null;
  klikTotal: number;
}

const klikTotalExpr = sql<number>`(select coalesce(sum(jumlah_valid), 0)::int from klik_harian where klik_harian.listing_id = ${listing.id})`;

/** Full-text search over name + description + category, ranked by text relevance. */
/** All live listings as directory cards — for the client Jelajah tab to filter.
 *  Free Kaki Tiang listings (pegangan Rp0) are excluded; they live in their own
 *  section on the main board, not in Jelajah. */
export async function jelajahAll(db: Database): Promise<JelajahCard[]> {
  return db
    .select({
      id: listing.id,
      nama: listing.nama,
      urlNormal: listing.urlNormal,
      deskripsi: listing.deskripsi,
      kategoriNama: kategori.nama,
      kategoriSlug: kategori.slug,
      klikTotal: klikTotalExpr,
    })
    .from(listing)
    .leftJoin(kategori, eq(kategori.id, listing.kategoriId))
    .where(and(eq(listing.status, "tayang"), gt(listing.peganganCached, 0)))
    .orderBy(desc(listing.createdAt))
    .limit(200);
}

export async function searchListings(db: Database, q: string): Promise<JelajahCard[]> {
  const query = q.trim();
  if (!query) return [];

  // Must mirror the expression in drizzle/0012_listing_search_gin.sql exactly
  // (same 'simple' config, same name+desc concat) so the GIN index is used.
  const doc = sql`to_tsvector('simple', ${listing.nama} || ' ' || coalesce(${listing.deskripsi}, ''))`;
  const tsq = sql`plainto_tsquery('simple', ${query})`;

  return db
    .select({
      id: listing.id,
      nama: listing.nama,
      urlNormal: listing.urlNormal,
      deskripsi: listing.deskripsi,
      kategoriNama: kategori.nama,
      kategoriSlug: kategori.slug,
      klikTotal: klikTotalExpr,
    })
    .from(listing)
    .leftJoin(kategori, eq(kategori.id, listing.kategoriId))
    .where(and(eq(listing.status, "tayang"), gt(listing.peganganCached, 0), sql`${doc} @@ ${tsq}`))
    .orderBy(sql`ts_rank(${doc}, ${tsq}) desc`)
    .limit(30);
}

export interface CategoryDirectory {
  kategori: { nama: string; slug: string; intro: string };
  champion: JelajahCard | null;
  items: JelajahCard[];
}

/** Category directory (R22) — visitor-chosen order, plus the grip champion (R6). */
export async function categoryDirectory(
  db: Database,
  slug: string,
  sort: Sort,
): Promise<CategoryDirectory | null> {
  const [kat] = await db
    .select({ id: kategori.id, nama: kategori.nama, slug: kategori.slug })
    .from(kategori)
    .where(eq(kategori.slug, slug))
    .limit(1);
  if (!kat) return null;

  const base = {
    id: listing.id,
    nama: listing.nama,
    urlNormal: listing.urlNormal,
    deskripsi: listing.deskripsi,
    kategoriNama: kategori.nama,
    kategoriSlug: kategori.slug,
    klikTotal: klikTotalExpr,
  };
  const where = and(eq(listing.status, "tayang"), eq(listing.kategoriId, kat.id));

  // Champion = grip #1 in this category (a "tiang terpisah", R6) — shown as info,
  // never as the directory order.
  const [champion] = await db
    .select(base)
    .from(listing)
    .leftJoin(kategori, eq(kategori.id, listing.kategoriId))
    .where(where)
    .orderBy(desc(listing.peganganCached))
    .limit(1);

  const klikMinggu = sql`(select coalesce(sum(jumlah_valid), 0) from klik_harian where klik_harian.listing_id = ${listing.id} and tanggal >= (now() at time zone 'utc')::date - 7)`;
  // Qualify explicitly: `sorak` has its own `id`, so an unqualified `${listing.id}`
  // in a SELECT-list fragment would bind to sorak.id and always count 0.
  const sorakCount = sql`(select count(*) from "sorak" where "sorak"."listing_id" = "listing"."id")`;
  const orderBy =
    sort === "klik"
      ? [sql`${klikMinggu} desc`, desc(listing.createdAt)]
      : sort === "sorak"
        ? [sql`${sorakCount} desc`, desc(listing.createdAt)]
        : [desc(listing.createdAt)];

  const items = await db
    .select(base)
    .from(listing)
    .leftJoin(kategori, eq(kategori.id, listing.kategoriId))
    .where(where)
    .orderBy(...orderBy)
    .limit(60);

  return {
    kategori: { nama: kat.nama, slug: kat.slug, intro: KATEGORI_INTRO[kat.slug] ?? "" },
    champion: champion ?? null,
    items,
  };
}

/** All categories (for nav / jelajah landing). */
export async function listCategories(db: Database) {
  return db.select({ nama: kategori.nama, slug: kategori.slug }).from(kategori).orderBy(kategori.nama);
}
