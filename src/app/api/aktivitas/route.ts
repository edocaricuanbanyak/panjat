import { NextResponse } from "next/server";
import { recentAktivitas } from "@/lib/aktivitas";

// Cosmetic live feed for the Spotlight ticker (§6.4). Best-effort, never cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const items = await recentAktivitas(20);
  return NextResponse.json(items, { headers: { "cache-control": "no-store" } });
}
