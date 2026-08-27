/** CLI: resolve today's Tebak Juara champion (run at/after 00:00 WIB reset). */
import { db, pool } from "@/db";
import { resolveDay, todayWIB } from "@/domain/tebakan";

async function main() {
  const tanggal = todayWIB(new Date());
  const championId = await resolveDay(db, tanggal);
  console.log(`tebak-resolve ${tanggal}: juara = ${championId ?? "(papan kosong)"}`);
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
