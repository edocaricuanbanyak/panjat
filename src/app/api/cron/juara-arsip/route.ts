import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { juaraMingguan, listing } from "@/db/schema";
import { assertCron } from "@/lib/cron";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Read-only diagnostic: dump the whole `juara_mingguan` archive (every week ×
 * jenis, newest first) with the current listing name/URL. Answers "what's
 * actually archived, and since when" — e.g. why the Kaki Tiang / Terfavorit
 * showcase is stuck on an old champion (the weekly cron never wrote a newer
 * row). Guarded by the same CRON_SECRET; never mutates.
 */
export async function GET(req: Request) {
  const auth = assertCron(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const rows = await db
    .select({
      minggu: juaraMingguan.minggu,
      jenis: juaraMingguan.jenis,
      metrik: juaraMingguan.metrik,
      listingId: juaraMingguan.listingId,
      nama: listing.nama,
      urlNormal: listing.urlNormal,
      peganganCached: listing.peganganCached,
      status: listing.status,
      arsipPada: juaraMingguan.createdAt,
    })
    .from(juaraMingguan)
    .innerJoin(listing, eq(listing.id, juaraMingguan.listingId))
    .orderBy(desc(juaraMingguan.minggu), juaraMingguan.jenis);

  const minggu = [...new Set(rows.map((r) => r.minggu))];
  return NextResponse.json({ ok: true, jumlah: rows.length, minggu, rows });
}
