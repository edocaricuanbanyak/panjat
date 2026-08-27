/**
 * Listing screenshot worker (R21). A headless Chromium (Playwright) captures the
 * target site, NEVER an iframe. Second SSRF surface after /api/preview: resolve
 * DNS and reject private/link-local/metadata IPs before navigating, cap the
 * timeout, block downloads. Social listings are skipped (consistent with R2).
 *
 * Best-effort: any failure (blocked host, timeout, blank/cookie-wall page, no
 * browser installed) returns null so the listing goes live without a screenshot
 * and the UI falls back to og:image → logo. Never blocks payment or publishing.
 *
 * Storage here is local (`public/screenshots`) for dev; production should swap
 * `store()` for object storage + CDN. Output is JPEG (~100–200KB); WebP needs a
 * transcoder (sharp) — a follow-up.
 */
import dns from "node:dns/promises";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { isPrivateIp } from "./ssrf";

const VIEWPORT = { width: 1200, height: 800 };
const NAV_TIMEOUT_MS = 15_000;
const SOCIAL = /^(x\.com|twitter\.com|instagram\.com|tiktok\.com|facebook\.com)\//i;
const STORE_DIR = path.join(process.cwd(), "public", "screenshots");

/** Resolve the host and reject if ANY address is private/link-local/metadata. */
async function hostIsSafe(hostname: string): Promise<boolean> {
  try {
    const addrs = await dns.lookup(hostname, { all: true });
    return addrs.length > 0 && addrs.every((a) => !isPrivateIp(a.address));
  } catch {
    return false;
  }
}

/** Capture `url` to a JPEG buffer, or null on any failure. */
export async function capture(url: string): Promise<Buffer | null> {
  const normal = url.replace(/^https?:\/\//, "");
  if (SOCIAL.test(normal)) return null;

  let target: URL;
  try {
    target = new URL(url.startsWith("http") ? url : `https://${url}`);
  } catch {
    return null;
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") return null;
  if (!(await hostIsSafe(target.hostname))) return null;

  // Import Playwright lazily so a missing browser never breaks the build/route.
  let chromium: typeof import("playwright").chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    return null;
  }

  const browser = await chromium
    .launch({ headless: true, args: ["--disable-dev-shm-usage"] })
    .catch(() => null);
  if (!browser) return null;

  try {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      acceptDownloads: false,
      javaScriptEnabled: true,
    });
    // Belt-and-braces: abort any sub-request that resolves to a private IP.
    await context.route("**/*", async (route) => {
      try {
        const host = new URL(route.request().url()).hostname;
        if (!(await hostIsSafe(host))) return route.abort();
      } catch {
        return route.abort();
      }
      return route.continue();
    });

    const page = await context.newPage();
    const resp = await page
      .goto(target.toString(), { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT_MS })
      .catch(() => null);
    if (!resp || !resp.ok()) return null;

    // Let above-the-fold settle, then snap the viewport.
    await page.waitForTimeout(1200);
    const buf = await page.screenshot({ type: "jpeg", quality: 72, fullPage: false });
    return buf;
  } catch {
    return null;
  } finally {
    await browser.close().catch(() => {});
  }
}

/** Capture + persist for a listing. Returns the public URL, or null. */
export async function captureAndStore(listingId: string, url: string): Promise<string | null> {
  const buf = await capture(url);
  if (!buf) return null;
  try {
    await mkdir(STORE_DIR, { recursive: true });
    await writeFile(path.join(STORE_DIR, `${listingId}.jpg`), buf);
    return `/screenshots/${listingId}.jpg`;
  } catch {
    return null;
  }
}
