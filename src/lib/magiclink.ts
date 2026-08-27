/**
 * One-time magic-link tokens (§18.2). Only the token hash is stored; the raw
 * token lives only inside the link. 256-bit entropy, 15-min expiry, single-use,
 * ≤3 issued per kontak per hour.
 */
import { randomBytes, createHash } from "node:crypto";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import type { Database } from "@/db";
import { magicLink } from "@/db/schema";

const TTL_MS = 15 * 60 * 1000;
const MAX_PER_HOUR = 3;

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

export class RateLimitedError extends Error {
  constructor() {
    super("Terlalu banyak permintaan tautan. Coba lagi dalam satu jam.");
  }
}

/** Issue a token for a kontak, enforcing the hourly cap. Returns the raw token. */
export async function issueToken(db: Database, kontakId: string, now = new Date()): Promise<string> {
  const hourAgo = new Date(now.getTime() - 3600_000);
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(magicLink)
    .where(and(eq(magicLink.kontakId, kontakId), gt(magicLink.createdAt, hourAgo)));
  if (count >= MAX_PER_HOUR) throw new RateLimitedError();

  const token = randomBytes(32).toString("hex"); // 256-bit
  await db.insert(magicLink).values({
    kontakId,
    tokenHash: hash(token),
    expiresAt: new Date(now.getTime() + TTL_MS),
  });
  return token;
}

/** Consume a token: valid, unexpired, unused → returns kontakId (and marks used). */
export async function consumeToken(
  db: Database,
  token: string,
  now = new Date(),
): Promise<string | null> {
  const [row] = await db
    .update(magicLink)
    .set({ usedAt: now })
    .where(
      and(
        eq(magicLink.tokenHash, hash(token)),
        isNull(magicLink.usedAt),
        gt(magicLink.expiresAt, now),
      ),
    )
    .returning({ kontakId: magicLink.kontakId });
  return row?.kontakId ?? null;
}
