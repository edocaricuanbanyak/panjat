import { copy } from "@/copy";
import { clientIp } from "@/lib/ip";
import { rateLimit } from "@/lib/ratelimit";
import { capture } from "@/lib/screenshot";

export const runtime = "nodejs";

/**
 * GET /api/preview-shot?url= — on-demand site screenshot for the manjat
 * confirmation step (R21 placement 1), so the sponsor sees their own site before
 * paying and never complains about a mistyped URL. Heavy (headless browser), so
 * rate-limited; the pay flow never waits on it (loaded as an <img>, hidden on
 * error). Returns image/jpeg or 404 when capture isn't possible.
 */
export async function GET(req: Request) {
  const rl = await rateLimit(`shot-preview:${clientIp(req.headers)}`, 5, 60);
  if (!rl.ok) {
    return new Response(copy.error.terlaluBanyakPermintaan, { status: 429 });
  }

  const url = new URL(req.url).searchParams.get("url") ?? "";
  if (!url.trim()) return new Response("url wajib", { status: 400 });

  const buf = await capture(url);
  if (!buf) return new Response("not available", { status: 404 });

  return new Response(new Uint8Array(buf), {
    status: 200,
    headers: {
      "content-type": "image/webp",
      // Short-lived: fine to re-capture on a later visit; keeps it out of shared caches.
      "cache-control": "private, max-age=600",
    },
  });
}
