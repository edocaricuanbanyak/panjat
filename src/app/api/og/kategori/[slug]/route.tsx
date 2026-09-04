import { ImageResponse } from "next/og";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { kategori, listing } from "@/db/schema";
import { kategoriIconDataUri } from "@/lib/kategori-svg";

export const runtime = "nodejs";

// Design tokens, inlined — satori resolves concrete values, not CSS vars (§9.6.2).
const KERTAS1 = "#ffffff";
const TINTA = "#1f1b16";
const REDUP = "#7a7267";
const GARIS = "#d8d2c4";
const MERAH = "#da2e20";
const EMAS = "#a5772a";

// The Panjat brand mark (src/app/icon.svg) as a satori-safe SVG data URI.
const PANJAT_MARK = `data:image/svg+xml;base64,${Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#1f1b16"/><rect x="14" y="6" width="4" height="21.5" rx="2" fill="#f3f0e9"/><path d="M18 6.6 L27 10 L18 13.4 Z" fill="#da2e20"/><circle cx="16" cy="20" r="3.1" fill="#da2e20"/><circle cx="16" cy="20" r="1.3" fill="#1f1b16"/></svg>',
).toString("base64")}`;

const CACHE = "public, max-age=300, s-maxage=600, stale-while-revalidate=86400";
const clamp = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/**
 * GET /api/og/kategori/[slug] — share card for a category directory page.
 * Shows the category (icon + name), its grip champion (#1 — the "tiang
 * terpisah", R6, same as the page's Juara callout) and how many listings
 * compete. It does NOT rank the directory by money (R22): only the single
 * champion is money-derived, mirroring the page itself. 1200×630 link unfurl.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [kat] = await db
    .select({ id: kategori.id, nama: kategori.nama, slug: kategori.slug })
    .from(kategori)
    .where(eq(kategori.slug, slug))
    .limit(1);
  if (!kat) return new Response("Not found", { status: 404 });

  const live = and(eq(listing.status, "tayang"), eq(listing.kategoriId, kat.id), gt(listing.peganganCached, 0));
  const [champion] = await db
    .select({ nama: listing.nama })
    .from(listing)
    .where(live)
    .orderBy(desc(listing.peganganCached))
    .limit(1);
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(listing)
    .where(live);

  const count = Number(n);

  const card = (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "60px 72px",
        backgroundImage: "linear-gradient(180deg, #f8edca 0%, #f3f0e9 55%)",
        color: TINTA,
        fontFamily: "sans-serif",
      }}
    >
      {/* TOP: brand (left) + "Kategori" tag (right) */}
      <div style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* biome-ignore lint/performance/noImgElement: satori renders to a raster, not the DOM */}
          <img src={PANJAT_MARK} width={52} height={52} alt="" />
          <div style={{ display: "flex", fontSize: 34, fontWeight: 800, letterSpacing: -1, color: TINTA }}>Panjat</div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 24,
            fontWeight: 700,
            color: REDUP,
            border: `2px solid ${GARIS}`,
            borderRadius: 999,
            padding: "6px 20px",
            background: KERTAS1,
          }}
        >
          Kategori
        </div>
      </div>

      {/* MIDDLE: icon + category name, then champion + count */}
      <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center", gap: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          {/* biome-ignore lint/performance/noImgElement: satori renders to a raster, not the DOM */}
          <img src={kategoriIconDataUri(kat.slug, MERAH, 96)} width={96} height={96} alt="" />
          <div style={{ display: "flex", fontSize: 88, fontWeight: 800, letterSpacing: -2, color: TINTA }}>
            {clamp(kat.nama, 20)}
          </div>
        </div>

        {champion && (
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", fontSize: 34, fontWeight: 800, color: EMAS }}>Juara</div>
            <div style={{ display: "flex", fontSize: 34, fontWeight: 700, color: TINTA }}>
              {clamp(champion.nama, 34)}
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM: count (left) + panjat.id (right) */}
      <div style={{ display: "flex", width: "100%", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ display: "flex", fontSize: 29, fontWeight: 700, color: MERAH }}>
          {count > 0 ? `${count} listing bersaing di kategori ini` : "Belum ada yang manjat — rebut puncaknya"}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <div style={{ display: "flex", fontSize: 20, color: REDUP }}>papan peringkat berbayar</div>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 800, color: MERAH }}>panjat.id</div>
        </div>
      </div>
    </div>
  );

  return new ImageResponse(card, { width: 1200, height: 630, headers: { "Cache-Control": CACHE } });
}
