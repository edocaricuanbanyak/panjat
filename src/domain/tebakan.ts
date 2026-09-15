/**
 * Tebak Juara (R15, M1) — the daily ritual: guess who tops the board at the
 * 00:00 WIB reset. One free guess per visitor per day, closing 3h before reset.
 * A daily appointment (moat) that gets visitors reading listings. Never affects
 * ranking, grip, or clicks (§7.5.2).
 *
 * Interim: the champion is the main board's #1; it switches to Papan Hari Ini's
 * champion when R7 lands.
 */
import { and, eq } from "drizzle-orm";
import type { Database } from "@/db";
import { juaraHarian, listing, pengunjungAnon, tebakan } from "@/db/schema";
import { getHariIni, papanHariIniChampion, wibDayWindow } from "./papan-hari-ini";
import { getRanking } from "./ranking";
import { zonedDate, zonedHour } from "@/lib/tz";

// --- Pure time/streak helpers -----------------------------------------------

/** Market-timezone calendar date "YYYY-MM-DD" — the reset boundary. */
export function todayWIB(now: Date): string {
  return zonedDate(now);
}

function wibHour(now: Date): number {
  return zonedHour(now);
}

/** Guessing closes 3h before the 00:00 WIB reset — i.e. from 21:00 WIB (R15). */
export function cutoffPassed(now: Date): boolean {
  return wibHour(now) >= 21;
}

function prevDate(d: string): string {
  const t = new Date(`${d}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() - 1);
  return t.toISOString().slice(0, 10);
}

/**
 * Consecutive correct guesses ending at the latest resolved day. Streak breaks
 * on a miss, a missing guess, or a date gap; history is never deleted, so a
 * broken streak simply recomputes from scratch (R15).
 */
export function computeStreak(
  champions: Map<string, string>,
  guesses: Map<string, string>,
  latestResolved: string | null,
): number {
  if (!latestResolved) return 0;
  let streak = 0;
  let d: string | undefined = latestResolved;
  while (d && champions.has(d) && guesses.get(d) === champions.get(d)) {
    streak++;
    d = prevDate(d);
  }
  return streak;
}

// --- DB operations ----------------------------------------------------------

export class GuessError extends Error {}

/** Record today's guess. One per anon per day (unique constraint), before cutoff. */
export async function recordGuess(
  db: Database,
  anonId: string,
  listingId: string,
  now: Date,
): Promise<void> {
  if (cutoffPassed(now)) throw new GuessError("Tebakan hari ini sudah ditutup.");

  const [l] = await db
    .select({ status: listing.status })
    .from(listing)
    .where(eq(listing.id, listingId))
    .limit(1);
  if (!l || l.status !== "tayang") throw new GuessError("Listing tidak valid.");

  // Ensure the visitor row exists (lazy creation, R14).
  await db.insert(pengunjungAnon).values({ id: anonId }).onConflictDoNothing();

  try {
    await db.insert(tebakan).values({ anonId, listingId, tanggal: todayWIB(now) });
  } catch {
    throw new GuessError("Kamu sudah menebak hari ini.");
  }
}

/** Resolve a day's champion (idempotent) = Papan Hari Ini #1 for that WIB day. */
export async function resolveDay(db: Database, tanggal: string): Promise<string | null> {
  const { start, end } = wibDayWindow(tanggal);
  const championId = await papanHariIniChampion(db, start, end);
  if (!championId) return null;
  await db
    .insert(juaraHarian)
    .values({ tanggal, listingId: championId })
    .onConflictDoNothing();
  const [row] = await db
    .select({ listingId: juaraHarian.listingId })
    .from(juaraHarian)
    .where(eq(juaraHarian.tanggal, tanggal))
    .limit(1);
  return row?.listingId ?? null;
}

export async function streakOf(db: Database, anonId: string): Promise<number> {
  const [champs, guesses] = await Promise.all([
    db.select({ tanggal: juaraHarian.tanggal, listingId: juaraHarian.listingId }).from(juaraHarian),
    db
      .select({ tanggal: tebakan.tanggal, listingId: tebakan.listingId })
      .from(tebakan)
      .where(eq(tebakan.anonId, anonId)),
  ]);
  const champMap = new Map(champs.map((c) => [c.tanggal, c.listingId]));
  const guessMap = new Map(guesses.map((g) => [g.tanggal, g.listingId ?? ""]));
  const latest = champs.map((c) => c.tanggal).sort().at(-1) ?? null;
  return computeStreak(champMap, guessMap, latest);
}

export interface GuessStatus {
  tanggal: string;
  closed: boolean;
  myGuessListingId: string | null;
  streak: number;
  yesterdayChampion: { id: string; nama: string } | null;
  candidates: { id: string; nama: string }[];
}

/** Everything the board panel needs for one visitor. */
export async function guessStatus(
  db: Database,
  anonId: string | null,
  now: Date,
): Promise<GuessStatus> {
  const tanggal = todayWIB(now);
  const yTanggal = prevDate(tanggal);

  const [ranking, hariIni, myGuess, streak, yChamp] = await Promise.all([
    getRanking(db),
    getHariIni(db, now),
    anonId
      ? db
          .select({ listingId: tebakan.listingId })
          .from(tebakan)
          .where(and(eq(tebakan.anonId, anonId), eq(tebakan.tanggal, tanggal)))
          .limit(1)
      : Promise.resolve([]),
    anonId ? streakOf(db, anonId) : Promise.resolve(0),
    db
      .select({ id: listing.id, nama: listing.nama })
      .from(juaraHarian)
      .innerJoin(listing, eq(listing.id, juaraHarian.listingId))
      .where(eq(juaraHarian.tanggal, yTanggal))
      .limit(1),
  ]);

  return {
    tanggal,
    closed: cutoffPassed(now),
    myGuessListingId: myGuess[0]?.listingId ?? null,
    streak,
    yesterdayChampion: yChamp[0] ?? null,
    // Guess pool = today's contenders (who paid today); fall back to the main
    // board early in the day before anyone has paid.
    candidates:
      hariIni.length > 0
        ? hariIni.slice(0, 10).map((e) => ({ id: e.id, nama: e.nama }))
        : ranking.slice(0, 10).map((r) => ({ id: r.listing.id, nama: r.listing.nama })),
  };
}
