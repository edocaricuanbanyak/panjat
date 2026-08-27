import { NextResponse } from "next/server";
import { suggestDescription } from "@/lib/anthropic";
import { clientIp } from "@/lib/ip";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

/** POST /api/saran { url, nama } — AI description suggestion (R18). Best-effort. */
export async function POST(req: Request) {
  const rl = await rateLimit(`saran:${clientIp(req.headers)}`, 10, 60);
  if (!rl.ok) return NextResponse.json({ deskripsi: null }, { status: 429 });

  let body: { url?: unknown; nama?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ deskripsi: null });
  }
  const url = typeof body.url === "string" ? body.url : "";
  const nama = typeof body.nama === "string" ? body.nama : url;
  if (!url) return NextResponse.json({ deskripsi: null });

  const out = await suggestDescription({ nama, url });
  return NextResponse.json({ deskripsi: out?.deskripsi ?? null });
}
