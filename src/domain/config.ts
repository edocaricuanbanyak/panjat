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

export interface ModerasiConfig {
  /**
   * A NEW listing whose grip reaches this many rupiah is sent to the manual
   * queue before going public (§18.5 fraud gate — big money straight to the
   * summit is the scam pattern). 0 disables it: new listings auto-list at any
   * amount. Layer-1 (deterministic) and the hourly AI pass still run regardless.
   */
  ambangTinjauManual: number;
}

/**
 * Defaults to 0 (disabled) when the key is absent, so a DB seeded before this
 * key existed — or a prod DB not yet re-seeded — auto-lists instead of crashing.
 */
export async function loadModerasiConfig(db: DbOrTx): Promise<ModerasiConfig> {
  const [row] = await db
    .select({ value: konfigurasi.value })
    .from(konfigurasi)
    .where(eq(konfigurasi.key, "ambang_tinjau_manual"))
    .limit(1);
  const val = row?.value;
  return { ambangTinjauManual: typeof val === "number" ? val : 0 };
}

/**
 * Max FREE (grip-0) listings allowed per host, to stop one advertiser flooding
 * the Kaki Tiang tier with many paths of the same domain (R2 spirit). Paid
 * listings are never capped. Defaults to 1 when the key is absent.
 */
export async function loadMaksGratisPerDomain(db: DbOrTx): Promise<number> {
  const [row] = await db
    .select({ value: konfigurasi.value })
    .from(konfigurasi)
    .where(eq(konfigurasi.key, "maks_gratis_per_domain"))
    .limit(1);
  const val = row?.value;
  return typeof val === "number" && val > 0 ? val : 1;
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
    .where(inArray(konfigurasi.key, [...KEYS, "lantai_rasio", "lantai_maks", "masa_tenang_jam"]));

  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  for (const k of KEYS) {
    if (!byKey.has(k)) throw new Error(`Missing konfigurasi key: ${k} (run pnpm db:seed)`);
  }

  const laju = byKey.get("laju_rosot") as Record<string, number>;
  const ambang = byKey.get("ambang_tier") as Record<string, number>;
  const kakiTiang = byKey.get("kaki_tiang") as number;

  // Optional (added later): a DB not yet re-seeded degrades to the old behavior —
  // rasio 0 + maks = kakiTiang → per-listing floor collapses to the Kaki Tiang floor.
  const lantaiRasioRaw = byKey.get("lantai_rasio");
  const lantaiMaksRaw = byKey.get("lantai_maks");
  const masaTenangRaw = byKey.get("masa_tenang_jam");

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
    lantaiRasio: typeof lantaiRasioRaw === "number" ? lantaiRasioRaw : 0,
    lantaiMaks: typeof lantaiMaksRaw === "number" ? lantaiMaksRaw : kakiTiang,
    masaTenangJam: typeof masaTenangRaw === "number" ? masaTenangRaw : 0,
  };
}
