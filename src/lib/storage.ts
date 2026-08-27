/**
 * Screenshot storage (R21). One place that decides where a captured screenshot
 * lives: Vercel Blob (own object storage + CDN) in production when
 * BLOB_READ_WRITE_TOKEN is set, or the local `public/screenshots` dir in dev.
 * Returns a public URL, or null on failure — callers treat null as "no
 * screenshot" and fall back to og:image/logo.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const LOCAL_DIR = path.join(process.cwd(), "public", "screenshots");

export async function storeScreenshot(id: string, buf: Buffer): Promise<string | null> {
  const key = `screenshots/${id}.webp`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { put } = await import("@vercel/blob");
      const { url } = await put(key, buf, {
        access: "public",
        contentType: "image/webp",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      return url;
    } catch {
      // Fall through to local so a Blob outage doesn't lose the capture in dev.
    }
  }

  try {
    await mkdir(LOCAL_DIR, { recursive: true });
    await writeFile(path.join(LOCAL_DIR, `${id}.webp`), buf);
    return `/${key}`;
  } catch {
    return null;
  }
}
