/** Moderation queue read model (§18.5) — held listings awaiting a human. */
import { desc, eq } from "drizzle-orm";
import type { Database } from "@/db";
import { listing, moderasiLog } from "@/db/schema";

export interface QueueItem {
  id: string;
  nama: string;
  urlNormal: string;
  deskripsi: string | null;
  pegangan: number;
  alasan: string | null;
}

export async function getModerationQueue(db: Database): Promise<QueueItem[]> {
  const rows = await db
    .select({
      id: listing.id,
      nama: listing.nama,
      urlNormal: listing.urlNormal,
      deskripsi: listing.deskripsi,
      pegangan: listing.peganganCached,
    })
    .from(listing)
    .where(eq(listing.status, "ditahan"))
    .orderBy(desc(listing.peganganCached));

  // Attach the most recent moderation reason per listing.
  const out: QueueItem[] = [];
  for (const r of rows) {
    const [log] = await db
      .select({ alasan: moderasiLog.alasan })
      .from(moderasiLog)
      .where(eq(moderasiLog.listingId, r.id))
      .orderBy(desc(moderasiLog.createdAt))
      .limit(1);
    out.push({ ...r, alasan: log?.alasan ?? null });
  }
  return out;
}
