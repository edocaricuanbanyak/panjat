/** CLI: apply this hour's rosot once. Wire to an hourly scheduler in prod. */
import { db, pool } from "@/db";
import { applyHourlyRosot } from "@/domain/rosot-run";

async function main() {
  const res = await applyHourlyRosot(db, new Date());
  if (res.skipped) {
    console.log(`rosot: skipped, already ran for ${res.ref}`);
  } else {
    console.log(
      `rosot ${res.ref}: ${res.listings} listing(s), total decayed Rp${res.totalDecayed.toLocaleString("id-ID")}`,
    );
  }
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
