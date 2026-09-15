/**
 * "Kamu disalip" notifications (R3) — the main retention engine. Detection is
 * pure and reused by both the rosot run and the webhook; sending is guarded by
 * the §6.5 anti-nag rules (≤1/sponsor/24h, never 22:00–07:00 WIB, unsubscribe).
 * Never touches the ledger, ranking, or clicks.
 */
import { and, eq, gte } from "drizzle-orm";
import { copy } from "@/copy";
import type { Database } from "@/db";
import { listing, notifikasiLog, sponsorKontak } from "@/db/schema";
import { defaultSenders, signUnsub, type Senders } from "@/lib/notify";
import { zonedHour } from "@/lib/tz";

export interface Ambang {
  top1: number;
  top3: number;
  top10: number;
}

export interface Drop {
  listingId: string;
  fromRank: number;
  toRank: number;
  /** The most prestigious threshold lost (1 / 3 / 10). */
  thresholdLost: number;
}

/**
 * Listings that crossed a threshold downward: were within T, now beyond it.
 * Tags the most severe threshold lost (smallest T). Pure.
 */
export function detectDrops(
  prev: Map<string, number>,
  next: Map<string, number>,
  ambang: Ambang,
): Drop[] {
  const tiers = [ambang.top1, ambang.top3, ambang.top10].sort((a, b) => a - b);
  const drops: Drop[] = [];
  for (const [id, fromRank] of prev) {
    const toRank = next.get(id);
    if (toRank === undefined || toRank <= fromRank) continue; // gone or improved/same
    const lost = tiers.find((t) => fromRank <= t && toRank > t);
    if (lost !== undefined) drops.push({ listingId: id, fromRank, toRank, thresholdLost: lost });
  }
  return drops;
}

/** True during the market-timezone night pause 22:00–07:00 (§6.5). Pure. */
export function isNightWIB(now: Date): boolean {
  const hour = zonedHour(now);
  return hour >= 22 || hour < 7;
}

function tierLabel(t: number): string {
  return t === 1 ? "puncak" : `Top ${t}`;
}

/**
 * Send a "disalip" notification per drop, honoring the guardrails. Sends happen
 * outside any board transaction. Only actually-sent messages write a
 * `notifikasi_log` row, so suppressed ones don't consume the 24h budget.
 */
export async function notifyDrops(
  db: Database,
  drops: Drop[],
  senders: Senders = defaultSenders,
  now: Date = new Date(),
): Promise<{ sent: number; suppressed: number }> {
  let sent = 0;
  let suppressed = 0;

  // Night pause applies to everyone (§6.5).
  if (isNightWIB(now)) return { sent: 0, suppressed: drops.length };

  const dayAgo = new Date(now.getTime() - 24 * 3600_000);

  for (const drop of drops) {
    const [l] = await db
      .select({
        nama: listing.nama,
        urlNormal: listing.urlNormal,
        pegangan: listing.peganganCached,
        kontakId: sponsorKontak.id,
        email: sponsorKontak.email,
        wa: sponsorKontak.wa,
        optOut: sponsorKontak.notifOptOut,
      })
      .from(listing)
      .innerJoin(sponsorKontak, eq(sponsorKontak.id, listing.kontakId))
      .where(eq(listing.id, drop.listingId))
      .limit(1);
    if (!l || l.optOut) {
      suppressed++;
      continue;
    }

    // ≤1 "disalip" per kontak per 24h.
    const [recent] = await db
      .select({ id: notifikasiLog.id })
      .from(notifikasiLog)
      .where(
        and(
          eq(notifikasiLog.kontakId, l.kontakId),
          eq(notifikasiLog.jenis, "disalip"),
          gte(notifikasiLog.createdAt, dayAgo),
        ),
      )
      .limit(1);
    if (recent) {
      suppressed++;
      continue;
    }

    const manjatLink = `/manjat?url=${encodeURIComponent(l.urlNormal)}`;
    const unsubLink = `/notif/unsub?c=${signUnsub(l.kontakId)}`;
    const msg = copy.notif.disalip({
      toRank: drop.toRank,
      tierLabel: tierLabel(drop.thresholdLost),
      pegangan: l.pegangan,
      manjatLink,
      unsubLink,
    });

    if (l.email) {
      const r = await senders.email.send(l.email, copy.notif.disalipSubjek, msg.email);
      await db.insert(notifikasiLog).values({
        kontakId: l.kontakId,
        kanal: "email",
        jenis: "disalip",
        statusKirim: r.ok ? "terkirim" : "gagal",
      });
    }
    if (l.wa) {
      const r = await senders.wa.send(l.wa, msg.wa);
      await db.insert(notifikasiLog).values({
        kontakId: l.kontakId,
        kanal: "wa",
        jenis: "disalip",
        statusKirim: r.ok ? "terkirim" : "gagal",
      });
    }
    sent++;
  }

  return { sent, suppressed };
}
