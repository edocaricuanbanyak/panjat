/**
 * URL normalization (R2) — enforces one-URL-one-listing. Two inputs that point
 * at the same destination must produce the same `url_normal`.
 */

const TRACKING_PARAMS = [/^utm_/i, /^fbclid$/i, /^igsh$/i, /^gclid$/i];

/** Host aliases that mean the same place. */
function canonicalHost(host: string): string {
  let h = host.toLowerCase();
  if (h.startsWith("www.")) h = h.slice(4);
  if (h === "twitter.com" || h === "mobile.twitter.com") h = "x.com";
  return h;
}

/**
 * Returns a canonical `host/path` string (no scheme, no tracking params, no
 * fragment, no trailing slash). Throws on non-http(s) input (§18.1).
 *
 * A bare `@handle` maps to `x.com/<handle>` — a documented default (X is the
 * dev-Twitter platform); full IG/TikTok handle disambiguation ships with the
 * preview slice.
 */
export function normalizeUrl(input: string): string {
  const raw = input.trim();
  if (!raw) throw new Error("URL kosong");

  // Bare social handle, e.g. "@budi".
  if (raw.startsWith("@")) {
    const handle = raw.slice(1).toLowerCase();
    if (!/^[a-z0-9_.]+$/.test(handle)) throw new Error(`Handle tidak valid: ${input}`);
    return `x.com/${handle}`;
  }

  // Reject dangerous/unsupported schemes outright (§18.1, R2: http/https only).
  if (/^(javascript|data|file|ftp|mailto|vbscript|tel):/i.test(raw)) {
    throw new Error(`Skema tidak didukung: ${input}`);
  }

  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let u: URL;
  try {
    u = new URL(withScheme);
  } catch {
    throw new Error(`URL tidak valid: ${input}`);
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error(`Skema tidak didukung: ${u.protocol}`);
  }

  const host = canonicalHost(u.hostname);

  // Drop tracking params, keep the rest sorted for stability.
  const params = [...u.searchParams.entries()]
    .filter(([k]) => !TRACKING_PARAMS.some((re) => re.test(k)))
    .sort(([a], [b]) => a.localeCompare(b));
  const query = params.length
    ? "?" + params.map(([k, v]) => `${k}=${v}`).join("&")
    : "";

  let path = u.pathname.replace(/\/+$/, ""); // strip trailing slashes
  if (path === "/") path = "";

  return `${host}${path}${query}`;
}
