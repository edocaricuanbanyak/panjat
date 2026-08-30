/**
 * Moderation (R8). Layer 1 is deterministic and always runs, even if the AI is
 * down. Layer 2 (AI) is a separate background pass. AI never touches ranking,
 * grip, price, or clicks (Prinsip Penggunaan AI) — only the moderation verdict.
 */
import { and, eq } from "drizzle-orm";
import type { Database, DbOrTx } from "@/db";
import { listing, moderasiLog } from "@/db/schema";
import { appendLedger, gripFromLedger } from "./ledger";
import { loadModerasiConfig } from "./config";
import { formatRupiah } from "@/lib/format";
import type { AiModerator } from "@/lib/anthropic";

export type Verdict = "lolos" | "tolak" | "ragu";

export interface Lapis1Result {
  verdict: Verdict;
  alasan: string;
  kategori?: string;
}

// Hard-banned — deterministic reject (§R8).
const JUDI = /\b(judi|slot|gacor|togel|casino|kasino|poker|taruhan|bandar|maxwin|jackpot|rtp|sbobet)\b/i;
const DEWASA = /\b(bokep|porn|xxx|telanjang|bugil|vcs|sange|memek|ngentot|18\+)\b/i;
const CHAT_LINK = /(t\.me\/|chat\.whatsapp\.com|wa\.me\/|discord\.gg\/|line\.me\/ti\/g)/i;
const URL_SHORTENER = /\b(bit\.ly|tinyurl\.com|s\.id|cutt\.ly|ow\.ly|t\.co|goo\.gl|shorturl\.|is\.gd|rebrand\.ly)\b/i;
// Needs nuance (legal vs illegal) — escalate, don't auto-reject.
const PINJOL = /\b(pinjol|pinjaman online|dana cepat|pinjaman cepat|rentenir|gadai cepat)\b/i;

/**
 * Deterministic layer-1 screen over name + description + url. Runs with the AI
 * offline. Hard bans → tolak; ambiguous (pinjol) → ragu → human/AI queue.
 */
export function lapis1(nama: string, deskripsi: string | null, url: string): Lapis1Result {
  const text = `${nama} ${deskripsi ?? ""} ${url}`;
  if (JUDI.test(text)) return { verdict: "tolak", alasan: "Terindikasi judi/slot", kategori: "judi" };
  if (DEWASA.test(text)) return { verdict: "tolak", alasan: "Konten dewasa", kategori: "dewasa" };
  if (CHAT_LINK.test(text)) return { verdict: "tolak", alasan: "Tautan grup chat", kategori: "chat_link" };
  if (URL_SHORTENER.test(text)) return { verdict: "tolak", alasan: "URL pendek tidak bisa diverifikasi", kategori: "url_pendek" };
  if (PINJOL.test(text)) return { verdict: "ragu", alasan: "Pinjol — perlu tinjauan legal", kategori: "pinjol" };
  return { verdict: "lolos", alasan: "Lolos lapis 1" };
}

// --- Verdict actions (share the board via the caller's tx where relevant) ---

/** Refund the full remaining grip (§17.2 ditahan→ditolak): ledger −sisa, cache→0. */
async function refundListing(tx: DbOrTx, listingId: string, ref: string): Promise<number> {
  const grip = await gripFromLedger(tx, listingId);
  if (grip > 0) {
    await appendLedger(tx, { listingId, jenis: "refund", nominalSigned: -grip, ref });
  }
  await tx.update(listing).set({ peganganCached: 0 }).where(eq(listing.id, listingId));
  return grip;
}

async function logModerasi(
  tx: DbOrTx,
  row: {
    listingId: string;
    aktor: "ai" | "manusia" | "sistem";
    keputusan: string;
    alasan: string;
    sebelum: string;
    sesudah: string;
  },
): Promise<void> {
  await tx.insert(moderasiLog).values(row);
}

/**
 * Layer-1 screen applied inside the settle transaction, so risky content is
 * never publicly `tayang`. Assumes the listing is currently `tayang`.
 *  - tolak → tayang→ditahan→ditolak + full refund
 *  - ragu, or a new listing with grip ≥ Rp100.000 → tayang→ditahan (manual queue)
 *  - lolos → stays tayang
 */
