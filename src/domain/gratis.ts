/**
 * Free listing flow (R16) — post a Rp0 listing that lands in the Kaki Tiang tier
 * below all paid listings. No payment, no ledger row (grip stays 0). Still
 * moderated: layer-1 screening runs on creation, same as a paid settlement.
 */
import { and, count, eq, gte, inArray, like, or } from "drizzle-orm";
import type { Database, DbOrTx } from "@/db";
import { listing, sorak, sponsorKontak } from "@/db/schema";
import { loadMaksGratisPerDomain } from "./config";
import { screenListing } from "./moderasi";
import { imageUrlOrNull, normalizeUrl } from "./url";
import { zonedDate, zonedDayWindow } from "@/lib/tz";

export class GratisError extends Error {}

// Kaki Tiang is first-come-first-served: at most 10 free slots open per WIB week.
export const GRATIS_PER_MINGGU = 10;

/** Start of the current market-tz week (Monday 00:00 local) as a UTC instant. */
function mingguStart(now: Date): Date {
  const d = new Date(`${zonedDate(now)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); // back to Monday
  return zonedDayWindow(d.toISOString().slice(0, 10)).start;
}

/** Free slots taken this week — accepted (tayang/ditahan) grip-0 listings. */
async function gratisTerpakai(db: DbOrTx, now: Date): Promise<number> {
  const [row] = await db
    .select({ n: count() })
    .from(listing)
    .where(
      and(
        eq(listing.peganganCached, 0),
        inArray(listing.status, ["tayang", "ditahan"]),
        gte(listing.createdAt, mingguStart(now)),
      ),
    );
  return Number(row.n);
}

/** Remaining Kaki Tiang slots for this week (for the UI). */
export async function sisaGratisMingguIni(db: Database, now = new Date()): Promise<number> {
  return Math.max(0, GRATIS_PER_MINGGU - (await gratisTerpakai(db, now)));
}

export interface GratisInput {
  url: string;
  nama?: string;
  deskripsi?: string;
  kategoriSlug?: string;
  email?: string;
  /** Optional visitor-supplied card image (e.g. a social profile photo). */
  logoUrl?: string;
}

export async function createGratis(db: Database, input: GratisInput): Promise<{ listingId: string }> {
  const urlNormal = normalizeUrl(input.url);

  return db.transaction(async (tx) => {
    // First-come-first-served weekly cap (siapa cepat) — 10 free slots per week.
    if ((await gratisTerpakai(tx, new Date())) >= GRATIS_PER_MINGGU) {
      throw new GratisError(
        "Kuota Kaki Tiang minggu ini sudah penuh (10 per minggu). Coba lagi minggu depan — atau naik tiang berbayar.",
      );
    }

    // url_normal is unique, so an existing row blocks a fresh insert. A row that
    // has already expired (weekly Kaki Tiang reset) is revivable: the same URL
    // may be posted again for the new period (siapa cepat — no owner lock).
    // Any other status means it is still live somewhere, so reject.
    const [existing] = await tx
      .select({ id: listing.id, status: listing.status })
      .from(listing)
      .where(eq(listing.urlNormal, urlNormal))
      .limit(1);
    const reviveId = existing?.status === "kedaluwarsa" ? existing.id : null;
    if (existing && !reviveId) throw new GratisError("URL ini sudah terdaftar.");

    // One advertiser may not flood the free tier with many paths of one host.
    const host = urlNormal.split("/")[0];
    const maksPerDomain = await loadMaksGratisPerDomain(tx);
    const [{ n: gratisDomain }] = await tx
      .select({ n: count() })
      .from(listing)
      .where(
        and(
          eq(listing.peganganCached, 0),
          inArray(listing.status, ["tayang", "ditahan"]),
          or(eq(listing.urlNormal, host), like(listing.urlNormal, `${host}/%`)),
        ),
      );
    if (Number(gratisDomain) >= maksPerDomain) {
      throw new GratisError(
        `Domain ini sudah punya listing gratis (batas ${maksPerDomain} per domain). Untuk listing tambahan, naik tiang berbayar.`,
      );
    }

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

    const nama = input.nama?.trim() || urlNormal;

    // Revive the expired row (kedaluwarsa -> tayang) or insert a fresh one.
    // Reviving reuses the same id (the unique url_normal can't be re-inserted)
    // and refreshes created_at so it counts against this week's quota and reads
    // as a fresh entry; the new submitter's details fully replace the old ones.
    // A fresh INSERT lands as tayang directly (INSERT bypasses the state-machine
    // trigger, which only guards UPDATEs). Layer-1 screening then may hold/reject.
    let listingId: string;
    if (reviveId) {
      await tx
        .update(listing)
        .set({
          nama,
          deskripsi: input.deskripsi,
          kategoriId,
          logoPath: imageUrlOrNull(input.logoUrl),
          status: "tayang",
          kontakId,
          createdAt: new Date(),
        })
        .where(eq(listing.id, reviveId));
      // A revived listing starts a fresh weekly contest — its old dukungan
      // (Sorak) must not carry over, so clear it. The live Kaki Tiang board
      // counts Sorak all-time per listing, and the row id is reused on revive.
      await tx.delete(sorak).where(eq(sorak.listingId, reviveId));
      listingId = reviveId;
    } else {
      const [row] = await tx
        .insert(listing)
        .values({
          urlNormal,
          nama,
          deskripsi: input.deskripsi,
          kategoriId,
          logoPath: imageUrlOrNull(input.logoUrl),
          status: "tayang",
          peganganCached: 0,
          kontakId,
        })
        .returning({ id: listing.id });
      listingId = row.id;
    }

    await screenListing(tx, {
      listingId,
      nama,
      deskripsi: input.deskripsi ?? null,
      urlNormal,
      grip: 0,
      baru: false, // grip 0 → not subject to the ≥Rp100k manual-hold rule
      orderId: `gratis:${listingId}`,
    });

    return { listingId };
  });
}
