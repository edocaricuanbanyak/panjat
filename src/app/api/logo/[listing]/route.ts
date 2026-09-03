import { eq } from "drizzle-orm";
import { db } from "@/db";
import { listing } from "@/db/schema";
import { resolveSiteLogoPng } from "@/lib/site-logo";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Logos rarely change; cache hard and serve stale while revalidating.
const CACHE = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

/**
 * GET /api/logo/[id] — the listing's real site logo as a PNG, resolved server-side
 * with the same chain the OG card uses (page-declared icon → common favicon paths
 * → Google favicon service, each normalised through sharp). The board's naive
 * `<host>/favicon.ico` guess misses sites that only declare their icon via
 * `<link rel=icon>` or that serve an SPA `index.html` for a missing favicon — this
 * endpoint doesn't, so the board matches the form's preview. 404 → letter tile.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ listing: string }> }) {
  const { listing: id } = await params;
  if (!UUID.test(id)) return new Response("Not found", { status: 404 });

  const [l] = await db
    .select({ urlNormal: listing.urlNormal, logoPath: listing.logoPath })
    .from(listing)
    .where(eq(listing.id, id))
    .limit(1);
  if (!l) return new Response("Not found", { status: 404 });

  let hostname = "";
  try {
    hostname = new URL(l.urlNormal.startsWith("http") ? l.urlNormal : `https://${l.urlNormal}`).hostname;
  } catch {
    hostname = "";
  }

  const png = await resolveSiteLogoPng(l.urlNormal, hostname, 128, l.logoPath);
  // Cache the "no logo" verdict too — resolving it is expensive (preview + fetch +
  // sharp), so re-running it on every board render for a site with no icon is waste.
  if (!png) return new Response("No logo", { status: 404, headers: { "Cache-Control": CACHE } });

  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": CACHE },
  });
}
