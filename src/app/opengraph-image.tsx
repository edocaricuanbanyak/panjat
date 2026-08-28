import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Panjat — papan peringkat berbayar. Rebut Peringkat Teratas.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Design tokens, inlined — satori resolves concrete values, not CSS vars (§9.6.2).
const KERTAS1 = "#ffffff";
const TINTA = "#1f1b16";
const REDUP = "#665f56";
const GARIS = "#d8d2c4";
const MERAH = "#da2e20";
const EMAS = "#c99a2e";
const PERAK = "#8a8a8a";
const PERUNGGU = "#a5622f";

// The Panjat brand mark (src/app/icon.svg) as a satori-safe SVG data URI.
const PANJAT_MARK = `data:image/svg+xml;base64,${Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#1f1b16"/><rect x="14" y="6" width="4" height="21.5" rx="2" fill="#f3f0e9"/><path d="M18 6.6 L27 10 L18 13.4 Z" fill="#da2e20"/><circle cx="16" cy="20" r="3.1" fill="#da2e20"/><circle cx="16" cy="20" r="1.3" fill="#1f1b16"/></svg>',
).toString("base64")}`;

// Mini leaderboard motif — three podium rows, bars shrinking by rank.
const ROWS = [
  { rank: 1, color: EMAS, w: 200 },
  { rank: 2, color: PERAK, w: 165 },
  { rank: 3, color: PERUNGGU, w: 135 },
];

/**
 * Site-level social card (og:image + twitter:image, auto-wired by Next). Gives
 * panjat.id a preview image so link-unfurlers/scrapers (WhatsApp, X, pake.ai)
 * have something to read — the home page had none. Summit-gold wash echoes #1.
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "64px 72px",
          background: "linear-gradient(180deg, #f8edca 0%, #f3f0e9 55%)",
          color: TINTA,
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* biome-ignore lint/performance/noImgElement: satori renders to a raster, not the DOM */}
          <img src={PANJAT_MARK} width={58} height={58} alt="" />
          <div style={{ display: "flex", fontSize: 44, fontWeight: 800, letterSpacing: -1, color: TINTA }}>
            Panjat
          </div>
        </div>

        {/* Body: headline + mini leaderboard */}
        <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 56 }}>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", fontSize: 74, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2, color: TINTA }}>
              Rebut Peringkat
            </div>
            <div style={{ display: "flex", fontSize: 74, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2, color: MERAH }}>
              Teratas
            </div>
            <div style={{ display: "flex", marginTop: 24, fontSize: 31, lineHeight: 1.35, color: REDUP, maxWidth: 600 }}>
              Tempel linkmu, panjat papan, salip yang di atas. Semua melorot tiap jam — puncaknya selalu bisa direbut.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
              width: 340,
              flexShrink: 0,
              padding: 26,
              borderRadius: 26,
              background: KERTAS1,
              border: `1px solid ${GARIS}`,
              boxShadow: "0 16px 40px rgba(0,0,0,0.10)",
            }}
          >
            {ROWS.map((r) => (
              <div key={r.rank} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ display: "flex", fontSize: 30, fontWeight: 800, color: r.color, width: 46 }}>
                  #{r.rank}
                </div>
                <div style={{ display: "flex", height: 22, width: r.w, borderRadius: 999, background: r.color }} />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 24, color: REDUP }}>
            papan peringkat berbayar · buat produk & UMKM Indonesia
          </div>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 800, color: MERAH }}>panjat.id</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
