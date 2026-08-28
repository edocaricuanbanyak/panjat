import { getPreview } from "@/domain/preview";
import { safeFetchBuffer } from "@/lib/ssrf";

/**
 * Resolve a listing's real site logo to an `<img>`/satori-safe PNG buffer.
 *
 * Tries the page-declared icon first (og:image / apple-touch / `<link rel=icon>`,
 * via the cached SSRF-guarded preview), then common favicon paths, then Google's
 * favicon service. Every source is normalised through sharp → PNG, because many
 * favicons are ICO/WebP — or, worse, an SPA returns its `index.html` for a missing
 * `/favicon.ico` (HTTP 200 `text/html`), which never decodes as an image. sharp
 * rejects those, so we fall through to the next candidate. Returns null on total
 * failure (caller shows the neutral letter tile). This is the one resolver shared
 * by the OG card and the board's `/api/logo/[listing]` endpoint, so both agree.
 */
export async function resolveSiteLogoPng(
  urlNormal: string,
  hostname: string,
  size = 384,
): Promise<Buffer | null> {
  const sharp = await import("sharp").then((m) => m.default).catch(() => null);
  if (!sharp) return null;

  const candidates: string[] = [];
  try {
    const pv = await getPreview(urlNormal);
    if (pv.logoUrl) candidates.push(pv.logoUrl);
  } catch {
    // preview is best-effort
  }
  if (hostname) {
    candidates.push(
      `https://${hostname}/apple-touch-icon.png`,
      `https://${hostname}/apple-touch-icon-precomposed.png`,
      `https://${hostname}/favicon.png`,
      `https://www.google.com/s2/favicons?domain=${hostname}&sz=256`,
    );
  }
  for (const src of candidates) {
    try {
      const { buffer } = await safeFetchBuffer(src, { timeoutMs: 2500 });
      return await sharp(buffer)
        .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
    } catch {
      // try the next candidate
    }
  }
  return null;
}
