import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { listing, sorak } from "@/db/schema";
import { assertCron } from "@/lib/cron";
import { weekStartWIB } from "@/lib/favorit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Read-only diagnostic: reconstruct the Kaki Tiang weekly standings straight
 * from the raw `sorak` ledger, bucketed by the same Wednesday 17:00 WIB cut-off
 * the domain uses. Independent of the `juara_mingguan` archive — so it answers
 * "who was the champion each week even though the cron never archived it".
 *
 * Sorak is only ever granted to Rp0 listings (enforced in recordSorak), so every
 * row here is a legitimate free-tier cheer regardless of the listing's current
 * grip/status (shown as context). Unauthenticated caller blocked, but read-only.
 */
export async function GET(req: Request) {
  const auth = assertCron(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  // Every sorak with its listing. `tanggal` is a WIB date; place it at 17:00 WIB
  // (10:00 UTC) so it lands in the same weekly bucket the domain assigns it.
  const rows = await db
    .select({
      tanggal: sorak.tanggal,
      listingId: sorak.listingId,
      nama: listing.nama,
      urlNormal: listing.urlNormal,
      pegangan: listing.peganganCached,
      status: listing.status,
    })
    .from(sorak)
    .innerJoin(listing, eq(listing.id, sorak.listingId))
    .orderBy(desc(sorak.tanggal));

  // Bucket by week → per-listing tally.
  type Tally = { listingId: string; nama: string; urlNormal: string; pegangan: number; status: string; sorak: number };
  const weeks = new Map<string, Map<string, Tally>>();
  for (const r of rows) {
    const week = weekStartWIB(new Date(`${r.tanggal}T10:00:00Z`));
    let byListing = weeks.get(week);
    if (!byListing) weeks.set(week, (byListing = new Map()));
    const t = byListing.get(r.listingId);
    if (t) t.sorak += 1;
    else
      byListing.set(r.listingId, {
        listingId: r.listingId,
        nama: r.nama,
        urlNormal: r.urlNormal,
        pegangan: r.pegangan,
        status: r.status,
        sorak: 1,
      });
  }

  // Newest week first; within a week, most Sorak first. Champion = the top row.
  const riwayat = [...weeks.entries()]
    .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
    .map(([minggu, byListing]) => {
      const peringkat = [...byListing.values()].sort((a, b) => b.sorak - a.sorak);
      return { minggu, juara: peringkat[0] ?? null, peringkat };
    });

  return NextResponse.json({ ok: true, jumlahMinggu: riwayat.length, riwayat });
}
