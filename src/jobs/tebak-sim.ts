/**
 * Offline simulation of Tebak Juara (R15): guess (1/day, cutoff), resolve, and
 * multi-day streak. Run after db:seed.
 */
import { eq, sql } from "drizzle-orm";
import { db, pool } from "@/db";
import { juaraHarian, listing, pengunjungAnon, tebakan } from "@/db/schema";
import { GuessError, recordGuess, resolveDay, streakOf } from "@/domain/tebakan";

const ANON = "00000000-0000-0000-0000-0000000000a1";
const ANON3 = "00000000-0000-0000-0000-0000000000a3";
const DAY = new Date("2026-08-27T05:00:00Z"); // 12:00 WIB (open)
const NIGHT = new Date("2026-08-27T16:00:00Z"); // 23:00 WIB (closed)

let passed = 0;
function check(name: string, cond: boolean) {
  if (!cond) throw new Error(`FAIL: ${name}`);
  passed++;
  console.log(`  ✓ ${name}`);
}

async function main() {
  await db.execute(sql`TRUNCATE TABLE tebakan, juara_harian, sorak, pengunjung_anon RESTART IDENTITY CASCADE`);

  const [nyala] = await db.select({ id: listing.id }).from(listing).where(eq(listing.urlNormal, "nyala.id")).limit(1);
  const [other] = await db.select({ id: listing.id }).from(listing).where(eq(listing.urlNormal, "warungku.app")).limit(1);

  console.log("guess:");
  await recordGuess(db, ANON, nyala.id, DAY);
  check("guess recorded", true);

  let dup = false;
  try { await recordGuess(db, ANON, other.id, DAY); } catch (e) { dup = e instanceof GuessError; }
  check("second guess same day → rejected (1/day)", dup);

  let closed = false;
  try { await recordGuess(db, ANON3, nyala.id, NIGHT); } catch (e) { closed = e instanceof GuessError; }
  check("guess after 21:00 WIB → closed", closed);

  console.log("resolve:");
  const champ = await resolveDay(db, "2026-08-27");
  check("champion = board #1 (Nyala)", champ === nyala.id);
  const again = await resolveDay(db, "2026-08-27");
  check("resolve is idempotent", again === nyala.id);

  console.log("streak:");
  // Backfill two prior correct days for ANON.
  for (const d of ["2026-08-25", "2026-08-26"]) {
    await db.insert(juaraHarian).values({ tanggal: d, listingId: nyala.id }).onConflictDoNothing();
    await db.insert(tebakan).values({ anonId: ANON, tanggal: d, listingId: nyala.id });
  }
  check("3-day streak (today + 2 backfilled)", (await streakOf(db, ANON)) === 3);

  // ANON3 guessed wrong today → streak 0.
  await db.insert(pengunjungAnon).values({ id: ANON3 }).onConflictDoNothing();
  await db.insert(tebakan).values({ anonId: ANON3, tanggal: "2026-08-27", listingId: other.id });
  check("wrong guess → streak 0", (await streakOf(db, ANON3)) === 0);

  console.log(`\nAll ${passed} checks passed.`);
  await pool.end();
}

main().catch(async (err) => {
  console.error(`\n${err instanceof Error ? err.message : err}`);
  await pool.end();
  process.exit(1);
});
