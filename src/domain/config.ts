/**
 * Loads the §6.6 tunables from the `konfigurasi` table into a typed RosotConfig.
 * These parameters are expected to change in the first month, so they live in
 * the DB, not in code.
 */
import { inArray } from "drizzle-orm";
import type { DbOrTx } from "@/db";
import { konfigurasi } from "@/db/schema";
import type { RosotConfig } from "./rosot";

const KEYS = ["laju_rosot", "ambang_tier", "kaki_tiang"] as const;

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
