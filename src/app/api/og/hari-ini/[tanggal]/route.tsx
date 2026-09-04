import { ImageResponse } from "next/og";
import { db } from "@/db";
import { getPapanHariIni, wibDayWindow } from "@/domain/papan-hari-ini";

export const runtime = "nodejs";

// Design tokens, inlined — satori resolves concrete values, not CSS vars (§9.6.2).
const KERTAS1 = "#ffffff";
const TINTA = "#1f1b16";
const REDUP = "#7a7267";
const GARIS = "#d8d2c4";
const MERAH = "#da2e20";

// Podium tiers — the only place rank sets colour (gold/silver/bronze, then ink).
const TIER = ["#a5772a", "#6f6f6f", "#a5622f"];

const PANJAT_MARK = `data:image/svg+xml;base64,${Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#1f1b16"/><rect x="14" y="6" width="4" height="21.5" rx="2" fill="#f3f0e9"/><path d="M18 6.6 L27 10 L18 13.4 Z" fill="#da2e20"/><circle cx="16" cy="20" r="3.1" fill="#da2e20"/><circle cx="16" cy="20" r="1.3" fill="#1f1b16"/></svg>',
).toString("base64")}`;

const CACHE = "public, max-age=300, s-maxage=600, stale-while-revalidate=86400";
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const clamp = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/**
 * GET /api/og/hari-ini/[tanggal] — share card for a daily board. Shows the day's
 * top-3 mini-leaderboard (money-ranked by payments since 00:00 WIB, R7) with
 * podium colours, plus a count. 1200×630 link unfurl. Used by both the live
 * board (today's date) and each archived day.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ tanggal: string }> }) {
  const { tanggal } = await params;
  if (!DATE.test(tanggal) || Number.isNaN(new Date(`${tanggal}T00:00:00+07:00`).getTime())) {
    return new Response("Not found", { status: 404 });
  }

  const { start, end } = wibDayWindow(tanggal);
  const entries = await getPapanHariIni(db, start, end);
  const top = entries.slice(0, 3);

  const card = (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "58px 72px",
        backgroundImage: "linear-gradient(180deg, #fbe3df 0%, #f3f0e9 55%)",
        color: TINTA,
        fontFamily: "sans-serif",
      }}
    >
      {/* TOP: brand + date tag */}
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
          {tanggal}
        </div>
      </div>

      {/* TITLE */}
      <div style={{ display: "flex", marginTop: 26, fontSize: 60, fontWeight: 800, letterSpacing: -2, color: TINTA }}>
        Papan Hari Ini
      </div>

      {/* BODY: top-3 mini leaderboard, or an empty state */}
      <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center", gap: 18 }}>
        {top.length > 0 ? (
          top.map((e, i) => (
            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 22 }}>
              <div style={{ display: "flex", width: 56, fontSize: 46, fontWeight: 800, color: TIER[i] ?? TINTA }}>
                #{i + 1}
              </div>
              <div style={{ display: "flex", fontSize: 44, fontWeight: 700, color: TINTA }}>
                {clamp(e.nama, 30)}
              </div>
            </div>
          ))
        ) : (
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: REDUP }}>
            Belum ada yang manjat hari ini — rebut puncaknya.
          </div>
        )}
      </div>

      {/* BOTTOM: count + panjat.id */}
      <div style={{ display: "flex", width: "100%", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ display: "flex", fontSize: 29, fontWeight: 700, color: MERAH }}>
          {entries.length > 0 ? `${entries.length} pemanjat hari itu` : "Uang kemarin tidak berlaku"}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <div style={{ display: "flex", fontSize: 20, color: REDUP }}>reset tiap 00:00 WIB</div>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 800, color: MERAH }}>panjat.id</div>
        </div>
      </div>
    </div>
  );

  return new ImageResponse(card, { width: 1200, height: 630, headers: { "Cache-Control": CACHE } });
}
