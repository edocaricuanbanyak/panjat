/**
 * URL normalization (R2) — enforces one-URL-one-listing. Two inputs that point
 * at the same destination must produce the same `url_normal`.
 */

const TRACKING_PARAMS = [/^utm_/i, /^fbclid$/i, /^igsh$/i, /^gclid$/i];

/** Host aliases that mean the same place. */
function canonicalHost(host: string): string {
  let h = host.toLowerCase();
  // Strip a leading run of w's: www., and typo variants like wwww. / ww. that
  // would otherwise create a duplicate listing for the same site.
  h = h.replace(/^w{2,}\./, "");
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
/** A visitor-supplied image URL (e.g. a profile photo) → normalized http/https
 *  string, or null if empty/invalid. The bytes are SSRF-guarded + rasterized
 *  later by resolveSiteLogoPng, so this only gates scheme + shape. */
export function imageUrlOrNull(input: string | null | undefined): string | null {
  const raw = input?.trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export function normalizeUrl(input: string, opts: { allowSelf?: boolean } = {}): string {
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

  // Panjat never lists itself — self-promo on its own board reads as fake stock
  // and discourages real makers from paying/overtaking. Reject panjat.id and any
  // subdomain (matches the site host used in middleware). The takedown job passes
  // allowSelf so it can still resolve an already-created self-listing to remove it.
  if (!opts.allowSelf && (host === "panjat.id" || host.endsWith(".panjat.id"))) {
    throw new Error("panjat.id tidak bisa dipasang di papannya sendiri");
  }

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
