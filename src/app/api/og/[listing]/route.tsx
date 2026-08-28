import { ImageResponse } from "next/og";
import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { listing } from "@/db/schema";
import { safeFetchBuffer } from "@/lib/ssrf";

export const runtime = "nodejs";

/**
 * Resolve a satori-safe hero image for the card: the site screenshot (our own
 * asset, transcoded WebP→JPEG) when present, else the site logo (a PNG favicon
 * variant, normalised through sharp). ICO/WebP don't render in satori, so every
 * source is piped through sharp to PNG/JPEG. Any failure returns null and the
 * card falls back to a drawn tier medallion — this must NEVER throw.
 */
async function heroImage(
  origin: string,
  hostname: string,
  screenshotUrl: string | null,
): Promise<{ dataUri: string; kind: "shot" | "logo" } | null> {
  const sharp = await import("sharp").then((m) => m.default).catch(() => null);
  if (!sharp) return null;

  if (screenshotUrl) {
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

  if (hostname) {
    for (const path of ["/apple-touch-icon.png", "/apple-touch-icon-precomposed.png", "/favicon.png"]) {
      try {
        const { buffer } = await safeFetchBuffer(`https://${hostname}${path}`, { timeoutMs: 2500 });
        const png = await sharp(buffer)
          .resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer();
        return { dataUri: `data:image/png;base64,${png.toString("base64")}`, kind: "logo" };
      } catch {
        // try the next candidate
      }
    }
  }
  return null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Design tokens, inlined — satori resolves concrete values, not CSS vars (§9.6.2).
const KERTAS1 = "#ffffff";
const TINTA = "#1f1b16";
const REDUP = "#7a7267";
const GARIS = "#d8d2c4";
const MERAH = "#da2e20";

const CACHE = "public, max-age=300, s-maxage=600, stale-while-revalidate=86400";

/**
 * GET /api/og/[id] — product-forward share card for a listing. The site's own
 * identity (screenshot → logo → drawn medallion) is the hero, with the rank as a
 * corner medal, personalised by tier (gold summit, silver/bronze podium, merah
 * climb). Never shows pegangan.
 *  - default: 1200×630 landscape (link unfurl, R20-d).
 *  - ?story=1: 1080×1920 Instagram-Story (R5). ?ratio=9x16|1x1|4x3|16x9 picks a size.
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
      urlNormal: listing.urlNormal,
      pegangan: listing.peganganCached,
      status: listing.status,
      screenshotUrl: listing.screenshotUrl,
    })
    .from(listing)
    .where(eq(listing.id, id))
    .limit(1);
  if (!l || l.status !== "tayang") return new Response("Not found", { status: 404 });

  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(listing)
    .where(and(eq(listing.status, "tayang"), gt(listing.peganganCached, l.pegangan)));
  const rank = Number(n) + 1;

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(listing)
    .where(eq(listing.status, "tayang"));
  const menyalip = Math.max(0, Number(total) - rank);

  let hostname = "";
  try {
    hostname = new URL(l.urlNormal.startsWith("http") ? l.urlNormal : `https://${l.urlNormal}`).hostname;
  } catch {
    hostname = "";
  }
  const host = l.urlNormal.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const bigName = l.nama.length > 20 ? `${l.nama.slice(0, 19)}…` : l.nama;

  const hero = await heroImage(url.origin, hostname, l.screenshotUrl);

  // Tier — the only place rank affects colour (gold/silver/bronze summit, merah climb).
  const tier =
    rank === 1
      ? {
          accent: MERAH,
          disc: "linear-gradient(145deg, #eac95d 0%, #c8971c 100%)",
          wash: "linear-gradient(180deg, #f8edca 0%, #f3f0e9 58%)",
          stat: `Teratas dari ${Number(total)} pemanjat`,
        }
      : rank === 2
        ? {
            accent: "#6f6f6f",
            disc: "linear-gradient(145deg, #dcdcdc 0%, #9a9a9a 100%)",
            wash: "linear-gradient(180deg, #ececec 0%, #f3f0e9 58%)",
            stat: `Menyalip ${menyalip} pemanjat`,
          }
        : rank === 3
          ? {
              accent: "#a5622f",
              disc: "linear-gradient(145deg, #d79256 0%, #a5622f 100%)",
              wash: "linear-gradient(180deg, #f3e1d2 0%, #f3f0e9 58%)",
              stat: `Menyalip ${menyalip} pemanjat`,
            }
          : {
              accent: MERAH,
              disc: "linear-gradient(145deg, #e2503f 0%, #b81f12 100%)",
              wash: "linear-gradient(180deg, #fbe3df 0%, #f3f0e9 58%)",
              stat: `Menyalip ${menyalip} pemanjat`,
            };

  const PRESETS: Record<
    string,
    { w: number; h: number; land: boolean; pad: string; heroW: number; heroH: number; nameF: number; gap: number }
  > = {
    "9x16": { w: 1080, h: 1920, land: false, pad: "96px 84px", heroW: 912, heroH: 912, nameF: 92, gap: 44 },
    "1x1": { w: 1080, h: 1080, land: false, pad: "64px 72px", heroW: 812, heroH: 560, nameF: 78, gap: 30 },
    "4x3": { w: 1200, h: 900, land: true, pad: "72px 84px", heroW: 520, heroH: 600, nameF: 72, gap: 56 },
    "16x9": { w: 1200, h: 675, land: true, pad: "56px 72px", heroW: 470, heroH: 490, nameF: 62, gap: 48 },
    default: { w: 1200, h: 630, land: true, pad: "56px 72px", heroW: 430, heroH: 460, nameF: 60, gap: 48 },
  };
  const P = PRESETS[ratio ?? ""] ?? (story ? PRESETS["9x16"] : PRESETS.default);

  // Corner rank medal — shown when the hero is the site's own image (screenshot/
  // logo). When we fall back to the drawn medallion, that disc already carries the
  // rank, so the corner medal is suppressed to avoid showing "#N" twice.
  const medalD = P.land ? 96 : 116;
  const rankMedal = !hero ? null : (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: medalD,
        padding: "0 28px",
        borderRadius: 999,
        background: tier.accent,
        color: "#ffffff",
        fontSize: Math.round(medalD * 0.46),
        fontWeight: 800,
        letterSpacing: -1,
      }}
    >
      #{rank}
    </div>
  );

  const fbDisc = Math.round(Math.min(P.heroW, P.heroH) * 0.66);
  const fbRankF = Math.round((rank >= 100 ? 0.34 : 0.42) * fbDisc);
  const logoF = Math.round(Math.min(P.heroW, P.heroH) * 0.58);
  const heroPanel = (
    <div
      style={{
        display: "flex",
        width: P.heroW,
        height: P.heroH,
        borderRadius: 44,
        overflow: "hidden",
        border: `1px solid ${GARIS}`,
        boxShadow: "0 30px 64px rgba(0,0,0,0.16)",
        background: KERTAS1,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {hero?.kind === "shot" ? (
        // biome-ignore lint/performance/noImgElement: satori renders to a raster, not the DOM
        <img src={hero.dataUri} width={P.heroW} height={P.heroH} style={{ objectFit: "cover" }} alt="" />
      ) : (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            backgroundImage: tier.wash,
          }}
        >
          {hero?.kind === "logo" ? (
            // biome-ignore lint/performance/noImgElement: satori renders to a raster, not the DOM
            <img src={hero.dataUri} width={logoF} height={logoF} style={{ objectFit: "contain" }} alt="" />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: fbDisc,
                height: fbDisc,
                borderRadius: 999,
                backgroundImage: tier.disc,
                border: "10px solid rgba(255,255,255,0.55)",
                boxShadow: "0 20px 44px rgba(0,0,0,0.14)",
              }}
            >
              <div style={{ display: "flex", fontSize: fbRankF, fontWeight: 800, color: "#ffffff", letterSpacing: -6 }}>
                #{rank}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const wordmark = (
    <div style={{ display: "flex", fontSize: P.land ? 38 : 44, fontWeight: 800, letterSpacing: -1 }}>Panjat</div>
  );

  const card = P.land ? (
    // Landscape (default / 4:3 / 16:9): hero left, details right.
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        gap: P.gap,
        padding: P.pad,
        backgroundImage: tier.wash,
        color: TINTA,
        fontFamily: "sans-serif",
      }}
    >
      {heroPanel}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 18, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {wordmark}
          {rankMedal}
        </div>
        <div style={{ display: "flex", fontSize: P.nameF, fontWeight: 800, lineHeight: 1.0 }}>{bigName}</div>
        <div style={{ display: "flex", fontSize: 30, color: REDUP }}>{host}</div>
        <div style={{ display: "flex", marginTop: 6, fontSize: 34, fontWeight: 700, color: tier.accent }}>
          {tier.stat}
        </div>
        <div style={{ display: "flex", marginTop: 2, fontSize: 32, fontWeight: 800, color: MERAH }}>panjat.id</div>
      </div>
    </div>
  ) : (
    // Portrait / square (9:16 / 1:1): centered vertical stack.
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: P.pad,
        backgroundImage: tier.wash,
        color: TINTA,
        fontFamily: "sans-serif",
        textAlign: "center",
      }}
    >
      <div style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between" }}>
        {wordmark}
        {rankMedal}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: Math.round(P.gap * 0.7) }}>
        {heroPanel}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", fontSize: P.nameF, fontWeight: 800, lineHeight: 1.0 }}>{bigName}</div>
          <div style={{ display: "flex", fontSize: 32, color: REDUP }}>{host}</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ display: "flex", fontSize: 38, fontWeight: 700, color: tier.accent }}>{tier.stat}</div>
        <div style={{ display: "flex", fontSize: 36, fontWeight: 800, color: MERAH }}>panjat.id</div>
      </div>
    </div>
  );

  return new ImageResponse(card, { width: P.w, height: P.h, headers: { "Cache-Control": CACHE } });
}
