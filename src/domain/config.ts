/**
 * Loads the §6.6 tunables from the `konfigurasi` table into a typed RosotConfig.
 * These parameters are expected to change in the first month, so they live in
 * the DB, not in code.
 */
import { eq, inArray } from "drizzle-orm";
import type { DbOrTx } from "@/db";
import { konfigurasi } from "@/db/schema";
import type { RosotConfig } from "./rosot";

const KEYS = ["laju_rosot", "ambang_tier", "kaki_tiang"] as const;

async function readConfig(db: DbOrTx, key: string): Promise<unknown> {
  const [row] = await db
    .select({ value: konfigurasi.value })
    .from(konfigurasi)
    .where(eq(konfigurasi.key, key))
    .limit(1);
  if (!row) throw new Error(`Missing konfigurasi key: ${key} (run pnpm db:seed)`);
  return row.value;
}

export interface ManjatConfig {
  /** Minimum rupiah to first climb the pole (§5). */
  minimumNaik: number;
  /** Minimum rupiah for a top-up (§5). */
  minimumManjatLagi: number;
}

export async function loadManjatConfig(db: DbOrTx): Promise<ManjatConfig> {
  return {
    minimumNaik: (await readConfig(db, "minimum_naik")) as number,
    minimumManjatLagi: (await readConfig(db, "minimum_manjat_lagi")) as number,
  };
}

export interface OgConfig {
  /** Show the site's own screenshot as the share-card hero. */
  tampilkanScreenshot: boolean;
  /** Fall back to the site logo (favicon) when there's no screenshot. */
  tampilkanLogo: boolean;
}

/**
 * Share-card hero toggles. Defaults to `true` when a key is absent so a DB
 * seeded before these keys existed still renders the product hero.
 */
export async function loadOgConfig(db: DbOrTx): Promise<OgConfig> {
  const rows = await db
    .select({ key: konfigurasi.key, value: konfigurasi.value })
    .from(konfigurasi)
    .where(inArray(konfigurasi.key, ["og_tampilkan_screenshot", "og_tampilkan_logo"]));
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  const flag = (k: string) => byKey.get(k) !== false; // default true
  return {
    tampilkanScreenshot: flag("og_tampilkan_screenshot"),
    tampilkanLogo: flag("og_tampilkan_logo"),
  };
}

export async function loadRosotConfig(db: DbOrTx): Promise<RosotConfig> {
  const rows = await db
    .select({ key: konfigurasi.key, value: konfigurasi.value })
    .from(konfigurasi)
    .where(inArray(konfigurasi.key, [...KEYS]));

  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  for (const k of KEYS) {
    if (!byKey.has(k)) throw new Error(`Missing konfigurasi key: ${k} (run pnpm db:seed)`);
  }

  const laju = byKey.get("laju_rosot") as Record<string, number>;
  const ambang = byKey.get("ambang_tier") as Record<string, number>;
  const kakiTiang = byKey.get("kaki_tiang") as number;

  return {
    lajuRosot: {
      r1: laju["1"],
      r2_3: laju["2_3"],
      r4_10: laju["4_10"],
      r11_30: laju["11_30"],
      r31plus: laju["31_plus"],
    },
    ambang: {
      top1: ambang.top1,
      top3: ambang.top3,
      top10: ambang.top10,
      top30: ambang.top30,
    },
    kakiTiang,
  };
}
