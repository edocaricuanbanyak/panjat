/**
 * PRODUCTION seed — ONLY categories + §6.6 config tunables. NO sample listings,
 * NO fake grip, NO demo data. Safe to run against a live database:
 *  - non-destructive: never TRUNCATEs (unlike the dev `seed.ts`);
 *  - idempotent: ON CONFLICT DO NOTHING, so re-running only fills what's missing
 *    (e.g. a newly-added config key) and never clobbers values you've tuned in prod.
 *
 * Run once after `pnpm db:migrate` on a fresh production DB:
 *   DATABASE_URL="<prod-url>" pnpm db:seed:prod
 */
import { db, pool } from "./index";
import { KATEGORI, KONFIGURASI } from "./seed-data";
import { kategori, konfigurasi } from "./schema";

async function main() {
  await db.insert(kategori).values(KATEGORI).onConflictDoNothing();
  await db
    .insert(konfigurasi)
    .values(KONFIGURASI.map((k) => ({ key: k.key, value: k.value, updatedBy: "seed:prod" })))
    .onConflictDoNothing();

  console.log(
    `prod seed OK — ${KATEGORI.length} kategori + ${KONFIGURASI.length} konfigurasi (idempotent, no listings)`,
  );
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
