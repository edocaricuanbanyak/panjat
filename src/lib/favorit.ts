/**
 * "Board terfavorit" — a free, spectator vote that runs ALONGSIDE the paid board
 * and never touches money/ranking (§ anonymous gamification contract). One active
 * vote per visitor (changeable); tallies live in Redis, names resolved from
 * Postgres. Fail-open: a down Redis just yields an empty favourite board.
 */
import { inArray } from "drizzle-orm";
import type { Database } from "@/db";
import { listing } from "@/db/schema";
import { redis } from "./redis";

const TALLY = "favorit:tally"; // ZSET member=listingId score=votes
const choiceKey = (vid: string) => `favorit:choice:${vid}`;

/** Cast/'move' this visitor's single favourite vote. Best-effort. */
export async function voteFavorit(vid: string, listingId: string): Promise<boolean> {
  const r = redis();
  if (!r) return false;
  try {
    const prev = await r.get(choiceKey(vid));
    if (prev === listingId) return true; // already voted for this one
    const tx = r.multi();
    if (prev) tx.zincrby(TALLY, -1, prev);
    tx.zincrby(TALLY, 1, listingId);
    tx.set(choiceKey(vid), listingId);
    await tx.exec();
    return true;
  } catch {
    return false;
  }
}

/** The listing this visitor currently favours, if any. */
export async function myFavorit(vid: string | undefined): Promise<string | null> {
  if (!vid) return null;
  const r = redis();
  if (!r) return null;
  try {
    return (await r.get(choiceKey(vid))) ?? null;
  } catch {
    return null;
  }
}

export interface FavoritEntry {
  id: string;
  nama: string;
  votes: number;
}

/** Listings ranked by favourite votes (its own little leaderboard). */
export async function favoritBoard(db: Database, limit = 10): Promise<FavoritEntry[]> {
  const r = redis();
  if (!r) return [];
  try {
    const raw = await r.zrevrange(TALLY, 0, limit - 1, "WITHSCORES");
    if (raw.length === 0) return [];
    const ids: string[] = [];
    const votes = new Map<string, number>();
    for (let i = 0; i < raw.length; i += 2) {
      ids.push(raw[i]);
      votes.set(raw[i], Number(raw[i + 1]));
    }
    const rows = await db
      .select({ id: listing.id, nama: listing.nama })
      .from(listing)
      .where(inArray(listing.id, ids));
    const nameById = new Map(rows.map((row) => [row.id, row.nama]));
    return ids
      .filter((id) => nameById.has(id) && (votes.get(id) ?? 0) > 0)
      .map((id) => ({ id, nama: nameById.get(id) as string, votes: votes.get(id) ?? 0 }));
  } catch {
    return [];
  }
}
