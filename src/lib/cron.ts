import { timingSafeEqual } from "node:crypto";

/**
 * Guard for scheduler-triggered routes. Vercel Cron attaches
 * `Authorization: Bearer <CRON_SECRET>` to every invocation when the
 * `CRON_SECRET` env var is set (https://vercel.com/docs/cron-jobs/manage#securing-cron-jobs).
 *
 * Fail closed: if `CRON_SECRET` is unset the route is misconfigured, not open —
 * these jobs move money-adjacent state (rosot ledger, champion archive), so an
 * unauthenticated caller must never reach them.
 */
export function assertCron(req: Request): { ok: true } | { ok: false; status: number; error: string } {
  const secret = process.env.CRON_SECRET;
  if (!secret) return { ok: false, status: 503, error: "CRON_SECRET belum diset" };

  const header = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  // Length-independent, constant-time compare.
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, status: 401, error: "Tidak sah" };
  }
  return { ok: true };
}
