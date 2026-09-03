import { resolveSiteLogoPng } from "@/lib/site-logo";
import { imageUrlOrNull, normalizeUrl } from "@/domain/url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Short cache — this is a pre-submit preview, not a stable per-listing asset.
const CACHE = "public, max-age=300";

/**
 * GET /api/logo-preview?url=<site>&img=<image> — resolve a card image the SAME way
 * the board will (resolveSiteLogoPng: SSRF-guard → sharp → PNG, image override
 * first), so the manjat step-2 confirmation preview reflects exactly what the
 * board would show. 404 → the form falls back to the letter tile.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const img = imageUrlOrNull(searchParams.get("img"));

  let urlNormal = "";
  let hostname = "";
  try {
    urlNormal = normalizeUrl(searchParams.get("url") ?? "");
    hostname = new URL(urlNormal.startsWith("http") ? urlNormal : `https://${urlNormal}`).hostname;
  } catch {
    // no/invalid site url → resolve from the image override alone
  }
  if (!urlNormal && !img) return new Response("Bad request", { status: 400 });

  const png = await resolveSiteLogoPng(urlNormal, hostname, 128, img);
  if (!png) return new Response("No logo", { status: 404, headers: { "Cache-Control": CACHE } });

  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": CACHE },
  });
}
