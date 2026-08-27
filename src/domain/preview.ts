/**
 * Listing preview (R2) — scrape title/description/logo from a URL to auto-fill
 * the manjat wizard. SSRF-guarded, 24h-cached, best-effort: the pay flow never
 * waits on this and a failure just yields a domain-name fallback.
 */
import { redis } from "@/lib/redis";
import { safeFetch } from "@/lib/ssrf";
import { normalizeUrl } from "./url";

function metaContent(html: string, patterns: RegExp[]): string | null {
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decode(m[1].trim());
  }
  return null;
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

export interface ParsedOg {
  title: string | null;
  description: string | null;
  logo: string | null;
}

/** Extract og/meta fields following R2's fallback chains. Pure. */
export function parseOg(html: string, baseUrl?: string): ParsedOg {
  const title =
    metaContent(html, [
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
    ]) ?? metaContent(html, [/<title[^>]*>([^<]+)<\/title>/i]);

  const description = metaContent(html, [
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
  ]);

  const logoRel = metaContent(html, [
    /<link[^>]+rel=["'][^"']*apple-touch-icon[^"']*["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*apple-touch-icon[^"']*["']/i,
    /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i,
  ]);
  const ogImage = metaContent(html, [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
  ]);
  const logoRaw = logoRel ?? ogImage;
  let logo: string | null = null;
  if (logoRaw && baseUrl) {
    try {
      logo = new URL(logoRaw, baseUrl).toString();
    } catch {
      logo = null;
    }
  }

  return { title, description, logo };
}

export interface Preview {
  urlNormal: string;
  nama: string;
  deskripsi: string | null;
  logoUrl: string | null;
}

const CACHE_TTL = 24 * 3600;

/** Best-effort preview for a URL. Cached 24h; social handles skip scraping. */
export async function getPreview(inputUrl: string): Promise<Preview> {
  const urlNormal = normalizeUrl(inputUrl); // may throw on bad/blocked scheme
  const fallbackName = urlNormal.split("/")[0];

  const r = redis();
  const cacheKey = `preview:${urlNormal}`;
  if (r) {
    try {
      const cached = await r.get(cacheKey);
      if (cached) return JSON.parse(cached) as Preview;
    } catch {
      /* cache miss on error */
    }
  }

  // Social handles (x.com/..., instagram, tiktok) block scrapers — skip (R2).
  const social = /^(x\.com|instagram\.com|tiktok\.com)\//.test(urlNormal);
  let preview: Preview = { urlNormal, nama: fallbackName, deskripsi: null, logoUrl: null };

  if (!social) {
    try {
      const { finalUrl, html, contentType } = await safeFetch(`https://${urlNormal}`);
      if (contentType.includes("html")) {
        const og = parseOg(html, finalUrl);
        preview = {
          urlNormal,
          nama: og.title ?? fallbackName,
          deskripsi: og.description?.slice(0, 160) ?? null,
          logoUrl: og.logo,
        };
      }
    } catch {
      // Unreachable / blocked / SSRF on redirect → keep the fallback.
    }
  }

  if (r) {
    try {
      await r.set(cacheKey, JSON.stringify(preview), "EX", CACHE_TTL);
    } catch {
      /* best effort */
    }
  }
  return preview;
}
