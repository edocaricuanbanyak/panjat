import { ImageResponse } from "next/og";
import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { kategori, listing } from "@/db/schema";
import { loadOgConfig } from "@/domain/config";
import { kategoriIconDataUri } from "@/lib/kategori-svg";
import { resolveSiteLogoPng } from "@/lib/site-logo";

export const runtime = "nodejs";

/**
 * The body visual: the site screenshot (framed design) when allowed + present,
 * else the site logo. `kind` picks the framing; null → a letter tile.
 */
async function resolveHero(
  origin: string,
  urlNormal: string,
  hostname: string,
  screenshotUrl: string | null,
  showShot: boolean,
): Promise<{ dataUri: string; kind: "shot" | "logo" } | null> {
  const sharp = await import("sharp").then((m) => m.default).catch(() => null);
  if (!sharp) return null;

  if (showShot && screenshotUrl) {
    try {
      const abs = screenshotUrl.startsWith("http") ? screenshotUrl : `${origin}${screenshotUrl}`;
      const res = await fetch(abs, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const jpeg = await sharp(Buffer.from(await res.arrayBuffer())).jpeg({ quality: 80 }).toBuffer();
        return { dataUri: `data:image/jpeg;base64,${jpeg.toString("base64")}`, kind: "shot" };
      }
    } catch {
      // fall through to the logo
    }
  }
  const logo = await resolveSiteLogoPng(urlNormal, hostname);
  if (logo) return { dataUri: `data:image/png;base64,${logo.toString("base64")}`, kind: "logo" };
  return null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Design tokens, inlined — satori resolves concrete values, not CSS vars (§9.6.2).
const KERTAS1 = "#ffffff";
const KERTAS2 = "#e9e4d8";
const TINTA = "#1f1b16";
const REDUP = "#7a7267";
const GARIS = "#d8d2c4";
const MERAH = "#da2e20";

// The Panjat brand mark (src/app/icon.svg) as a satori-safe SVG data URI.
const PANJAT_MARK = `data:image/svg+xml;base64,${Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#1f1b16"/><rect x="14" y="6" width="4" height="21.5" rx="2" fill="#f3f0e9"/><path d="M18 6.6 L27 10 L18 13.4 Z" fill="#da2e20"/><circle cx="16" cy="20" r="3.1" fill="#da2e20"/><circle cx="16" cy="20" r="1.3" fill="#1f1b16"/></svg>',
).toString("base64")}`;

// A globe glyph in the given colour — reads as "this is the URL being climbed".
const globeDataUri = (color: string) =>
  `data:image/svg+xml;base64,${Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18"/></svg>`,
  ).toString("base64")}`;

const CACHE = "public, max-age=300, s-maxage=600, stale-while-revalidate=86400";

/** `?shot=0|1`, `?logo=0|1` — per-card override of the config default. */
function boolParam(v: string | null): boolean | undefined {
  if (v === "0" || v === "false") return false;
  if (v === "1" || v === "true") return true;
  return undefined;
}
/** `?rank=`, `?total=` — pin the number to the shared moment (display-only). */
function intParam(v: string | null): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : undefined;
}
/** Trim a pitch to a per-ratio budget so it never overflows the card. */
function clampText(s: string | null, n: number): string | null {
  if (!s || n <= 0) return null;
  const t = s.trim();
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
}

/**
 * GET /api/og/[id] — share card. Structure: TOP = Panjat logo (left) + rank #N
 * (right); BODY = the visual (framed screenshot, or the site's URL logo — the
 * Screenshot/Logo switcher) plus name + the highlighted URL pill (the climbed
 * link, the card's hero) + category/pitch; BOTTOM = the tier stat + panjat.id,
 * kept small. Personalised by tier (gold summit, silver/bronze podium, merah).
 *  - default 1200×630 (link unfurl); ?ratio=9x16|1x1|4x3|16x9 (or ?story=1).
 *  - ?rank=&total= pin the standings to the shared moment (else computed live).
 *  - ?shot=&logo= override the toggles per card.
 */
export async function GET(req: Request, { params }: { params: Promise<{ listing: string }> }) {
  const { listing: id } = await params;
  if (!UUID.test(id)) return new Response("Not found", { status: 404 });
  const url = new URL(req.url);
  const story = url.searchParams.get("story") === "1";
  const ratio = url.searchParams.get("ratio"); // 9x16 | 1x1 | 4x3 | 16x9

  const [l] = await db
    .select({
      nama: listing.nama,
      deskripsi: listing.deskripsi,
      urlNormal: listing.urlNormal,
      pegangan: listing.peganganCached,
      status: listing.status,
      screenshotUrl: listing.screenshotUrl,
      kategoriNama: kategori.nama,
      kategoriSlug: kategori.slug,
    })
    .from(listing)
    .leftJoin(kategori, eq(kategori.id, listing.kategoriId))
    .where(eq(listing.id, id))
    .limit(1);
  if (!l || l.status !== "tayang") return new Response("Not found", { status: 404 });

  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(listing)
    .where(and(eq(listing.status, "tayang"), gt(listing.peganganCached, l.pegangan)));
  const [{ total: liveTotal }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(listing)
    .where(eq(listing.status, "tayang"));

  const rank = intParam(url.searchParams.get("rank")) ?? Number(n) + 1;
  const total = Math.max(rank, intParam(url.searchParams.get("total")) ?? Number(liveTotal));
  const menyalip = Math.max(0, total - rank);

  const og = await loadOgConfig(db);
  const showShot = boolParam(url.searchParams.get("shot")) ?? og.tampilkanScreenshot;

  let hostname = "";
  try {
    hostname = new URL(l.urlNormal.startsWith("http") ? l.urlNormal : `https://${l.urlNormal}`).hostname;
  } catch {
    hostname = "";
  }
  const host = l.urlNormal.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const bigName = l.nama.length > 22 ? `${l.nama.slice(0, 21)}…` : l.nama;

  const hero = await resolveHero(url.origin, l.urlNormal, hostname, l.screenshotUrl, showShot);
  const kind: "shot" | "logo" | "tile" = hero?.kind ?? "tile";

  // Tier — the only place rank affects colour (gold/silver/bronze summit, merah climb).
  const tier =
    rank === 1
      ? { accent: MERAH, wash: "linear-gradient(180deg, #f8edca 0%, #f3f0e9 60%)", stat: `Teratas dari ${total} pemanjat` }
      : rank === 2
        ? { accent: "#6f6f6f", wash: "linear-gradient(180deg, #ececec 0%, #f3f0e9 60%)", stat: `Menyalip ${menyalip} pemanjat` }
        : rank === 3
          ? { accent: "#a5622f", wash: "linear-gradient(180deg, #f3e1d2 0%, #f3f0e9 60%)", stat: `Menyalip ${menyalip} pemanjat` }
          : { accent: MERAH, wash: "linear-gradient(180deg, #fbe3df 0%, #f3f0e9 60%)", stat: `Menyalip ${menyalip} pemanjat` };

  // Per-ratio presets. `land` → body is a row (visual left, text right); else the
  // body stacks (visual on top). heroW/heroH size the body visual.
  const PRESETS: Record<
    string,
    {
      w: number; h: number; land: boolean; pad: string;
      heroW: number; heroH: number; nameF: number; gap: number;
      kategori: boolean; tagline: boolean; desc: number; descF: number;
    }
  > = {
    "9x16": { w: 1080, h: 1920, land: false, pad: "92px 84px", heroW: 840, heroH: 680, nameF: 88, gap: 40, kategori: true, tagline: true, desc: 150, descF: 31 },
    "1x1": { w: 1080, h: 1080, land: false, pad: "60px 74px", heroW: 620, heroH: 396, nameF: 68, gap: 24, kategori: true, tagline: false, desc: 92, descF: 26 },
    "4x3": { w: 1200, h: 900, land: false, pad: "58px 84px", heroW: 1032, heroH: 300, nameF: 64, gap: 24, kategori: true, tagline: false, desc: 104, descF: 26 },
    "16x9": { w: 1200, h: 675, land: true, pad: "52px 72px", heroW: 470, heroH: 372, nameF: 58, gap: 48, kategori: false, tagline: false, desc: 76, descF: 25 },
    default: { w: 1200, h: 630, land: true, pad: "48px 66px", heroW: 430, heroH: 340, nameF: 56, gap: 44, kategori: false, tagline: false, desc: 0, descF: 0 },
  };
  const P = PRESETS[ratio ?? ""] ?? (story ? PRESETS["9x16"] : PRESETS.default);
  const deskripsi = clampText(l.deskripsi, P.desc);

  // ── TOP: Panjat logo (left) + rank #N (right) ─────────────────────────────
  const markSz = P.land ? 52 : 62;
  const topBar = (
    <div style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* biome-ignore lint/performance/noImgElement: satori renders to a raster, not the DOM */}
        <img src={PANJAT_MARK} width={markSz} height={markSz} alt="" />
        <div style={{ display: "flex", fontSize: P.land ? 34 : 40, fontWeight: 800, letterSpacing: -1, color: TINTA }}>
          Panjat
        </div>
      </div>
      <div style={{ display: "flex", fontSize: P.land ? 52 : 64, fontWeight: 800, letterSpacing: -1, color: tier.accent }}>
        #{rank}
      </div>
    </div>
  );

  // ── BODY visual: framed screenshot / bare site logo / letter tile ─────────
  const shotVisual = (
    <div
      style={{
        display: "flex",
        width: P.heroW,
        height: P.heroH,
        borderRadius: 24,
        overflow: "hidden",
        border: `3px solid ${tier.accent}`,
        boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
        background: KERTAS1,
        flexShrink: 0,
      }}
    >
      {/* biome-ignore lint/performance/noImgElement: satori renders to a raster, not the DOM */}
      {/* contain, not cover: show the whole screenshot (letterboxed on KERTAS1) so nothing is cropped */}
      <img src={hero?.dataUri} width={P.heroW} height={P.heroH} style={{ objectFit: "contain" }} alt="" />
    </div>
  );
  // Logo/tile hug their own size (no empty hero box) so portrait cards stay tight.
  const logoSz = P.land ? 288 : Math.min(360, Math.round(P.w * 0.33));
  const logoVisual = (
    // biome-ignore lint/performance/noImgElement: satori renders to a raster, not the DOM
    <img
      src={hero?.dataUri}
      width={logoSz}
      height={logoSz}
      style={{ objectFit: "contain", borderRadius: 28, flexShrink: 0 }}
      alt=""
    />
  );
  const tileSz = logoSz;
  const tileVisual = (
    <div
      style={{
        display: "flex",
        width: tileSz,
        height: tileSz,
        borderRadius: 28,
        border: `1px solid ${GARIS}`,
        background: KERTAS2,
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.round(tileSz * 0.5),
        fontWeight: 800,
        color: TINTA,
        flexShrink: 0,
      }}
    >
      {(l.nama.trim()[0] ?? "?").toUpperCase()}
    </div>
  );
  const visual = kind === "shot" ? shotVisual : kind === "logo" ? logoVisual : tileVisual;

  // The URL being climbed — the hero of the card. An address-bar-style pill in
  // dark ink so it reads as a link and outweighs everything but the name.
  const hostLabel = host.length > 30 ? `${host.slice(0, 29)}…` : host;
  const urlF = P.land ? 32 : 37;
  const globeSz = Math.round(urlF * 0.9);
  const urlChip = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 13,
        padding: P.land ? "9px 22px" : "12px 26px",
        borderRadius: 999,
        background: KERTAS1,
        border: `2px solid ${TINTA}`,
        boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
        maxWidth: "100%",
      }}
    >
      {/* biome-ignore lint/performance/noImgElement: satori renders to a raster, not the DOM */}
      <img src={globeDataUri(TINTA)} width={globeSz} height={globeSz} alt="" />
      <div style={{ display: "flex", fontSize: urlF, fontWeight: 700, letterSpacing: -0.5, color: TINTA }}>
        {hostLabel}
      </div>
    </div>
  );

  const kategoriChip =
    P.kategori && l.kategoriNama ? (
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: REDUP, fontSize: 27 }}>
        {/* biome-ignore lint/performance/noImgElement: satori renders to a raster, not the DOM */}
        <img src={kategoriIconDataUri(l.kategoriSlug, REDUP, 29)} width={29} height={29} alt="" />
        <div style={{ display: "flex" }}>{l.kategoriNama}</div>
      </div>
    ) : null;
  const deskripsiBlock = deskripsi ? (
    <div style={{ display: "flex", fontSize: P.descF, lineHeight: 1.3, color: REDUP, maxWidth: P.land ? "100%" : 860 }}>
      {deskripsi}
    </div>
  ) : null;

  const textCol = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        minWidth: 0,
        alignItems: P.land ? "flex-start" : "center",
      }}
    >
      <div style={{ display: "flex", fontSize: P.nameF, fontWeight: 800, lineHeight: 1.0, color: TINTA }}>{bigName}</div>
      {urlChip}
      {kategoriChip}
      {deskripsiBlock}
    </div>
  );

  const body = P.land ? (
    <div style={{ display: "flex", flex: 1, alignItems: "center", gap: P.gap, minWidth: 0 }}>
      {visual}
      <div style={{ display: "flex", flex: 1, minWidth: 0 }}>{textCol}</div>
    </div>
  ) : (
    <div
      style={{
        display: "flex",
        flex: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: P.gap,
        textAlign: "center",
      }}
    >
      {visual}
      {textCol}
    </div>
  );

  // ── BOTTOM: tier stat (left) + panjat.id (right) ──────────────────────────
  const bottomBar = (
    <div style={{ display: "flex", width: "100%", alignItems: "baseline", justifyContent: "space-between" }}>
      <div style={{ display: "flex", fontSize: P.land ? 25 : 29, fontWeight: 700, color: tier.accent }}>{tier.stat}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        {P.tagline && <div style={{ display: "flex", fontSize: 20, color: REDUP }}>papan peringkat berbayar</div>}
        <div style={{ display: "flex", fontSize: P.land ? 25 : 28, fontWeight: 800, color: MERAH }}>panjat.id</div>
      </div>
    </div>
  );

  const card = (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: P.pad,
        backgroundImage: tier.wash,
        color: TINTA,
        fontFamily: "sans-serif",
      }}
    >
      {topBar}
      {body}
      {bottomBar}
    </div>
  );

  return new ImageResponse(card, { width: P.w, height: P.h, headers: { "Cache-Control": CACHE } });
}
