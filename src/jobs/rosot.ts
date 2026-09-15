/** CLI: apply this hour's rosot once. Wire to an hourly scheduler in prod. */
import { db, pool } from "@/db";
import { notifyDrops } from "@/domain/notifikasi";
import { applyHourlyRosot } from "@/domain/rosot-run";
import { formatMoney } from "@/lib/format";

async function main() {
  const now = new Date();
  const res = await applyHourlyRosot(db, now);
  if (res.skipped) {
    console.log(`rosot: skipped, already ran for ${res.ref}`);
  } else {
    console.log(
      `rosot ${res.ref}: ${res.listings} listing(s), total decayed ${formatMoney(res.totalDecayed)}`,
    );
    // Send "kamu disalip" notifications outside the board transaction (R3).
    if (res.drops.length > 0) {
      const n = await notifyDrops(db, res.drops, undefined, now);
      console.log(`notifikasi disalip: ${n.sent} terkirim, ${n.suppressed} ditahan`);
    }
  }
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
