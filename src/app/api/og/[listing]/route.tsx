import { ImageResponse } from "next/og";
import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { kategori, listing } from "@/db/schema";
import { formatRupiah } from "@/lib/format";

export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Design tokens, inlined — satori resolves concrete values, not CSS vars (§9.6.2).
const KERTAS = "#f3f0e9";
const KERTAS1 = "#ffffff";
const TINTA = "#1f1b16";
const REDUP = "#7a7267";
const GARIS = "#d8d2c4";
const MERAH = "#da2e20";

/**
 * GET /api/og/[id] — share card for a listing.
 *  - default: 1200×630 landscape OG card (R20-d).
 *  - ?story=1: 1080×1920 Instagram-Story card (R5), used by the Momen Puncak reveal.
 */
export async function GET(req: Request, { params }: { params: Promise<{ listing: string }> }) {
  const { listing: id } = await params;
  if (!UUID.test(id)) return new Response("Not found", { status: 404 });
  const params2 = new URL(req.url).searchParams;
  const story = params2.get("story") === "1";
  const ratio = params2.get("ratio"); // 9x16 | 1x1 | 4x3 | 16x9

  const [l] = await db
    .select({
      nama: listing.nama,
      deskripsi: listing.deskripsi,
      urlNormal: listing.urlNormal,
      pegangan: listing.peganganCached,
      status: listing.status,
      kategoriNama: kategori.nama,
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
  const rank = Number(n) + 1;
  const summit = rank <= 3;
  const host = l.urlNormal.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const nama = l.nama.length > 26 ? `${l.nama.slice(0, 25)}…` : l.nama;

  // Instagram-Story card (R5) — 1080×1920 vertical, personalised by rank so the
  // sponsor feels the pride: gold summit, silver/bronze podium, or a proud climb.
  if (story || ratio) {
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(listing)
      .where(eq(listing.status, "tayang"));
    const menyalip = Math.max(0, Number(total) - rank);

    const tier =
      rank === 1
        ? {
            key: "puncak",
            pill: "PUNCAK",
            headline: "Kamu di PUNCAK tiang",
            accent: MERAH,
            disc: "linear-gradient(145deg, #eac95d 0%, #c8971c 100%)",
            wash: "linear-gradient(180deg, #f8edca 0%, #f3f0e9 58%)",
            discText: "#ffffff",
            stat: `Teratas dari ${Number(total)} pemanjat`,
          }
        : rank === 2
          ? {
              key: "perak",
              pill: "JUARA 2",
              headline: "Podium — Juara 2",
              accent: "#6f6f6f",
              disc: "linear-gradient(145deg, #dcdcdc 0%, #9a9a9a 100%)",
              wash: "linear-gradient(180deg, #ececec 0%, #f3f0e9 58%)",
              discText: "#ffffff",
              stat: `Menyalip ${menyalip} pemanjat`,
            }
          : rank === 3
            ? {
                key: "perunggu",
                pill: "JUARA 3",
                headline: "Podium — Juara 3",
                accent: "#a5622f",
                disc: "linear-gradient(145deg, #d79256 0%, #a5622f 100%)",
                wash: "linear-gradient(180deg, #f3e1d2 0%, #f3f0e9 58%)",
                discText: "#ffffff",
                stat: `Menyalip ${menyalip} pemanjat`,
              }
            : {
                key: "naik",
                pill: "MENANJAK",
                headline: `Kamu naik ke #${rank}`,
                accent: MERAH,
                disc: "linear-gradient(145deg, #e2503f 0%, #b81f12 100%)",
                wash: "linear-gradient(180deg, #fbe3df 0%, #f3f0e9 58%)",
                discText: "#ffffff",
                stat: `Menyalip ${menyalip} pemanjat`,
              };
    const bigName = l.nama.length > 18 ? `${l.nama.slice(0, 17)}…` : l.nama;

    // Aspect-ratio presets. `story=1` and no ratio → the 9:16 story.
    const PRESETS: Record<string, { w: number; h: number; disc: number; rankF: number; nameF: number; land: boolean; pad: string }> = {
      "9x16": { w: 1080, h: 1920, disc: 460, rankF: 250, nameF: 100, land: false, pad: "110px 80px" },
      "1x1": { w: 1080, h: 1080, disc: 340, rankF: 188, nameF: 82, land: false, pad: "70px 70px" },
      "4x3": { w: 1200, h: 900, disc: 400, rankF: 210, nameF: 84, land: true, pad: "70px 80px" },
      "16x9": { w: 1200, h: 675, disc: 330, rankF: 176, nameF: 74, land: true, pad: "60px 80px" },
    };
    const P = PRESETS[ratio ?? ""] ?? PRESETS["9x16"];
    const rankFont = rank >= 100 ? Math.round(P.rankF * 0.78) : P.rankF;
    const tall = P.h >= 1400;

    const pill = (
      <div
        style={{
          display: "flex",
          padding: "12px 34px",
          borderRadius: 999,
          background: tier.accent,
          color: "#ffffff",
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: 4,
        }}
      >
        {tier.pill}
      </div>
    );
    const medallion = (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: P.disc,
          height: P.disc,
          borderRadius: 999,
          backgroundImage: tier.disc,
          border: "10px solid rgba(255,255,255,0.55)",
          boxShadow: "0 24px 50px rgba(0,0,0,0.14)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", fontSize: rankFont, fontWeight: 800, color: tier.discText, letterSpacing: -6 }}>
          #{rank}
        </div>
      </div>
    );
    const card = P.land ? (
      // Landscape (16:9 / 4:3): medallion left, details right.
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 64,
          padding: P.pad,
          backgroundImage: tier.wash,
          color: TINTA,
          fontFamily: "sans-serif",
        }}
      >
        {medallion}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>Panjat</div>
            {pill}
          </div>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: tier.accent }}>{tier.headline}</div>
          <div style={{ display: "flex", fontSize: P.nameF, fontWeight: 800, lineHeight: 1.0 }}>{bigName}</div>
          <div style={{ display: "flex", fontSize: 32, color: REDUP }}>{host}</div>
          <div style={{ display: "flex", marginTop: 8, fontSize: 38, fontWeight: 700, color: tier.accent }}>
            {tier.stat}
          </div>
          <div style={{ display: "flex", marginTop: 6, fontSize: 34, fontWeight: 800, color: MERAH }}>panjat.id</div>
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
          justifyContent: tall ? "space-between" : "center",
          gap: tall ? 0 : 30,
          padding: P.pad,
          backgroundImage: tier.wash,
          color: TINTA,
          fontFamily: "sans-serif",
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", fontSize: 42, fontWeight: 800, letterSpacing: -1 }}>Panjat</div>
          {pill}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: tall ? 36 : 24 }}>
          {medallion}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", fontSize: 42, fontWeight: 700, color: tier.accent }}>{tier.headline}</div>
            <div style={{ display: "flex", fontSize: P.nameF, fontWeight: 800, lineHeight: 1.0 }}>{bigName}</div>
            <div style={{ display: "flex", fontSize: 34, color: REDUP }}>{host}</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
          <div style={{ display: "flex", fontSize: 42, fontWeight: 700, color: tier.accent }}>{tier.stat}</div>
          <div style={{ display: "flex", fontSize: 38, fontWeight: 800, color: MERAH }}>panjat.id</div>
        </div>
      </div>
    );

    return new ImageResponse(card, { width: P.w, height: P.h });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: KERTAS,
          color: TINTA,
          fontFamily: "sans-serif",
        }}
      >
        {/* top: wordmark + category */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", fontSize: 34, fontWeight: 800, letterSpacing: -1 }}>
            Panjat
          </div>
          <div style={{ display: "flex", fontSize: 26, color: REDUP }}>
            {l.kategoriNama ?? "Papan"}
          </div>
        </div>

        {/* middle: rank + logo + name */}
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 132,
              height: 132,
              borderRadius: 24,
              background: KERTAS1,
              border: `2px solid ${GARIS}`,
              fontSize: 64,
              fontWeight: 800,
              color: summit ? MERAH : TINTA,
            }}
          >
            {l.nama.slice(0, 1).toUpperCase()}
          </div>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 820 }}>
            <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: summit ? MERAH : REDUP }}>
              #{rank}
            </div>
            <div style={{ display: "flex", fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>
              {l.nama.length > 34 ? `${l.nama.slice(0, 33)}…` : l.nama}
            </div>
            {l.deskripsi ? (
              <div style={{ display: "flex", marginTop: 10, fontSize: 30, color: REDUP }}>
                {l.deskripsi.length > 70 ? `${l.deskripsi.slice(0, 69)}…` : l.deskripsi}
              </div>
            ) : null}
          </div>
        </div>

        {/* bottom: url + grip */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            borderTop: `2px solid ${GARIS}`,
            paddingTop: 28,
          }}
        >
          <div style={{ display: "flex", fontSize: 30, color: REDUP }}>{host}</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <div style={{ display: "flex", fontSize: 24, color: REDUP }}>pegangan</div>
            <div style={{ display: "flex", fontSize: 52, fontWeight: 800 }}>
              {formatRupiah(l.pegangan)}
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
