/**
 * Click counting (R10) — the ROI/CPC data sold to sponsors, so it must be
 * deterministic and auditable (§17.1). Every outbound click is counted here at
 * the server redirect (adblock-proof), deduped, and rolled up into klik_harian.
 * Never touches grip/ranking (§ Prinsip Penggunaan AI: clicks stay deterministic).
 */
import { and, eq, gte, sql } from "drizzle-orm";
import type { Database } from "@/db";
import { klik, klikHarian } from "@/db/schema";

const DEDUP_WINDOW_HOURS = 6;

const BOT_UA = /bot|crawl|spider|slurp|curl|wget|python-requests|headless|monitor|preview|scrapy/i;

/** A click that shouldn't reach the public count (R10). */
export function isBot(ua: string): boolean {
  return ua.trim() === "" || BOT_UA.test(ua);
}

/**
 * Build the redirect destination: `https://<url_normal>` with the leaderboard
 * UTM params appended so sponsors can attribute the traffic (R10).
 */
export function withUtm(urlNormal: string): string {
  const u = new URL(`https://${urlNormal}`);
  u.searchParams.set("utm_source", "panjat");
  u.searchParams.set("utm_medium", "leaderboard");
  return u.toString();
}

export interface RecordClickParams {
  listingId: string;
  ipHash: string;
  uaHash: string;
  referer: string | null;
  isBot: boolean;
  now: Date;
}

/**
 * Append a click and, if it counts, bump the daily rollup. Valid = not a bot and
 * not a repeat of the same (listing, ip_hash, ua_hash) within the dedup window.
 * The `klik` row is always written (append-only audit trail); only valid clicks
 * increment `klik_harian`.
 */
export async function recordClick(
  db: Database,
  p: RecordClickParams,
): Promise<{ valid: boolean }> {
  return db.transaction(async (tx) => {
    let valid = !p.isBot;

    if (valid) {
      const since = new Date(p.now.getTime() - DEDUP_WINDOW_HOURS * 3600_000);
      const [dup] = await tx
        .select({ id: klik.id })
        .from(klik)
        .where(
          and(
            eq(klik.listingId, p.listingId),
            eq(klik.ipHash, p.ipHash),
            eq(klik.uaHash, p.uaHash),
            eq(klik.valid, true),
            gte(klik.ts, since),
          ),
        )
        .limit(1);
      if (dup) valid = false;
    }

    await tx.insert(klik).values({
      listingId: p.listingId,
      ts: p.now,
      ipHash: p.ipHash,
      uaHash: p.uaHash,
      referer: p.referer,
      valid,
    });

    if (valid) {
      const tanggal = p.now.toISOString().slice(0, 10); // UTC date
      await tx
        .insert(klikHarian)
        .values({ listingId: p.listingId, tanggal, jumlahValid: 1 })
        .onConflictDoUpdate({
          target: [klikHarian.listingId, klikHarian.tanggal],
          set: { jumlahValid: sql`${klikHarian.jumlahValid} + 1` },
        });
    }

    return { valid };
  });
}
