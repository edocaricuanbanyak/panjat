/**
 * Manjat flow (R2) — create a listing or top up an existing one, and raise a
 * Midtrans invoice. Grip is NOT granted here; it activates only when the signed
 * webhook settles (see webhook.ts). Money entry never comes from the browser.
 */
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { Database } from "@/db";
import { kategori, listing, sponsorKontak, transaksi } from "@/db/schema";
import { loadManjatConfig, loadRosotConfig } from "./config";
import { getRanking } from "./ranking";
import { dailyRateForRank, estimateDaysToThreshold } from "./rosot";
import { normalizeUrl } from "./url";
import type { SnapClient } from "@/lib/midtrans";

export type Target = "#1" | "top3" | "top10";

export interface ManjatInput {
  url: string;
  nama?: string;
  deskripsi?: string;
  kategoriSlug?: string;
  email: string;
  wa?: string;
  nominal: number;
}

export interface ManjatResult {
  orderId: string;
  listingId: string;
  nominal: number;
  mode: "naik" | "manjat_lagi";
  token: string;
  redirectUrl: string;
}

/**
 * Pure: rupiah grip needed to sit at a target position, given the current board
 * grips (sorted desc). Overtaking is a Rp1 local increment (§6.2); clamped to
 * the first-climb minimum. For a top-up, the caller subtracts existing grip.
 */
export function nominalForTarget(
  target: Target,
  gripsDesc: readonly number[],
  minNaik: number,
): number {
  const gripAt = (rank1: number) => gripsDesc[rank1 - 1] ?? 0;
  let needed: number;
  switch (target) {
    case "#1":
      needed = gripAt(1) + 1;
      break;
    case "top3":
      needed = gripAt(3) + 1;
      break;
    case "top10":
      needed = gripAt(10) + 1;
      break;
  }
  return Math.max(minNaik, needed);
}

export interface Quote {
  nominal: number;
  /** Rank this grip would take right now. */
  rank: number;
  rosotPerHari: number;
  /** Whole days it would hold that position under self-decay; null if it never decays. */
  estimasiHari: number | null;
}

/**
 * Price + projection for a target position or a free nominal, against the live
 * board. Supports R2's target selector and the "estimasi bertahan sebelum bayar".
 */
export async function quote(
  db: Database,
  input: { target?: Target; nominal?: number },
): Promise<Quote> {
  const [ranking, manjatCfg, rosotCfg] = await Promise.all([
    getRanking(db),
    loadManjatConfig(db),
    loadRosotConfig(db),
  ]);
  const gripsDesc = ranking.map((r) => r.listing.peganganCached);

  const nominal =
    input.target !== undefined
      ? nominalForTarget(input.target, gripsDesc, manjatCfg.minimumNaik)
      : Math.max(manjatCfg.minimumNaik, Math.round(input.nominal ?? 0));

  // A new equal grip ranks below existing ones (ties: first-to-reach wins, §5).
  const rank = gripsDesc.filter((g) => g >= nominal).length + 1;
  const rate = dailyRateForRank(rank, nominal, rosotCfg);
  const threshold = Math.max(gripsDesc[rank - 1] ?? 0, manjatCfg.minimumNaik);
  const hari = estimateDaysToThreshold(nominal, rate, threshold);

  return {
    nominal,
    rank,
    rosotPerHari: Math.round(nominal * rate),
    estimasiHari: Number.isFinite(hari) ? hari : null,
  };
}

export async function createOrTopUp(
  db: Database,
  snap: SnapClient,
  input: ManjatInput,
): Promise<ManjatResult> {
  const urlNormal = normalizeUrl(input.url);

  // DB writes commit before the external Snap call — an HTTP round-trip must not
  // hold a DB transaction open.
  const prepared = await db.transaction(async (tx) => {
    const cfg = await loadManjatConfig(tx);
    const [existing] = await tx
      .select({ id: listing.id, status: listing.status })
      .from(listing)
      .where(eq(listing.urlNormal, urlNormal))
      .limit(1);

    const mode: "naik" | "manjat_lagi" =
      existing?.status === "tayang" ? "manjat_lagi" : "naik";
    const minimum = mode === "manjat_lagi" ? cfg.minimumManjatLagi : cfg.minimumNaik;
    if (!Number.isInteger(input.nominal) || input.nominal < minimum) {
      throw new Error(
        `Nominal minimal untuk ${mode === "manjat_lagi" ? "manjat lagi" : "naik tiang"} adalah Rp${minimum.toLocaleString("id-ID")}`,
      );
    }

    // Identity is bound to email/WA, no account (R2).
    let kontakId: string;
    const [existingKontak] = await tx
      .select({ id: sponsorKontak.id })
      .from(sponsorKontak)
      .where(eq(sponsorKontak.email, input.email))
      .limit(1);
    if (existingKontak) {
      kontakId = existingKontak.id;
    } else {
      const [k] = await tx
        .insert(sponsorKontak)
        .values({ email: input.email, wa: input.wa })
        .returning({ id: sponsorKontak.id });
      kontakId = k.id;
    }

    let listingId: string;
    if (!existing) {
      let kategoriId: string | null = null;
      if (input.kategoriSlug) {
        const [kat] = await tx
          .select({ id: kategori.id })
          .from(kategori)
          .where(eq(kategori.slug, input.kategoriSlug))
          .limit(1);
        kategoriId = kat?.id ?? null;
      }

      const [created] = await tx
        .insert(listing)
        .values({
          urlNormal,
          nama: input.nama?.trim() || urlNormal,
          deskripsi: input.deskripsi,
          kategoriId,
          status: "draft",
          kontakId,
        })
        .returning({ id: listing.id });
      listingId = created.id;
      // draft -> menunggu_bayar on invoice creation (§17.2 state machine).
      await tx
        .update(listing)
        .set({ status: "menunggu_bayar" })
        .where(eq(listing.id, listingId));
    } else if (existing.status === "draft") {
      listingId = existing.id;
      await tx
        .update(listing)
        .set({ status: "menunggu_bayar" })
        .where(eq(listing.id, listingId));
    } else if (existing.status === "menunggu_bayar" || existing.status === "tayang") {
      listingId = existing.id;
    } else {
      throw new Error(`Listing berstatus ${existing.status} tidak bisa dimanjat`);
    }

    const orderId = `mnjt_${randomUUID()}`;
    await tx.insert(transaksi).values({
      orderId,
      listingId,
      nominal: input.nominal,
      status: "pending",
    });

    return { orderId, listingId, mode, nominal: input.nominal };
  });

  const snapResult = await snap.createTransaction({
    orderId: prepared.orderId,
    grossAmount: prepared.nominal,
    email: input.email,
    expiryMinutes: 60,
  });

  return { ...prepared, token: snapResult.token, redirectUrl: snapResult.redirectUrl };
}
