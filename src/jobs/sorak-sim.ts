/**
 * Offline simulation of Kaki Tiang + Sorak (R16). Run after db:seed (2 Kaki
 * Tiang listings seeded).
 */
import { eq, sql } from "drizzle-orm";
import { db, pool } from "@/db";
import { listing } from "@/db/schema";
import { createGratis } from "@/domain/gratis";
import { getKakiTiang, recordSorak, sorakRemaining, SorakError } from "@/domain/sorak";

const ANON = "00000000-0000-0000-0000-0000000000b1";
const DAY = new Date("2026-08-27T05:00:00Z"); // 12:00 WIB

let passed = 0;
function check(name: string, cond: boolean) {
  if (!cond) throw new Error(`FAIL: ${name}`);
  passed++;
  console.log(`  ✓ ${name}`);
}
async function idFor(url: string) {
  const [l] = await db.select({ id: listing.id }).from(listing).where(eq(listing.urlNormal, url)).limit(1);
  return l?.id;
}

async function main() {
  await db.execute(sql`TRUNCATE TABLE sorak, pengunjung_anon RESTART IDENTITY CASCADE`);

  console.log("free listing:");
  const uji = await createGratis(db, { url: "https://ujigratis.id", nama: "Uji Gratis", email: "g@example.id", kategoriSlug: "saas" });
  const u = await db.select({ s: listing.status, g: listing.peganganCached }).from(listing).where(eq(listing.id, uji.listingId)).limit(1);
  check("free listing → tayang, grip 0", u[0].s === "tayang" && u[0].g === 0);

  const judi = await createGratis(db, { url: "https://slotgratis.id", nama: "Slot Gacor", email: "g@example.id" });
  const j = await db.select({ s: listing.status }).from(listing).where(eq(listing.id, judi.listingId)).limit(1);
  check("free listing moderated → judi ditolak", j[0].s === "ditolak");

  const kaki = await getKakiTiang(db);
  check("Kaki Tiang lists free listings (2 seed + 1 uji)", kaki.length === 3);

  console.log("sorak (3/day):");
  check("starts with 3 sorak", (await sorakRemaining(db, ANON, DAY)) === 3);
  const [a, b, c] = kaki;
  await recordSorak(db, ANON, a.id, DAY);
  await recordSorak(db, ANON, b.id, DAY);
  await recordSorak(db, ANON, c.id, DAY);
  check("3 sorak used → 0 remaining", (await sorakRemaining(db, ANON, DAY)) === 0);

  let capped = false;
  try { await recordSorak(db, ANON, a.id, DAY); } catch (e) { capped = e instanceof SorakError; }
  check("4th sorak → blocked", capped);

  console.log("guards:");
  let dup = false;
  try { await recordSorak(db, "00000000-0000-0000-0000-0000000000b2", a.id, DAY); await recordSorak(db, "00000000-0000-0000-0000-0000000000b2", a.id, DAY); } catch (e) { dup = e instanceof SorakError; }
  check("same listing twice/day → blocked", dup);

  const nyala = await idFor("nyala.id");
  let paid = false;
  try { await recordSorak(db, "00000000-0000-0000-0000-0000000000b3", nyala!, DAY); } catch (e) { paid = e instanceof SorakError; }
  check("sorak on paid listing → rejected", paid);

  console.log("ordering:");
  const ordered = await getKakiTiang(db);
  check("ordered by sorak desc", ordered[0].sorak >= ordered[ordered.length - 1].sorak);

  console.log(`\nAll ${passed} checks passed.`);
  await pool.end();
}

main().catch(async (err) => {
  console.error(`\n${err instanceof Error ? err.message : err}`);
  await pool.end();
  process.exit(1);
});
