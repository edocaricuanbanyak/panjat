/**
 * Offline simulation of click counting (R10): dedup within 6h, bot filtering,
 * daily rollup, hashed IPs. Run after `pnpm db:seed`.
 */
import { and, eq } from "drizzle-orm";
import { db, pool } from "@/db";
import { klik, klikHarian, listing } from "@/db/schema";
import { isBot, recordClick } from "@/domain/klik";
import { dailySalt, hashWith } from "@/lib/ip";

const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Safari/605";
const UA2 = "Mozilla/5.0 (Windows NT 10.0) Chrome/120";
const BOT = "Googlebot/2.1";
const IP_A = "203.0.113.1";
const IP_B = "203.0.113.2";

const base = new Date("2026-08-27T02:00:00Z");
const salt = dailySalt(base);
const at = (h: number) => new Date(base.getTime() + h * 3600_000);

let passed = 0;
function check(name: string, cond: boolean) {
  if (!cond) throw new Error(`FAIL: ${name}`);
  passed++;
  console.log(`  ✓ ${name}`);
}

async function click(listingId: string, ip: string, ua: string, now: Date) {
  return recordClick(db, {
    listingId,
    ipHash: hashWith(ip, salt),
    uaHash: hashWith(ua, salt),
    referer: null,
    asal: "papan",
    isBot: isBot(ua),
    now,
  });
}

async function counts(listingId: string) {
  const rows = await db
    .select({ valid: klik.valid, ipHash: klik.ipHash })
    .from(klik)
    .where(eq(klik.listingId, listingId));
  const [harian] = await db
    .select({ jumlah: klikHarian.jumlahValid })
    .from(klikHarian)
    .where(and(eq(klikHarian.listingId, listingId), eq(klikHarian.tanggal, "2026-08-27")));
  return {
    total: rows.length,
    valid: rows.filter((r) => r.valid).length,
    harian: harian?.jumlah ?? 0,
    sampleIpHash: rows[0]?.ipHash ?? "",
  };
}

async function main() {
  const [l] = await db
    .select({ id: listing.id })
    .from(listing)
    .where(eq(listing.urlNormal, "nyala.id"))
    .limit(1);
  if (!l) throw new Error("seed listing nyala.id tidak ada — jalankan 'pnpm db:seed'");
  if ((await counts(l.id)).total > 0) {
    throw new Error("klik sudah ada — jalankan 'pnpm db:seed' dulu");
  }

  check("first click counts", (await click(l.id, IP_A, UA, at(0))).valid === true);
  check("same ip+ua within 6h is deduped", (await click(l.id, IP_A, UA, at(1))).valid === false);
  check("different ua counts", (await click(l.id, IP_A, UA2, at(2))).valid === true);
  check("different ip counts", (await click(l.id, IP_B, UA, at(3))).valid === true);
  check("bot does not count", (await click(l.id, IP_A, BOT, at(4))).valid === false);
  check("same ip+ua after 6h counts again", (await click(l.id, IP_A, UA, at(7))).valid === true);

  const c = await counts(l.id);
  check("6 klik rows appended (audit trail)", c.total === 6);
  check("4 valid clicks", c.valid === 4);
  check("klik_harian jumlah_valid = 4", c.harian === 4);
  check("ip stored hashed, never raw", c.sampleIpHash !== IP_A && c.sampleIpHash.length === 64);

  console.log(`\nAll ${passed} checks passed.`);
  await pool.end();
}

main().catch(async (err) => {
  console.error(`\n${err instanceof Error ? err.message : err}`);
  await pool.end();
  process.exit(1);
});
