/**
 * Public stats aimed at a *calon pemanjat* (R22 "statistik publik") — honest,
 * first-party numbers that answer the questions you weigh before paying: what
 * does the summit cost, how much traffic gets delivered, how efficient is it,
 * and how contestable is the board. All deterministic from the ledger/snapshots
 * (no AI, no estimates on money paths).
 */
import { count, desc, eq, sql } from "drizzle-orm";
import type { Database } from "@/db";
import { klikHarian, listing, peganganLedger } from "@/db/schema";
import { visitorStats } from "@/lib/presence";

export interface Statistik {
  /** Grip currently holding #1 — the live "price of the summit". */
  hargaPuncak: number;
  /** Grip at rank 20 — cost to enter the top-20 board; 0 if fewer than 20 tayang. */
  hargaMasuk20: number;
  /** Valid clicks delivered all-time (Σ klik_harian.jumlah_valid). */
  klikTotal: number;
  /** Rupiah paid per valid click, all-time (Σbayar / Σklik). */
  cpc: number;
  /** Listings currently tayang. */
  sponsor: number;
  /** Number of times #1 changed hands in the last 7 days. */
  puncakBerganti: number;
  /** Visitors online right now. */
  online: number;
  /** All-time unique visitors (reach). */
  totalPengunjung: number;
}

export async function getStatistik(db: Database): Promise<Statistik> {
  const [sponsor] = await db
    .select({ n: count() })
    .from(listing)
    .where(eq(listing.status, "tayang"));

  // Summit price + top-20 entry: read the ranked tayang grips.
  const [puncak] = await db
    .select({ p: listing.peganganCached })
    .from(listing)
    .where(eq(listing.status, "tayang"))
    .orderBy(desc(listing.peganganCached))
    .limit(1);
  const rank20 = await db
    .select({ p: listing.peganganCached })
    .from(listing)
    .where(eq(listing.status, "tayang"))
    .orderBy(desc(listing.peganganCached))
    .offset(19)
    .limit(1);

  const [klikTotal] = await db
    .select({ n: sql<number>`coalesce(sum(${klikHarian.jumlahValid}), 0)::int` })
    .from(klikHarian);
  const [bayar] = await db
    .select({ n: sql<number>`coalesce(sum(${peganganLedger.nominalSigned}), 0)::bigint` })
    .from(peganganLedger)
    .where(eq(peganganLedger.jenis, "bayar"));

  // #1 turnover in the last 7 days: count transitions of the rank-1 listing.
  const berganti = await db.execute<{ n: number }>(sql`
    with r1 as (
      select listing_id, lag(listing_id) over (order by jam) as prev
      from posisi_snapshot
      where rank = 1 and jam >= now() - interval '7 days'
    )
    select count(*)::int as n from r1 where prev is not null and listing_id <> prev
  `);

  const totalKlik = Number(klikTotal.n);
  const totalBayar = Number(bayar.n);
  const visitor = await visitorStats();

  return {
    hargaPuncak: Number(puncak?.p ?? 0),
    hargaMasuk20: Number(rank20[0]?.p ?? 0),
    klikTotal: totalKlik,
    cpc: totalKlik > 0 ? Math.round(totalBayar / totalKlik) : 0,
    sponsor: sponsor.n,
    puncakBerganti: Number(berganti.rows?.[0]?.n ?? 0),
    online: visitor.online,
    totalPengunjung: visitor.total,
  };
}
