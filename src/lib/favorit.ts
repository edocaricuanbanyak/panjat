/**
 * "Pemanjat terfavorit" — a free spectator vote alongside the paid board (never
 * money/ranking). One vote per visitor per WIB day (not changeable); votes
 * accumulate into a weekly leaderboard. Tallies live in Redis, names resolved
 * from Postgres. Fail-open: a down Redis just yields an empty favourite board.
 */
import { desc, eq, inArray } from "drizzle-orm";
import type { Database } from "@/db";
import { listing } from "@/db/schema";
import { redis } from "./redis";

/** YYYY-MM-DD in WIB — the daily vote bucket. */
function wibDate(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(now);
}

/**
 * The weekly competition resets at the Wednesday 17:00 WIB cut-off — champions
 * are *determined* then, and posted to Threads/TikTok the following Friday. WIB
 * has no DST, so the cut-off is a fixed weekly UTC instant (Wed 10:00 UTC).
 */
export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
export const WEEK_ANCHOR_MS = Date.UTC(1970, 0, 7, 10, 0, 0); // a Wednesday 17:00 WIB

/** Stable weekly bucket id, incrementing at each Wednesday 17:00 WIB cut-off. */
export function weekBucket(now: Date): number {
  return Math.floor((now.getTime() - WEEK_ANCHOR_MS) / WEEK_MS);
}

/** The WIB date "YYYY-MM-DD" of the Wednesday 17:00 cut-off that OPENED the week `now` falls in. */
export function weekStartWIB(now: Date): string {
  const cutoff = new Date(WEEK_ANCHOR_MS + weekBucket(now) * WEEK_MS);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(cutoff);
}

const tallyKey = (now: Date) => `favorit:tally:w${weekBucket(now)}`;
// Scope the daily vote-lock to the weekly bucket too: the week flips mid-day at
// the Wed 17:00 WIB cut-off, so without the bucket a Wednesday-morning voter
// would stay locked out of the fresh week until midnight. With it, the closing
// and opening weeks are distinct locks on the boundary day.
const votedKey = (now: Date, vid: string) => `favorit:voted:w${weekBucket(now)}:${wibDate(now)}:${vid}`;
const VOTED_TTL_S = 60 * 60 * 30; // ~30h, covers the WIB day
const TALLY_TTL_S = 60 * 60 * 24 * 21; // keep a few weeks

export type VoteResult = { ok: true } | { ok: false; reason: "sudah" | "gagal" };

/** Cast today's single vote. Idempotent-locked per day; never changeable. */
export async function voteFavorit(vid: string, listingId: string, now = new Date()): Promise<VoteResult> {
  const r = redis();
  if (!r) return { ok: false, reason: "gagal" };
  try {
    // Atomic day-lock: SET NX succeeds only on the first vote of the day.
    const locked = await r.set(votedKey(now, vid), listingId, "EX", VOTED_TTL_S, "NX");
    if (locked === null) return { ok: false, reason: "sudah" };
    const key = tallyKey(now);
    await r.zincrby(key, 1, listingId);
    await r.expire(key, TALLY_TTL_S);
    return { ok: true };
  } catch {
    return { ok: false, reason: "gagal" };
  }
}

/** The listing this visitor voted for today, if any (locks the UI). */
export async function myFavoritToday(vid: string | undefined, now = new Date()): Promise<string | null> {
  if (!vid) return null;
  const r = redis();
  if (!r) return null;
  try {
    return (await r.get(votedKey(now, vid))) ?? null;
  } catch {
    return null;
  }
}

export interface FavoritEntry {
  id: string;
  nama: string;
  urlNormal: string;
  votes: number;
}

/** This week's votes, ranked (only listings that actually received votes). */
async function votedFavorit(db: Database, now: Date, limit: number): Promise<FavoritEntry[]> {
  const r = redis();
  if (!r) return [];
  try {
    const raw = await r.zrevrange(tallyKey(now), 0, limit - 1, "WITHSCORES");
    if (raw.length === 0) return [];
    const ids: string[] = [];
    const votes = new Map<string, number>();
    for (let i = 0; i < raw.length; i += 2) {
      ids.push(raw[i]);
      votes.set(raw[i], Number(raw[i + 1]));
    }
    const rows = await db
      .select({ id: listing.id, nama: listing.nama, urlNormal: listing.urlNormal })
      .from(listing)
      .where(inArray(listing.id, ids));
    const byId = new Map(rows.map((row) => [row.id, row]));
    return ids
      .filter((id) => byId.has(id) && (votes.get(id) ?? 0) > 0)
      .map((id) => {
        const row = byId.get(id) as { nama: string; urlNormal: string };
        return { id, nama: row.nama, urlNormal: row.urlNormal, votes: votes.get(id) ?? 0 };
      });
  } catch {
    return [];
  }
}

/**
 * The favourite board: this week's voted listings, then padded with the top
 * climbers (0 votes) so the papan always shows a full `limit` — an empty-looking
 * board reads as a dead feature.
 */
export async function favoritBoard(db: Database, now = new Date(), limit = 10): Promise<FavoritEntry[]> {
  const voted = await votedFavorit(db, now, limit);
  if (voted.length >= limit) return voted;

  const haveIds = new Set(voted.map((v) => v.id));
  const fillers = await db
    .select({ id: listing.id, nama: listing.nama, urlNormal: listing.urlNormal })
    .from(listing)
    .where(eq(listing.status, "tayang"))
    .orderBy(desc(listing.peganganCached))
    .limit(limit + haveIds.size);

  const out = [...voted];
  for (const f of fillers) {
    if (out.length >= limit) break;
    if (!haveIds.has(f.id)) {
      out.push({ id: f.id, nama: f.nama, urlNormal: f.urlNormal, votes: 0 });
      haveIds.add(f.id);
    }
  }
  return out;
}
