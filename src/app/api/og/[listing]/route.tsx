import { ImageResponse } from "next/og";
import { db } from "@/db";
import { getMomenForListing } from "@/domain/momen";
import { formatRupiah } from "@/lib/format";

export const runtime = "nodejs";

// Palette (§9.6.2). Raw hex is unavoidable in image generation (no CSS vars).
const C = {
  kertas: "#F3F0E9",
  kertas1: "#FFFFFF",
  tinta: "#1F1B16",
  tintaRedup: "#7A7267",
  garis: "#D8D2C4",
  tiang: "#8A5A32",
  merah: "#C93A2E",
};

/**
 * GET /api/og/{listing} — dynamic flex card (R5). 1200×630 by default;
 * ?story=1 → 1080×1920 for IG Story. Rank/name/grip pulled from the live board.
 */
export async function GET(req: Request, ctx: { params: Promise<{ listing: string }> }) {
  const { listing: listingId } = await ctx.params;
  const story = new URL(req.url).searchParams.get("story") != null;
  const momen = await getMomenForListing(db, listingId);

  const width = story ? 1080 : 1200;
  const height = story ? 1920 : 630;
  const nama = momen?.nama ?? "Panjat";
  const rank = momen?.rank ?? 0;
  const pegangan = momen ? formatRupiah(momen.pegangan) : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: C.kertas,
          padding: story ? 96 : 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 12, height: 40, background: C.tiang, borderRadius: 6 }} />
          <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: C.tinta }}>
            Panjat
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", fontSize: 28, color: C.tintaRedup }}>
            {rank === 1 ? "Di puncak" : `Peringkat`}
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 20 }}>
            <div style={{ display: "flex", fontSize: story ? 320 : 200, fontWeight: 800, color: C.merah, lineHeight: 1 }}>
              #{rank}
            </div>
          </div>
          <div style={{ display: "flex", fontSize: story ? 72 : 64, fontWeight: 700, color: C.tinta }}>
            {nama}
          </div>
          <div style={{ display: "flex", fontSize: 32, color: C.tintaRedup }}>
            pegangan {pegangan}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: `2px solid ${C.garis}`,
            paddingTop: 28,
            fontSize: 30,
            color: C.tinta,
          }}
        >
          <div style={{ display: "flex" }}>panjat.id</div>
          <div style={{ display: "flex", color: C.tintaRedup }}>Manjat, atau merosot.</div>
        </div>
      </div>
    ),
    { width, height },
  );
}
