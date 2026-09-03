/**
 * SSRF protection for outbound fetches (R2, §18.4). Only http/https; resolve DNS
 * and reject any private/link-local/metadata address; re-validate every redirect
 * hop; cap time and response size. The same guard the screenshot worker (R21)
 * will reuse.
 */
import { lookup } from "node:dns/promises";

/** True for loopback / private / link-local / metadata / unspecified addresses. */
export function isPrivateIp(ip: string): boolean {
  const addr = ip.trim().toLowerCase();

  // IPv4-mapped IPv6 (::ffff:1.2.3.4) → check the embedded v4.
  const mapped = addr.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIp(mapped[1]);

  if (addr.includes(":")) {
    // IPv6
    if (addr === "::1" || addr === "::") return true;
    if (addr.startsWith("fe80") || addr.startsWith("fe9") || addr.startsWith("fea") || addr.startsWith("feb"))
      return true; // fe80::/10 link-local
    const hi = addr.slice(0, 2);
    if (hi === "fc" || hi === "fd") return true; // fc00::/7 unique-local
    return false;
  }

  const p = addr.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true; // malformed → reject
  const [a, b] = p;
  if (a === 0 || a === 127 || a === 10) return true;
  if (a === 169 && b === 254) return true; // link-local incl. 169.254.169.254
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  return false;
}

async function assertPublicHost(host: string): Promise<void> {
  const addrs = await lookup(host, { all: true });
  if (addrs.length === 0) throw new Error("Host tidak dapat di-resolve");
  for (const a of addrs) {
    if (isPrivateIp(a.address)) throw new Error("Alamat internal ditolak (SSRF)");
  }
}

async function readCapped(res: Response, maxBytes: number): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > maxBytes) {
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks.map((c) => Buffer.from(c))));
}

async function readCappedBytes(res: Response, maxBytes: number): Promise<Buffer> {
  if (!res.body) return Buffer.alloc(0);
  const reader = res.body.getReader();
  const chunks: Buffer[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > maxBytes) {
      await reader.cancel();
      throw new Error("Respons terlalu besar");
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

export interface BufferResult {
  buffer: Buffer;
  contentType: string;
}

/**
 * Binary sibling of {@link safeFetch}: same SSRF guard + redirect re-validation,
 * but returns raw bytes (for images/logos) instead of decoding to text. Rejects
 * non-image content types and oversized bodies.
 */
export async function safeFetchBuffer(
  input: string,
  { maxBytes = 2_000_000, timeoutMs = 3000 }: { maxBytes?: number; timeoutMs?: number } = {},
): Promise<BufferResult> {
  let current = input;
  for (let hop = 0; hop <= 3; hop++) {
    const u = new URL(current);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      throw new Error("Skema tidak didukung");
    }
    await assertPublicHost(u.hostname);

    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    let res: Response;
    try {
      res = await fetch(current, {
        redirect: "manual",
        signal: ctl.signal,
        headers: { "user-agent": "PanjatBot/1.0 (+https://panjat.id)" },
      });
    } finally {
      clearTimeout(timer);
    }

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) throw new Error("Redirect tanpa Location");
      current = new URL(loc, current).toString(); // re-validated at loop top
      continue;
    }
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) throw new Error("Bukan gambar");
    return { buffer: await readCappedBytes(res, maxBytes), contentType };
  }
  throw new Error("Terlalu banyak redirect");
}

export interface FetchResult {
  finalUrl: string;
  html: string;
  contentType: string;
}

export async function safeFetch(
  input: string,
  {
    maxBytes = 1_000_000,
    timeoutMs = 3000,
    userAgent = "PanjatBot/1.0 (+https://panjat.id)",
  }: { maxBytes?: number; timeoutMs?: number; userAgent?: string } = {},
): Promise<FetchResult> {
  let current = input;
  for (let hop = 0; hop <= 3; hop++) {
    const u = new URL(current);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      throw new Error("Skema tidak didukung");
    }
    await assertPublicHost(u.hostname);

    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeoutMs);
    let res: Response;
    try {
      res = await fetch(current, {
        redirect: "manual",
        signal: ctl.signal,
        headers: { "user-agent": userAgent },
      });
    } finally {
      clearTimeout(timer);
    }

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) throw new Error("Redirect tanpa Location");
      current = new URL(loc, current).toString(); // re-validated at loop top
      continue;
    }
    return {
      finalUrl: current,
      html: await readCapped(res, maxBytes),
      contentType: res.headers.get("content-type") ?? "",
    };
  }
  throw new Error("Terlalu banyak redirect");
}
