/**
 * Hourly rosot orchestrator. Recomputes each `tayang` listing's decay from its
 * current position, writes the decay to the append-only ledger, updates the
 * grip cache, and snapshots the standings — all in one serialized transaction.
 */
import { and, eq, inArray, sql } from "drizzle-orm";
import type { Database } from "@/db";
import { listing, peganganLedger, posisiSnapshot } from "@/db/schema";
import { loadRosotConfig } from "./config";
import { BOARD_LOCK_KEY } from "./constants";
import { appendLedger } from "./ledger";
import { detectDrops, type Drop } from "./notifikasi";
import { computeRanks } from "./ranking";
import { dailyRateForRank, dalamMasaTenang, decayGripOneHour, listingFloor } from "./rosot";

export interface RosotRunResult {
  ref: string;
  skipped: boolean;
  listings: number;
  totalDecayed: number;
  /** Listings that fell out of a threshold this run (R3 detection). */
  drops: Drop[];
}

/** Truncate to the top of the hour in UTC — the run's identity and snapshot time. */
function hourBucket(now: Date): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours()),
  );
}

export async function applyHourlyRosot(db: Database, now: Date): Promise<RosotRunResult> {
  const jam = hourBucket(now);
  const ref = `rosot:${jam.toISOString()}`;

  return db.transaction(async (tx) => {
    // Serialize against the (future) webhook processor so decay and payments
    // never interleave (§17.2 serial-per-papan).
    await tx.execute(sql`select pg_advisory_xact_lock(${sql.raw(BOARD_LOCK_KEY.toString())})`);

    // Idempotency: this hour's decay is applied at most once.
    const already = await tx
      .select({ id: peganganLedger.id })
      .from(peganganLedger)
      .where(eq(peganganLedger.ref, ref))
      .limit(1);
    if (already.length > 0) {
      return { ref, skipped: true, listings: 0, totalDecayed: 0, drops: [] };
    }

    const cfg = await loadRosotConfig(tx);

    const rows = await tx
      .select({
        id: listing.id,
        peganganCached: listing.peganganCached,
        createdAt: listing.createdAt,
      })
      .from(listing)
      .where(eq(listing.status, "tayang"));

    // Total paid per listing (ledger `bayar` sum) → each listing's protected
    // floor. Deterministic & auditable; never AI (§ kontrak produk).
    const ids = rows.map((r) => r.id);
    const bayarByListing = new Map<string, number>();
    // Latest payment time per listing → post-payment grace window (top-up resets).
    const bayarTerakhirByListing = new Map<string, Date>();
    if (ids.length > 0) {
      const bayarRows = await tx
        .select({
          listingId: peganganLedger.listingId,
          total: sql<number>`coalesce(sum(${peganganLedger.nominalSigned}), 0)::bigint`,
          terakhir: sql<string>`max(${peganganLedger.createdAt})`,
        })
        .from(peganganLedger)
        .where(and(eq(peganganLedger.jenis, "bayar"), inArray(peganganLedger.listingId, ids)))
        .groupBy(peganganLedger.listingId);
      for (const b of bayarRows) {
        bayarByListing.set(b.listingId, Number(b.total));
        if (b.terakhir) bayarTerakhirByListing.set(b.listingId, new Date(b.terakhir));
      }
    }

    // Pre-decay ranks decide each listing's rate ("posisi saat jam berjalan").
    const preRanked = computeRanks(rows);

    const decayed = new Map<string, { peganganCached: number; createdAt: Date }>();
    let totalDecayed = 0;

    for (const { rank, listing: l } of preRanked) {
      const floor = listingFloor(bayarByListing.get(l.id) ?? 0, cfg);
      // Grace: freshly (re)paid listings don't decay for masaTenangJam hours.
      const inGrace = dalamMasaTenang(bayarTerakhirByListing.get(l.id), cfg.masaTenangJam, now);
      const rate = inGrace ? 0 : dailyRateForRank(rank, l.peganganCached, cfg, floor);
      const newGrip = inGrace ? l.peganganCached : decayGripOneHour(l.peganganCached, rate, floor);
      const delta = newGrip - l.peganganCached; // ≤ 0

      if (delta !== 0) {
        await appendLedger(tx, {
          listingId: l.id,
          jenis: "rosot",
          nominalSigned: delta,
          ref,
        });
        await tx
          .update(listing)
          .set({ peganganCached: newGrip })
          .where(eq(listing.id, l.id));
        totalDecayed += -delta;
      }
      decayed.set(l.id, { peganganCached: newGrip, createdAt: l.createdAt });
    }

    // Post-decay ranks are the standings this hour → snapshot (R4 chart, R17 badges).
    const postRanked = computeRanks(
      rows.map((r) => ({ id: r.id, ...decayed.get(r.id)! })),
    );
    if (postRanked.length > 0) {
      await tx.insert(posisiSnapshot).values(
        postRanked.map(({ rank, listing: l }) => ({
          listingId: l.id,
          jam,
          rank,
          pegangan: l.peganganCached,
        })),
      );
    }

    // Decay-driven overtakes: who fell out of a threshold this hour (R3).
    const preMap = new Map(preRanked.map(({ rank, listing: l }) => [l.id, rank]));
    const postMap = new Map(postRanked.map(({ rank, listing: l }) => [l.id, rank]));
    const drops = detectDrops(preMap, postMap, cfg.ambang);

    return { ref, skipped: false, listings: rows.length, totalDecayed, drops };
  });
}
