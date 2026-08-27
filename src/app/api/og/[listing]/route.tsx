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
  const story = new URL(req.url).searchParams.get("story") === "1";

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
  if (story) {
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

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "110px 80px",
            backgroundImage: tier.wash,
            color: TINTA,
            fontFamily: "sans-serif",
            textAlign: "center",
          }}
        >
          {/* header: wordmark + tier pill */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
            <div style={{ display: "flex", fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>
              Panjat
            </div>
            <div
              style={{
                display: "flex",
                padding: "14px 40px",
                borderRadius: 999,
                background: tier.accent,
                color: "#ffffff",
                fontSize: 34,
                fontWeight: 800,
                letterSpacing: 4,
              }}
            >
              {tier.pill}
            </div>
          </div>

          {/* hero: medallion with the rank, then name */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 460,
                height: 460,
                borderRadius: 999,
                backgroundImage: tier.disc,
                border: "12px solid rgba(255,255,255,0.55)",
                boxShadow: "0 30px 60px rgba(0,0,0,0.14)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: rank >= 100 ? 210 : 260,
                  fontWeight: 800,
                  color: tier.discText,
                  letterSpacing: -6,
                }}
              >
                #{rank}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", fontSize: 46, fontWeight: 700, color: tier.accent }}>
                {tier.headline}
              </div>
              <div style={{ display: "flex", fontSize: 104, fontWeight: 800, lineHeight: 1.0 }}>
                {bigName}
              </div>
              <div style={{ display: "flex", fontSize: 38, color: REDUP }}>{host}</div>
            </div>
          </div>

          {/* stats: pegangan + climb, then footer */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 28,
                padding: "26px 48px",
                borderRadius: 40,
                background: "rgba(255,255,255,0.7)",
                border: `2px solid ${GARIS}`,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ display: "flex", fontSize: 28, color: REDUP }}>pegangan</div>
                <div style={{ display: "flex", fontSize: 76, fontWeight: 800 }}>
                  {formatRupiah(l.pegangan)}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: tier.accent }}>
              {tier.stat}
            </div>
            <div style={{ display: "flex", marginTop: 16, fontSize: 40, fontWeight: 800, color: MERAH }}>
              panjat.id
            </div>
          </div>
        </div>
      ),
      { width: 1080, height: 1920 },
    );
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
