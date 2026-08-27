/**
 * Lencana sponsor (R17) — permanent trophies computed from position history.
 * The slippery pole means positions are rented, but badges are owned: they
 * never disappear when a listing decays. Answers "uang saya menguap". Computed
 * from posisi_snapshot (the sole source, §17.2); never touches grip/rank/clicks.
 */
import { and, asc, eq, inArray, isNotNull } from "drizzle-orm";
import type { Database } from "@/db";
import { kategori, lencana, listing, posisiSnapshot } from "@/db/schema";
import { loadRosotConfig } from "./config";

export type LencanaJenis =
  | "pernah_di_puncak"
  | "top3_7hari"
  | "comeback"
  | "juara_kategori"
  | "bangkit_kaki_tiang";

export const LENCANA_LABEL: Record<LencanaJenis, string> = {
  pernah_di_puncak: "Pernah di Puncak",
  top3_7hari: "7 Hari Top 3",
  comeback: "Comeback",
  juara_kategori: "Juara Kategori",
  bangkit_kaki_tiang: "Bangkit dari Kaki Tiang",
};

export interface Snap {
  jam: Date;
  rank: number;
  pegangan: number;
}

const SEVEN_DAYS_MS = 7 * 24 * 3600_000;
const RUN_GAP_MS = 90 * 60_000; // tolerate the hourly cadence

// --- Pure detectors (series sorted ascending by jam) ------------------------

export function everRank1(series: Snap[]): boolean {
  return series.some((s) => s.rank === 1);
}

/** A run of consecutive snapshots all rank ≤ 3 spanning ≥ 7 days. */
export function held7dTop3(series: Snap[]): boolean {
  let runStart: number | null = null;
  let prev: number | null = null;
  for (const s of series) {
    const t = s.jam.getTime();
    const broken = s.rank > 3 || (prev !== null && t - prev > RUN_GAP_MS);
    if (broken) {
      runStart = s.rank <= 3 ? t : null;
    } else if (runStart === null) {
      runStart = t;
    }
    if (runStart !== null && t - runStart >= SEVEN_DAYS_MS) return true;
    prev = t;
  }
  return false;
}

/** Fell out of Top 10, then later reached #1. */
export function comeback(series: Snap[]): boolean {
  let wasOut = false;
  for (const s of series) {
    if (s.rank > 10) wasOut = true;
    else if (wasOut && s.rank === 1) return true;
  }
  return false;
}

/** Grip hit the floor, then later climbed back into Top 10. */
export function bangkitKakiTiang(series: Snap[], floor: number): boolean {
  let wasFloored = false;
  for (const s of series) {
    if (s.pegangan <= floor) wasFloored = true;
    else if (wasFloored && s.rank <= 10) return true;
  }
  return false;
}

// --- DB orchestration -------------------------------------------------------

/**
 * Compute and award all earned badges (idempotent, permanent via the
 * unique (listing_id, jenis) constraint). Returns how many new rows were added.
 */
export async function computeBadges(db: Database): Promise<{ awarded: number }> {
  const cfg = await loadRosotConfig(db);

  const snaps = await db
    .select({
      listingId: posisiSnapshot.listingId,
      jam: posisiSnapshot.jam,
      rank: posisiSnapshot.rank,
      pegangan: posisiSnapshot.pegangan,
    })
    .from(posisiSnapshot)
    .orderBy(asc(posisiSnapshot.listingId), asc(posisiSnapshot.jam));

  const bySeries = new Map<string, Snap[]>();
  for (const s of snaps) {
    (bySeries.get(s.listingId) ?? bySeries.set(s.listingId, []).get(s.listingId)!).push({
      jam: s.jam,
      rank: s.rank,
      pegangan: s.pegangan,
    });
  }

  const awards: { listingId: string; jenis: LencanaJenis }[] = [];
  for (const [listingId, series] of bySeries) {
    if (everRank1(series)) awards.push({ listingId, jenis: "pernah_di_puncak" });
    if (held7dTop3(series)) awards.push({ listingId, jenis: "top3_7hari" });
    if (comeback(series)) awards.push({ listingId, jenis: "comeback" });
    if (bangkitKakiTiang(series, cfg.kakiTiang))
      awards.push({ listingId, jenis: "bangkit_kaki_tiang" });
  }

  // juara_kategori: current grip champion per category (snapshots hold only
  // global rank, so this is the documented live approximation).
  const cats = await db
    .select({ id: listing.id, kategoriId: listing.kategoriId, pegangan: listing.peganganCached })
    .from(listing)
    .where(and(eq(listing.status, "tayang"), isNotNull(listing.kategoriId)));
  const bestByCat = new Map<string, { id: string; pegangan: number }>();
  for (const l of cats) {
    const cur = bestByCat.get(l.kategoriId!);
    if (!cur || l.pegangan > cur.pegangan) bestByCat.set(l.kategoriId!, { id: l.id, pegangan: l.pegangan });
  }
  for (const { id } of bestByCat.values()) awards.push({ listingId: id, jenis: "juara_kategori" });

  if (awards.length === 0) return { awarded: 0 };
  const inserted = await db
    .insert(lencana)
    .values(awards)
    .onConflictDoNothing()
    .returning({ id: lencana.id });
  return { awarded: inserted.length };
}

/** Badges per listing (labels), batched. */
export async function badgesFor(
  db: Database,
  listingIds: string[],
): Promise<Map<string, string[]>> {
  const out = new Map<string, string[]>();
  if (listingIds.length === 0) return out;
  const rows = await db
    .select({ listingId: lencana.listingId, jenis: lencana.jenis })
    .from(lencana)
    .where(inArray(lencana.listingId, listingIds));
  for (const r of rows) {
    const label = LENCANA_LABEL[r.jenis as LencanaJenis] ?? r.jenis;
    (out.get(r.listingId) ?? out.set(r.listingId, []).get(r.listingId)!).push(label);
  }
  return out;
}
