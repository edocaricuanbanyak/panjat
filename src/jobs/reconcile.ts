/** CLI: check that every listing's grip cache equals its ledger sum (§17.2). */
import { db, pool } from "@/db";
import { reconcileGrips } from "@/domain/ledger";

async function main() {
  const mismatches = await reconcileGrips(db);
  if (mismatches.length === 0) {
    console.log("reconcile: 0 mismatches — pegangan_cached matches the ledger");
  } else {
    console.error(`reconcile: ${mismatches.length} mismatch(es)`);
    for (const m of mismatches) console.error(m);
    process.exitCode = 1;
  }
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
