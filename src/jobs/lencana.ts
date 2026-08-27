/** CLI: compute + award sponsor badges from position history (R17). Nightly. */
import { db, pool } from "@/db";
import { computeBadges } from "@/domain/lencana";

async function main() {
  const { awarded } = await computeBadges(db);
  console.log(`lencana: ${awarded} lencana baru diberikan`);
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
