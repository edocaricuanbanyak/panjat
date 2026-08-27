/** CLI: run the layer-2 AI moderation pass over unmoderated tayang listings (R8). */
import { db, pool } from "@/db";
import { moderateWithAI, pendingAiReview } from "@/domain/moderasi";
import { haikuModerator } from "@/lib/anthropic";

async function main() {
  const pending = await pendingAiReview(db);
  console.log(`moderate: ${pending.length} listing menunggu tinjauan AI`);
  for (const l of pending) {
    const verdict = await moderateWithAI(db, l.id, haikuModerator);
    console.log(`  ${l.nama}: ${verdict}`);
  }
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
