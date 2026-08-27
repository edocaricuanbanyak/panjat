/** Public stats (R22 "statistik publik") — honest, first-party counts. */
import { count, eq, sql } from "drizzle-orm";
import type { Database } from "@/db";
import { juaraHarian, klikHarian, listing, peganganLedger } from "@/db/schema";

export interface Statistik {
  sponsor: number;
  klikTerkirim: number;
  totalPegangan: number;
  hariDiarsip: number;
}

export async function getStatistik(db: Database): Promise<Statistik> {
  const [sponsor] = await db
    .select({ n: count() })
    .from(listing)
    .where(eq(listing.status, "tayang"));
  const [klik] = await db
    .select({ n: sql<number>`coalesce(sum(${klikHarian.jumlahValid}), 0)::int` })
    .from(klikHarian);
  const [bayar] = await db
    .select({ n: sql<number>`coalesce(sum(${peganganLedger.nominalSigned}), 0)::bigint` })
    .from(peganganLedger)
    .where(eq(peganganLedger.jenis, "bayar"));
  const [arsip] = await db.select({ n: count() }).from(juaraHarian);

  return {
    sponsor: sponsor.n,
    klikTerkirim: Number(klik.n),
    totalPegangan: Number(bayar.n),
    hariDiarsip: arsip.n,
  };
}
