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
  kategoriSlug: string | null;
}

// Keyword → category guess (best-effort; user can change it).
const KATEGORI_KEYWORDS: [string, RegExp][] = [
  ["ai-tools", /\b(ai|gpt|llm|machine learning|chatbot|generatif|generative)\b/i],
  ["fintech", /\b(keuangan|pembayaran|dompet|invoice|pinjam|fintech|bank|finansial)\b/i],
  ["ecommerce", /\b(toko|belanja|jual|beli|produk|e-?commerce|katalog|olshop)\b/i],
  ["edukasi", /\b(belajar|kursus|edukasi|sekolah|siswa|tryout|utbk|les|kelas)\b/i],
  ["game", /\b(game|gim|bermain|gaming)\b/i],
  ["konten", /\b(konten|artikel|blog|video|podcast|media|berita|newsletter)\b/i],
  ["produktivitas", /\b(produktivitas|catatan|to-?do|tugas|jadwal|absensi|notes?)\b/i],
  ["komunitas", /\b(komunitas|forum|grup|kumpul|community)\b/i],
  ["marketplace", /\b(marketplace|platform jual)\b/i],
  ["jasa", /\b(jasa|layanan|service|freelance)\b/i],
  ["saas", /\b(saas|aplikasi|dashboard|kasir|pos|crm|erp|manajemen|tools?)\b/i],
];

function guessKategori(text: string): string | null {
  for (const [slug, re] of KATEGORI_KEYWORDS) if (re.test(text)) return slug;
  return null;
}

// First-path segments on social hosts that are NOT usernames.
const NON_HANDLE = new Set([
  "p", "reel", "reels", "explore", "stories", "story", "tv", "about", "home",
  "search", "hashtag", "tag", "i", "messages", "settings", "live", "foryou",
  "following", "followers", "accounts", "direct",
]);

/**
 * For an Instagram/TikTok/X profile URL, the "@handle" (used as the listing
 * title + the "sosial" category). Null for non-social or non-profile paths
 * (posts, reels, etc.), so those fall back to normal scraping.
 */
export function socialHandle(urlNormal: string): string | null {
  const m = urlNormal.match(
    /^(?:www\.)?(?:instagram\.com|tiktok\.com|x\.com|twitter\.com)\/@?([a-z0-9_.]+)/i,
  );
  if (!m) return null;
  const handle = m[1].toLowerCase();
  if (!handle || NON_HANDLE.has(handle)) return null;
  return `@${handle}`;
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

  // Social profiles: title = @handle, category = Media Sosial (both reliable
  // from the URL). Bio + photo are best-effort from the fetch below.
  const social = socialHandle(urlNormal);
  let preview: Preview = {
    urlNormal,
    nama: social ?? fallbackName,
    deskripsi: null,
    logoUrl: null,
    kategoriSlug: social ? "sosial" : guessKategori(urlNormal),
  };

  {
    try {
      // A browser-compatible UA — many sites (incl. Instagram/TikTok profiles)
      // only return og:image/meta to a browser-like agent, so this gives social
      // profile photos + bios a chance. Still best-effort: blocked/login-walled
      // hosts fall through (the manual image/description fields are the fallback).
      const { finalUrl, html, contentType } = await safeFetch(`https://${urlNormal}`, {
        userAgent: "Mozilla/5.0 (compatible; PanjatBot/1.0; +https://panjat.id)",
      });
      if (contentType.includes("html")) {
        const og = parseOg(html, finalUrl);
        // For social, keep the clean @handle + sosial category; fill bio + photo.
        const nama = social ?? og.title ?? fallbackName;
        const deskripsi = og.description?.slice(0, 160) ?? null;
        preview = {
          urlNormal,
          nama,
          deskripsi,
          logoUrl: og.logo,
          kategoriSlug: social ? "sosial" : guessKategori(`${nama} ${deskripsi ?? ""} ${urlNormal}`),
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
