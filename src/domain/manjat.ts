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
import { dailyRateForRank, estimateDaysToThreshold, type RosotConfig } from "./rosot";
import { imageUrlOrNull, normalizeUrl } from "./url";
import { formatMoney } from "@/lib/format";
import type { SnapClient } from "@/lib/midtrans";

export type Target = "#1" | "top3" | "top10";

export interface ManjatInput {
  url: string;
  nama?: string;
  deskripsi?: string;
  kategoriSlug?: string;
  email?: string;
  wa?: string;
  nominal: number;
  /** Optional visitor-supplied card image (e.g. a social profile photo). */
  logoUrl?: string;
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

export interface QuoteNeighbor {
  nama: string;
  pegangan: number;
  /** Display rank in the projected board (after you slot in). */
  rank: number;
}

export interface Quote {
  /** Amount to pay now — the top-up itself, not the accumulated total. */
  nominal: number;
  /** Whether this payment lands on a fresh listing or accumulates onto a paid one. */
  mode: "naik" | "manjat_lagi";
  /** Existing grip being topped up (0 for a fresh climb / Kaki Tiang). */
  peganganSaatIni: number;
  /** Grip your row sits at after this payment (peganganSaatIni + nominal). */
  peganganProyeksi: number;
  /** Rank this grip would take right now. */
  rank: number;
  rosotPerHari: number;
  /** Whole days it would hold that position under self-decay; null if it never decays. */
  estimasiHari: number | null;
  /** Up to 2 listings directly above you (they keep their rank). */
  atas: QuoteNeighbor[];
  /** Up to 2 listings you'd push below you (their new rank). */
  bawah: QuoteNeighbor[];
  /** The listing directly above + the extra rupiah to overtake it; null at #1. */
  salipAtas: { nama: string; rank: number; extra: number } | null;
  /** Total other listings currently on the paid board. */
  totalPapan: number;
}

/** A row on the live board, as fed to the pure projection. */
export interface BoardEntry {
  id: string;
  nama: string;
  pegangan: number;
}

/**
 * Pure: project where a payment lands on the PAID board (§5). Kaki Tiang (grip 0)
 * never appears here — the board is money-only ("Kaki tiang tidak masuk kesini").
 * For a top-up the visitor's own row leaves the board and re-enters at the
 * accumulated grip (existing + nominal); `existing` is null for a fresh climb.
 */
export function projectQuote(params: {
  /** Full `tayang` board (may include grip-0 rows, which are filtered out). */
  board: readonly BoardEntry[];
  /** The paid listing being topped up, or null for a fresh climb. */
  existing: { id: string; pegangan: number } | null;
  /** Amount paid now, already clamped to the applicable minimum. */
  nominal: number;
  /** Minimum grip floor used for the "bertahan" threshold. */
  minimum: number;
  rosotCfg: RosotConfig;
}): Quote {
  const { existing, nominal, minimum, rosotCfg } = params;
  // Money-only board, excluding the visitor's own row (it's moving up from it).
  const others = params.board
    .filter((b) => b.pegangan > 0 && b.id !== existing?.id)
    .sort((a, b) => b.pegangan - a.pegangan);
  const gripsDesc = others.map((b) => b.pegangan);

  const peganganSaatIni = existing?.pegangan ?? 0;
  const peganganProyeksi = peganganSaatIni + nominal;

  // A new equal grip ranks below existing ones (ties: first-to-reach wins, §5).
  const rank = gripsDesc.filter((g) => g >= peganganProyeksi).length + 1;
  const rate = dailyRateForRank(rank, peganganProyeksi, rosotCfg);
  const threshold = Math.max(gripsDesc[rank - 1] ?? 0, minimum);
  const hari = estimateDaysToThreshold(peganganProyeksi, rate, threshold);

  // Board window around where you slot in. Listings above keep their rank; the
  // ones you pass drop by one.
  const nb = (r: number, displayRank: number): QuoteNeighbor | null => {
    const item = others[r - 1];
    return item ? { nama: item.nama, pegangan: item.pegangan, rank: displayRank } : null;
  };
  const atas = [nb(rank - 2, rank - 2), nb(rank - 1, rank - 1)].filter(
    (x): x is QuoteNeighbor => x !== null,
  );
  const bawah = [nb(rank, rank + 1), nb(rank + 1, rank + 2)].filter(
    (x): x is QuoteNeighbor => x !== null,
  );
  const above = others[rank - 2];
  const salipAtas = above
    ? { nama: above.nama, rank: rank - 1, extra: Math.max(1, above.pegangan + 1 - peganganProyeksi) }
    : null;

  return {
    nominal,
    mode: existing ? "manjat_lagi" : "naik",
    peganganSaatIni,
    peganganProyeksi,
    rank,
    rosotPerHari: Math.round(peganganProyeksi * rate),
    estimasiHari: Number.isFinite(hari) ? hari : null,
    atas,
    bawah,
    salipAtas,
    totalPapan: others.length,
  };
}

/**
 * Price + projection for a target position or a free nominal, against the live
 * board. Supports R2's target selector and the "estimasi bertahan sebelum bayar".
 *
 * When `url` matches a paid `tayang` listing, the payment accumulates onto its
 * existing grip (top-up / "manjat lagi", §6.2). Kaki Tiang (grip 0) never
 * accumulates — paying on it is a fresh climb at the first-climb minimum.
 */
export async function quote(
  db: Database,
  input: { target?: Target; nominal?: number; url?: string },
): Promise<Quote> {
  const [ranking, manjatCfg, rosotCfg] = await Promise.all([
    getRanking(db),
    loadManjatConfig(db),
    loadRosotConfig(db),
  ]);

  let existing: { id: string; pegangan: number } | null = null;
  if (input.url?.trim()) {
    const urlNormal = normalizeUrl(input.url);
    const [row] = await db
      .select({ id: listing.id, status: listing.status, pegangan: listing.peganganCached })
      .from(listing)
      .where(eq(listing.urlNormal, urlNormal))
      .limit(1);
    // Only a paid listing accumulates; a grip-0 Kaki Tiang row is a fresh climb.
    if (row && row.status === "tayang" && row.pegangan > 0) {
      existing = { id: row.id, pegangan: row.pegangan };
    }
  }

  const minimum = existing ? manjatCfg.minimumManjatLagi : manjatCfg.minimumNaik;
  const board: BoardEntry[] = ranking.map((r) => ({
    id: r.listing.id,
    nama: r.listing.nama,
    pegangan: r.listing.peganganCached,
  }));

  let nominal: number;
  if (input.target !== undefined) {
    // Target grip is a board total; a top-up pays only the shortfall over its
    // existing grip.
    const gripsDesc = board
      .filter((b) => b.pegangan > 0 && b.id !== existing?.id)
      .map((b) => b.pegangan)
      .sort((a, b) => b - a);
    const totalNeeded = nominalForTarget(input.target, gripsDesc, minimum);
    nominal = Math.max(minimum, totalNeeded - (existing?.pegangan ?? 0));
  } else {
    nominal = Math.max(minimum, Math.round(input.nominal ?? 0));
  }

  return projectQuote({ board, existing, nominal, minimum, rosotCfg });
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
      .select({ id: listing.id, status: listing.status, pegangan: listing.peganganCached })
      .from(listing)
      .where(eq(listing.urlNormal, urlNormal))
      .limit(1);

    // A paid `tayang` listing accumulates (manjat lagi). A grip-0 Kaki Tiang row
    // is a fresh climb at the first-climb minimum — it never gets the top-up rate.
    const mode: "naik" | "manjat_lagi" =
      existing?.status === "tayang" && existing.pegangan > 0 ? "manjat_lagi" : "naik";
    const minimum = mode === "manjat_lagi" ? cfg.minimumManjatLagi : cfg.minimumNaik;
    if (!Number.isInteger(input.nominal) || input.nominal < minimum) {
      throw new Error(
        `Nominal minimal untuk ${mode === "manjat_lagi" ? "manjat lagi" : "naik tiang"} adalah ${formatMoney(minimum)}`,
      );
    }

    // Identity is bound to email, no account (R2). Email is optional; without it
    // the sponsor just can't open the dashboard until they add one.
    const email = input.email?.trim() || null;
    let kontakId: string;
    const existingKontak = email
      ? await tx.select({ id: sponsorKontak.id }).from(sponsorKontak).where(eq(sponsorKontak.email, email)).limit(1)
      : [];
    if (existingKontak[0]) {
      kontakId = existingKontak[0].id;
    } else {
      const [k] = await tx
        .insert(sponsorKontak)
        .values({ email, wa: input.wa })
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
          logoPath: imageUrlOrNull(input.logoUrl),
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
    } else if (existing.status === "kedaluwarsa") {
      // An expired Kaki Tiang (grip 0) can be claimed straight into a paid climb:
      // revive the row (kedaluwarsa -> menunggu_bayar) rather than insert a
      // duplicate URL. Grip stays 0 until the webhook settles.
      listingId = existing.id;
      await tx
        .update(listing)
        .set({ status: "menunggu_bayar" })
        .where(eq(listing.id, listingId));
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