export async function screenListing(
  tx: DbOrTx,
  input: { listingId: string; nama: string; deskripsi: string | null; urlNormal: string; grip: number; baru: boolean; orderId: string },
): Promise<Verdict> {
  const res = lapis1(input.nama, input.deskripsi, input.urlNormal);

  if (res.verdict === "tolak") {
    await tx.update(listing).set({ status: "ditahan" }).where(eq(listing.id, input.listingId));
    await tx.update(listing).set({ status: "ditolak" }).where(eq(listing.id, input.listingId));
    await refundListing(tx, input.listingId, `moderasi:${input.orderId}`);
    await logModerasi(tx, {
      listingId: input.listingId,
      aktor: "sistem",
      keputusan: "tolak",
      alasan: `${res.alasan} (lapis 1)`,
      sebelum: "tayang",
      sesudah: "ditolak",
    });
    return "tolak";
  }

  const { ambangTinjauManual } = await loadModerasiConfig(tx);
  const bigNew = input.baru && ambangTinjauManual > 0 && input.grip >= ambangTinjauManual;
  if (res.verdict === "ragu" || bigNew) {
    await tx.update(listing).set({ status: "ditahan" }).where(eq(listing.id, input.listingId));
    await logModerasi(tx, {
      listingId: input.listingId,
      aktor: "sistem",
      keputusan: "tahan",
      alasan: bigNew
        ? `Listing baru ≥${formatRupiah(ambangTinjauManual)} — antrean manual`
        : `${res.alasan} (lapis 1)`,
      sebelum: "tayang",
      sesudah: "ditahan",
    });
    return "ragu";
  }

  await logModerasi(tx, {
    listingId: input.listingId,
    aktor: "sistem",
    keputusan: "lolos",
    alasan: res.alasan,
    sebelum: "tayang",
    sesudah: "tayang",
  });
  return "lolos";
}

// --- Layer 2: AI pass (background; never blocks payment or display) ----------

async function needsAiReview(db: Database, listingId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: moderasiLog.id })
    .from(moderasiLog)
    .where(and(eq(moderasiLog.listingId, listingId), eq(moderasiLog.aktor, "ai")))
    .limit(1);
  return !row;
}

/** List `tayang` listings not yet AI-reviewed. */
export async function pendingAiReview(db: Database): Promise<
  { id: string; nama: string; deskripsi: string | null; urlNormal: string }[]
> {
  const rows = await db
    .select({ id: listing.id, nama: listing.nama, deskripsi: listing.deskripsi, urlNormal: listing.urlNormal })
    .from(listing)
    .where(eq(listing.status, "tayang"));
  const out: typeof rows = [];
  for (const r of rows) {
    if (await needsAiReview(db, r.id)) out.push(r);
  }
  return out;
}

/** AI-classify one listing and apply the verdict. Fail-safe: AI errors → ragu → hold. */
export async function moderateWithAI(
  db: Database,
  listingId: string,
  ai: AiModerator,
): Promise<Verdict> {
  const [l] = await db
    .select({ nama: listing.nama, deskripsi: listing.deskripsi, urlNormal: listing.urlNormal, status: listing.status })
    .from(listing)
    .where(eq(listing.id, listingId))
    .limit(1);
  if (!l) return "ragu";

  const v = await ai.classify({ nama: l.nama, deskripsi: l.deskripsi ?? "", url: l.urlNormal });

  return db.transaction(async (tx) => {
    if (v.verdict === "tolak" && l.status === "tayang") {
      await tx.update(listing).set({ status: "ditahan" }).where(eq(listing.id, listingId));
      await tx.update(listing).set({ status: "ditolak" }).where(eq(listing.id, listingId));
      await refundListing(tx, listingId, `moderasi-ai:${listingId}`);
      await logModerasi(tx, { listingId, aktor: "ai", keputusan: "tolak", alasan: v.alasan, sebelum: "tayang", sesudah: "ditolak" });
      return "tolak";
    }
    if (v.verdict === "ragu" && l.status === "tayang") {
      await tx.update(listing).set({ status: "ditahan" }).where(eq(listing.id, listingId));
      await logModerasi(tx, { listingId, aktor: "ai", keputusan: "tahan", alasan: v.alasan, sebelum: "tayang", sesudah: "ditahan" });
      return "ragu";
    }
    await logModerasi(tx, { listingId, aktor: "ai", keputusan: "lolos", alasan: v.alasan, sebelum: l.status, sesudah: l.status });
    return "lolos";
  });
}

// --- Human queue actions -----------------------------------------------------

export async function approveListing(db: Database, listingId: string, alasan = "disetujui manusia"): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.update(listing).set({ status: "tayang" }).where(eq(listing.id, listingId));
    await logModerasi(tx, { listingId, aktor: "manusia", keputusan: "lolos", alasan, sebelum: "ditahan", sesudah: "tayang" });
  });
}

export async function rejectListing(db: Database, listingId: string, alasan = "ditolak manusia"): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.update(listing).set({ status: "ditolak" }).where(eq(listing.id, listingId));
    await refundListing(tx, listingId, `moderasi-manual:${listingId}`);
    await logModerasi(tx, { listingId, aktor: "manusia", keputusan: "tolak", alasan, sebelum: "ditahan", sesudah: "ditolak" });
  });
}

/** Take a tayang listing down on a verified URL-ownership claim (§18.6). */
export async function turunkanListing(db: Database, listingId: string, alasan = "klaim pemilik URL"): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.update(listing).set({ status: "diturunkan" }).where(eq(listing.id, listingId));
    await refundListing(tx, listingId, `turunkan:${listingId}`);
    await logModerasi(tx, { listingId, aktor: "manusia", keputusan: "diturunkan", alasan, sebelum: "tayang", sesudah: "diturunkan" });
  });
}
