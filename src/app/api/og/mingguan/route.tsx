import { ImageResponse } from "next/og";
import { db } from "@/db";
import { getJuaraMingguanTerbaru, type JuaraJenis } from "@/domain/juara-mingguan";
import { formatRupiah } from "@/lib/format";

export const runtime = "nodejs";

// Design tokens, inlined — satori resolves concrete values, not CSS vars (§9.6.2).
const KERTAS = "#f3f0e9";
const KERTAS1 = "#ffffff";
const TINTA = "#1f1b16";
const REDUP = "#7a7267";
const GARIS = "#d8d2c4";
const MERAH = "#da2e20";
const EMAS = "#c8971c";
const PERAK = "#8f8f8f";
const PERUNGGU = "#b06a35";

const medal = (n: number) => (n === 1 ? EMAS : n === 2 ? PERAK : PERUNGGU);
const trim = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/**
 * GET /api/og/mingguan — the weekly champions Instagram-Story card (1080×1920):
 * board #1/#2/#3, the Terfavorit as a featured "ad" slot, and the Kaki Tiang
 * champion. Reads the latest archived week (B). 404 until a week is archived.
 */
export async function GET() {
  const rows = await getJuaraMingguanTerbaru(db);
  if (rows.length === 0) return new Response("Belum ada juara mingguan", { status: 404 });

  const by = (j: JuaraJenis) => rows.find((r) => r.jenis === j);
  const podium = (["papan1", "papan2", "papan3"] as const)
    .map((j, i) => ({ n: i + 1, row: by(j) }))
    .filter((x) => x.row);
  const terfavorit = by("terfavorit");
  const kaki = by("kaki_tiang");
  const minggu = rows[0].minggu;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "100px 72px",
          background: KERTAS,
          color: TINTA,
          fontFamily: "sans-serif",
        }}
      >
        {/* header */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>
            Panjat
          </div>
          <div style={{ display: "flex", fontSize: 96, fontWeight: 800, lineHeight: 1.0 }}>
            Juara Minggu Ini
          </div>
          <div style={{ display: "flex", fontSize: 32, color: REDUP }}>Papan · pekan {minggu}</div>
        </div>

        {/* podium */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22, marginTop: 56 }}>
          {podium.map(({ n, row }) => (
            <div
              key={n}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 28,
                padding: "26px 32px",
                borderRadius: 32,
                background: KERTAS1,
                border: `3px solid ${n === 1 ? MERAH : GARIS}`,
              }}
            >
              <div style={{ display: "flex", fontSize: 64, fontWeight: 800, color: medal(n), width: 96 }}>
                #{n}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 108,
                  height: 108,
                  borderRadius: 20,
                  background: KERTAS,
                  border: `2px solid ${GARIS}`,
                  fontSize: 56,
                  fontWeight: 800,
                }}
              >
                {row?.nama.slice(0, 1).toUpperCase()}
              </div>
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ display: "flex", fontSize: 48, fontWeight: 800 }}>
                  {trim(row?.nama ?? "", 20)}
                </div>
                <div style={{ display: "flex", fontSize: 36, fontWeight: 700, color: REDUP }}>
                  {formatRupiah(row?.metrik ?? 0)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Terfavorit — featured "ad" slot */}
        {terfavorit ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginTop: 40,
              padding: "34px 40px",
              borderRadius: 32,
              background: MERAH,
              color: KERTAS1,
            }}
          >
            <div style={{ display: "flex", fontSize: 30, fontWeight: 700, letterSpacing: 1 }}>
              ★ TERFAVORIT PILIHAN PENONTON
            </div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <div style={{ display: "flex", fontSize: 60, fontWeight: 800 }}>
                {trim(terfavorit.nama, 18)}
              </div>
              <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>
                {terfavorit.metrik.toLocaleString("id-ID")} vote
              </div>
            </div>
          </div>
        ) : null}

        {/* Kaki Tiang champion */}
        {kaki ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 28,
              padding: "26px 40px",
              borderRadius: 32,
              background: KERTAS1,
              border: `3px solid ${EMAS}`,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: EMAS }}>
                JUARA KAKI TIANG · GRATIS
              </div>
              <div style={{ display: "flex", fontSize: 48, fontWeight: 800 }}>
                {trim(kaki.nama, 20)}
              </div>
            </div>
            <div style={{ display: "flex", fontSize: 36, fontWeight: 700, color: REDUP }}>
              {kaki.metrik.toLocaleString("id-ID")} dukungan
            </div>
          </div>
        ) : null}

        {/* footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "auto",
            paddingTop: 40,
            fontSize: 44,
            fontWeight: 800,
            color: MERAH,
          }}
        >
          panjat.id
        </div>
      </div>
    ),
    { width: 1080, height: 1920 },
  );
}
