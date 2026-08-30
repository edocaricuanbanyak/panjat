/**
 * CLI (read-only): list listings stuck in the manual moderation queue
 * (status=ditahan), with the reason they were held. Nothing is mutated.
 *
 *   pnpm ditahan
 *   DATABASE_URL=<prod> pnpm ditahan   # against production
 */
import { db, pool } from "@/db";
import { getModerationQueue } from "@/domain/admin";
import { formatRupiah } from "@/lib/format";

async function main() {
  const queue = await getModerationQueue(db);
  if (queue.length === 0) {
    console.log("ditahan: 0 — no listings waiting in the manual queue");
    return;
  }
  console.log(`ditahan: ${queue.length} listing(s) waiting for a human decision\n`);
  for (const q of queue) {
    console.log(`• ${q.nama} (${q.urlNormal})`);
    console.log(`    id=${q.id}`);
    console.log(`    grip=${formatRupiah(q.pegangan)}`);
    console.log(`    alasan=${q.alasan ?? "—"}`);
    console.log("");
  }
  console.log("Approve/reject at /admin, or via POST /api/admin/{id}/moderasi.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
