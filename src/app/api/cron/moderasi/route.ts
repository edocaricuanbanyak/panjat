import { NextResponse } from "next/server";
import { db } from "@/db";
import { assertCron } from "@/lib/cron";
import { moderateWithAI, pendingAiReview } from "@/domain/moderasi";
import { haikuModerator } from "@/lib/anthropic";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Cap per run so one invocation never times out; the rest wait for the next tick.
const MAX_PER_RUN = 20;

/**
 * Layer-2 AI moderation pass over live listings (R8). AI classifies; a human
 * makes the final decision on anything held (§18.5). Fail-safe: an AI error
 * resolves to `ragu` → hold, never auto-approve. Schedule: `30 * * * *`.
 */
export async function GET(req: Request) {
  const auth = assertCron(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const pending = (await pendingAiReview(db)).slice(0, MAX_PER_RUN);
  const results: { id: string; verdict: string }[] = [];
  for (const l of pending) {
    const verdict = await moderateWithAI(db, l.id, haikuModerator);
    results.push({ id: l.id, verdict });
  }
  return NextResponse.json({ ok: true, processed: results.length, results });
}
