/**
 * CLI: take a listing off the board by URL (§17.2 tayang→diturunkan).
 *
 * Contract-compliant takedown — reuses turunkanListing so it also refunds the
 * remaining grip and writes a moderasi_log row. Listings are never hard-deleted.
 *
 *   pnpm turunkan <url>
 *   pnpm turunkan <url> --dry                      # look, don't touch
 *   DATABASE_URL=<prod> pnpm turunkan panjat.id    # against production
 */
import { eq } from "drizzle-orm";
import { db, pool } from "@/db";
import { listing } from "@/db/schema";
import { turunkanListing } from "@/domain/moderasi";
import { normalizeUrl } from "@/domain/url";
import { formatRupiah } from "@/lib/format";

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes("--dry");
  const input = args.find((a) => !a.startsWith("--"));
  if (!input) {
    console.error("usage: pnpm turunkan <url> [--dry]");
    process.exitCode = 1;
    return;
  }

  // allowSelf: normalizeUrl now rejects panjat.id for new listings, but we need
  // the same canonical form to find the already-created self-listing to remove.
  const urlNormal = normalizeUrl(input, { allowSelf: true });

  const [row] = await db
    .select({
      id: listing.id,
      nama: listing.nama,
      urlNormal: listing.urlNormal,
      status: listing.status,
      pegangan: listing.peganganCached,
    })
    .from(listing)
    .where(eq(listing.urlNormal, urlNormal));

  if (!row) {
    console.error(`turunkan: no listing with url_normal="${urlNormal}"`);
    process.exitCode = 1;
    return;
  }

  console.log(`found: ${row.nama} (${row.urlNormal}) — status=${row.status}, grip=${formatRupiah(row.pegangan)}`);

  if (row.status !== "tayang") {
    console.error(`turunkan: listing is "${row.status}", not "tayang" — nothing to do`);
    process.exitCode = 1;
    return;
  }

  if (dry) {
    console.log(`--dry: would turunkan "${row.nama}" (refund ${formatRupiah(row.pegangan)}) — no changes made`);
    return;
  }

  await turunkanListing(db, row.id, "self-listing (panjat.id) diturunkan");
  console.log(`turunkan: "${row.nama}" → diturunkan, grip refunded, logged to moderasi_log`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
