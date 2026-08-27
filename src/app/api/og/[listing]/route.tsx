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

/** GET /api/og/[id] — 1200×630 share card for a listing (R20-d). */
export async function GET(_req: Request, { params }: { params: Promise<{ listing: string }> }) {
  const { listing: id } = await params;
  if (!UUID.test(id)) return new Response("Not found", { status: 404 });

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
