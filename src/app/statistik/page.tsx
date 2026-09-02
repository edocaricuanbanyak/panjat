import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { cookies } from "next/headers";
import { InfoBox } from "@/components/InfoBox";
import { PageShell } from "@/components/PageShell";
import { StatTile } from "@/components/StatTile";
import { copy } from "@/copy";
import { db } from "@/db";
import { getStatistik } from "@/domain/statistik";
import { formatRupiah } from "@/lib/format";
import { getGa4Stats } from "@/lib/ga4";
import { pingVisitor, VID_COOKIE } from "@/lib/presence";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: copy.statistik.metaTitle,
  description: copy.statistik.metaDesc,
};

export default async function StatistikPage() {
  const vid = (await cookies()).get(VID_COOKIE)?.value;
  if (vid) await pingVisitor(vid);

  const [s, ga4] = await Promise.all([getStatistik(db), getGa4Stats()]);
  return (
    <PageShell>
      <a
        href="/"
        className="mb-3 inline-flex items-center gap-1 text-sm text-tinta-redup transition-colors hover:text-tinta"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {copy.nav.sepanjangMasa}
      </a>
      <h1
        className="font-display text-3xl font-bold text-tinta sm:text-4xl"
        style={{ fontStretch: "125%" }}
      >
        {copy.statistik.judul}
      </h1>
      <InfoBox className="mt-3">{copy.statistik.sub}</InfoBox>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <StatTile
          label={copy.statistik.hargaPuncak}
          value={formatRupiah(s.hargaPuncak)}
          sub={copy.statistik.hargaPuncakSub}
          metode={copy.statistik.hargaPuncakMetode}
        />
        <StatTile
          label={s.hargaMasuk20 > 0 ? copy.statistik.hargaMasuk20 : copy.statistik.hargaMasuk20Terbuka}
          value={s.hargaMasuk20 > 0 ? formatRupiah(s.hargaMasuk20) : "—"}
          sub={s.hargaMasuk20 > 0 ? copy.statistik.hargaMasuk20Sub : copy.statistik.hargaMasuk20TerbukaSub}
          metode={copy.statistik.hargaMasuk20Metode}
        />
        <StatTile
          label={copy.statistik.klik7}
          value={s.klik7hari.toLocaleString("id-ID")}
          sub={copy.statistik.klik7Sub(s.klikPerHari.toLocaleString("id-ID"))}
          metode={copy.statistik.klik7Metode}
        />
        <StatTile
          label={copy.statistik.cpc}
          value={s.cpc > 0 ? formatRupiah(s.cpc) : "—"}
          sub={copy.statistik.cpcSub}
          metode={copy.statistik.cpcMetode}
        />
        <StatTile
          label={copy.statistik.sponsor}
          value={String(s.sponsor)}
          sub={copy.statistik.sponsorSub}
          metode={copy.statistik.sponsorMetode}
        />
        <StatTile
          label={copy.statistik.puncakBerganti}
          value={String(s.puncakBerganti)}
          sub={copy.statistik.puncakBergantiSub}
          metode={copy.statistik.puncakBergantiMetode}
        />
        <StatTile
          label={copy.statistik.pengunjung}
          value={s.totalPengunjung.toLocaleString("id-ID")}
          sub={copy.statistik.pengunjungSub}
          metode={copy.statistik.pengunjungMetode}
        />
        <StatTile
          label={copy.statistik.online}
          value={String(s.online)}
          sub={copy.statistik.onlineSub}
          metode={copy.statistik.onlineMetode}
        />
      </div>

      {ga4 && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            { judul: copy.statistik.ga4Lokasi, rows: ga4.lokasi },
            { judul: copy.statistik.ga4Perangkat, rows: ga4.perangkat },
          ].map(
            (b) =>
              b.rows.length > 0 && (
                <div
                  key={b.judul}
                  className="rounded-xl border border-garis bg-kertas-1 p-3.5 shadow-kartu"
                >
                  <div className="text-xs text-tinta-redup">{b.judul}</div>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {b.rows.map((row) => (
                      <li key={row.label} className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate text-tinta">{row.label}</span>
                        <span className="tabular shrink-0 text-tinta-redup">
                          {row.users.toLocaleString("id-ID")}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 border-t border-garis pt-2 text-xs text-tinta-redup">
                    {copy.statistik.ga4Sumber}
                  </div>
                </div>
              ),
          )}
        </div>
      )}
    </PageShell>
  );
}
