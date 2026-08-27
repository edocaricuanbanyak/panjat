/**
 * Offline simulation of Papan Hari Ini (R7). Seed grips are `bayar` rows stamped
 * ~now, so today's board = seed nominals; a past day recomputes empty. Run after
 * db:seed.
 */
import { db, pool } from "@/db";
import { getHariIni, getPapanHariIni, papanHariIniChampion, wibDate, wibDayWindow } from "@/domain/papan-hari-ini";
import { resolveDay } from "@/domain/tebakan";

let passed = 0;
function check(name: string, cond: boolean) {
  if (!cond) throw new Error(`FAIL: ${name}`);
  passed++;
  console.log(`  ✓ ${name}`);
}

async function main() {
  const now = new Date();

  console.log("today (from seed bayar):");
  const today = await getHariIni(db, now);
  check("board populated from today's payments", today.length >= 10);
  check("ranked by today's grip desc", today[0].todayGrip >= today[1].todayGrip);
  check("champion = Nyala (Rp100.000 today)", today[0].nama === "Nyala Analytics");
  check("champion grip = 100000", today[0].todayGrip === 100_000);

  console.log("past day (recomputed from ledger):");
  const past = wibDayWindow("2020-01-01");
  const empty = await getPapanHariIni(db, past.start, past.end);
  check("day with no payments → empty", empty.length === 0);

  console.log("resolve (Tebak Juara champion):");
  const w = wibDayWindow(wibDate(now));
  const champId = await papanHariIniChampion(db, w.start, w.end);
  check("papanHariIniChampion = today #1", champId === today[0].id);
  const resolved = await resolveDay(db, wibDate(now));
  check("resolveDay archives the Papan Hari Ini champion", resolved === today[0].id);

  console.log(`\nAll ${passed} checks passed.`);
  await pool.end();
}

main().catch(async (err) => {
  console.error(`\n${err instanceof Error ? err.message : err}`);
  await pool.end();
  process.exit(1);
});
