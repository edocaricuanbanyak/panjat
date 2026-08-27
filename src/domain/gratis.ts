/**
 * Free listing flow (R16) — post a Rp0 listing that lands in the Kaki Tiang tier
 * below all paid listings. No payment, no ledger row (grip stays 0). Still
 * moderated: layer-1 screening runs on creation, same as a paid settlement.
 */
import { eq } from "drizzle-orm";
import type { Database } from "@/db";
import { listing, sponsorKontak } from "@/db/schema";
import { screenListing } from "./moderasi";
import { normalizeUrl } from "./url";

export class GratisError extends Error {}

export interface GratisInput {
  url: string;
  nama?: string;
  deskripsi?: string;
  kategoriSlug?: string;
  email?: string;
}

export async function createGratis(db: Database, input: GratisInput): Promise<{ listingId: string }> {
  const urlNormal = normalizeUrl(input.url);

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: listing.id })
      .from(listing)
      .where(eq(listing.urlNormal, urlNormal))
      .limit(1);
    if (existing) throw new GratisError("URL ini sudah terdaftar.");

    const email = input.email?.trim() || null;
    let kontakId: string;
    const found = email
      ? await tx.select({ id: sponsorKontak.id }).from(sponsorKontak).where(eq(sponsorKontak.email, email)).limit(1)
      : [];
    if (found[0]) kontakId = found[0].id;
    else {
      const [ins] = await tx.insert(sponsorKontak).values({ email }).returning({ id: sponsorKontak.id });
      kontakId = ins.id;
    }

    let kategoriId: string | null = null;
    if (input.kategoriSlug) {
      const { kategori } = await import("@/db/schema");
      const [kat] = await tx.select({ id: kategori.id }).from(kategori).where(eq(kategori.slug, input.kategoriSlug)).limit(1);
      kategoriId = kat?.id ?? null;
    }

    // Insert directly as tayang (grip 0). INSERT bypasses the state-machine
    // trigger (which only guards UPDATEs), then layer-1 screening may hold/reject.
    const [row] = await tx
      .insert(listing)
      .values({
        urlNormal,
        nama: input.nama?.trim() || urlNormal,
        deskripsi: input.deskripsi,
        kategoriId,
        status: "tayang",
        peganganCached: 0,
        kontakId,
      })
      .returning({ id: listing.id });

    await screenListing(tx, {
      listingId: row.id,
      nama: input.nama?.trim() || urlNormal,
      deskripsi: input.deskripsi ?? null,
      urlNormal,
      grip: 0,
      baru: false, // grip 0 → not subject to the ≥Rp100k manual-hold rule
      orderId: `gratis:${row.id}`,
    });

    return { listingId: row.id };
  });
}
