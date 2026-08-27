import { NextResponse } from "next/server";
import { getPreview } from "@/domain/preview";
import { clientIp } from "@/lib/ip";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

/**
 * GET /api/preview?url= — best-effort listing preview for the wizard (R2).
 * SSRF-guarded, cached; rate-limited so it can't be abused as a scraping proxy
 * (§18.4). The pay flow never waits on this.
 */
export async function GET(req: Request) {
  const ip = clientIp(req.headers);
  const rl = await rateLimit(`preview:${ip}`, 10, 60);
  if (!rl.ok) {
    return NextResponse.json({ error: "Terlalu banyak permintaan" }, { status: 429 });
  }

  const url = new URL(req.url).searchParams.get("url") ?? "";
  if (!url.trim()) {
    return NextResponse.json({ error: "url wajib" }, { status: 400 });
  }

  try {
    const preview = await getPreview(url);
    return NextResponse.json(preview);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "URL tidak valid" },
      { status: 400 },
    );
  }
}
