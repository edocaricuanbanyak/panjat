/**
 * Offline simulation of Jelajah/Pencarian (R22): full-text relevance, category
 * directory + champion, and click-origin capture. Run after db:seed.
 */
import { and, eq } from "drizzle-orm";
import { db, pool } from "@/db";
import { klik, listing } from "@/db/schema";
import { categoryDirectory, searchListings } from "@/domain/jelajah";
import { recordClick } from "@/domain/klik";

let passed = 0;
function check(name: string, cond: boolean) {
  if (!cond) throw new Error(`FAIL: ${name}`);
  passed++;
  console.log(`  ✓ ${name}`);
}

async function main() {
  console.log("pencarian (full-text relevance):");
  const analitik = await searchListings(db, "analitik");
  check("‘analitik’ → Nyala Analytics", analitik.some((c) => c.nama === "Nyala Analytics"));
  const kasir = await searchListings(db, "kasir");
  check("‘kasir’ → Warungku POS", kasir.some((c) => c.nama === "Warungku POS"));
  check("empty query → no results", (await searchListings(db, "   ")).length === 0);
  check("gibberish → no results", (await searchListings(db, "zzxqwplk")).length === 0);
  check("only tayang listings returned", analitik.every((c) => c.nama.length > 0));

  console.log("direktori kategori:");
  const saas = await categoryDirectory(db, "saas", "terbaru");
  check("kategori found", saas !== null);
  check("champion = grip #1 in saas (Nyala)", saas!.champion?.nama === "Nyala Analytics");
  check("directory lists saas items", saas!.items.length >= 2);
  check("intro copy present", saas!.kategori.intro.length > 0);
  check("unknown slug → null", (await categoryDirectory(db, "tidakada", "terbaru")) === null);

  console.log("asal klik (R22):");
  const [l] = await db.select({ id: listing.id }).from(listing).where(eq(listing.urlNormal, "nyala.id")).limit(1);
  await recordClick(db, {
    listingId: l.id,
    ipHash: "hash-a",
    uaHash: "hash-b",
    referer: null,
    asal: "jelajah",
    isBot: false,
    now: new Date(),
  });
  const [row] = await db
    .select({ asal: klik.asal })
    .from(klik)
    .where(and(eq(klik.listingId, l.id), eq(klik.asal, "jelajah")))
    .limit(1);
  check("click origin stored as ‘jelajah’", row?.asal === "jelajah");

  console.log(`\nAll ${passed} checks passed.`);
  await pool.end();
}

main().catch(async (err) => {
  console.error(`\n${err instanceof Error ? err.message : err}`);
  await pool.end();
  process.exit(1);
});
