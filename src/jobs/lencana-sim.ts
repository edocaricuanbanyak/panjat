/**
 * Offline simulation of the lencana engine (R17). Crafts posisi_snapshot history
 * for seeded listings to trigger each badge, then computes + verifies. Run after
 * db:seed.
 */
import { and, eq, sql } from "drizzle-orm";
import { db, pool } from "@/db";
import { lencana, listing, posisiSnapshot } from "@/db/schema";
import { badgesFor, computeBadges } from "@/domain/lencana";

let passed = 0;
function check(name: string, cond: boolean) {
  if (!cond) throw new Error(`FAIL: ${name}`);
  passed++;
  console.log(`  ✓ ${name}`);
}

const HOUR = 3600_000;
const base = Date.parse("2026-07-01T00:00:00Z");

async function idFor(url: string) {
  const [l] = await db.select({ id: listing.id }).from(listing).where(eq(listing.urlNormal, url)).limit(1);
  return l.id;
}
async function insertSeries(listingId: string, pairs: [number, number][]) {
  await db.insert(posisiSnapshot).values(
    pairs.map(([rank, pegangan], i) => ({
      listingId,
      jam: new Date(base + i * HOUR),
      rank,
      pegangan,
    })),
  );
}
async function has(listingId: string, jenis: string) {
  const [r] = await db
    .select({ id: lencana.id })
    .from(lencana)
    .where(and(eq(lencana.listingId, listingId), eq(lencana.jenis, jenis)))
    .limit(1);
  return !!r;
}

async function main() {
  await db.execute(sql`TRUNCATE TABLE lencana, posisi_snapshot RESTART IDENTITY CASCADE`);

  const nyala = await idFor("nyala.id"); // saas champion
  const baca = await idFor("bacacepat.ai"); // will get comeback + bangkit

  // Nyala: was #1 → pernah_di_puncak.
  await insertSeries(nyala, [[3, 60000], [1, 100000], [2, 90000]]);
  // Baca Cepat: floored then back to #1 → comeback + bangkit_kaki_tiang.
  await insertSeries(baca, [[40, 1000], [15, 8000], [1, 50000]]);

  console.log("compute:");
  const { awarded } = await computeBadges(db);
  check("badges awarded", awarded > 0);

  check("Nyala → Pernah di Puncak", await has(nyala, "pernah_di_puncak"));
  check("Baca → Comeback (out of Top10 then #1)", await has(baca, "comeback"));
  check("Baca → Bangkit dari Kaki Tiang (floor then Top10)", await has(baca, "bangkit_kaki_tiang"));
  check("Nyala → Juara Kategori (saas grip #1)", await has(nyala, "juara_kategori"));

  console.log("permanence + idempotency:");
  const before = (await db.select({ id: lencana.id }).from(lencana)).length;
  const second = await computeBadges(db);
  const after = (await db.select({ id: lencana.id }).from(lencana)).length;
  check("re-run awards nothing new", second.awarded === 0 && after === before);

  console.log("display:");
  const map = await badgesFor(db, [nyala, baca]);
  check("badgesFor returns labels", (map.get(nyala)?.length ?? 0) >= 2 && (map.get(baca)?.length ?? 0) >= 2);

  console.log(`\nAll ${passed} checks passed.`);
  await pool.end();
}

main().catch(async (err) => {
  console.error(`\n${err instanceof Error ? err.message : err}`);
  await pool.end();
  process.exit(1);
});
