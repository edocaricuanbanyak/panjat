import type { Metadata } from "next";
import { cookies } from "next/headers";
import Script from "next/script";
import { PageShell } from "@/components/PageShell";
import { StatTile } from "@/components/StatTile";
import { copy } from "@/copy";
import { db } from "@/db";
import { getStatistik } from "@/domain/statistik";
import { formatRupiah, formatWIB } from "@/lib/format";
import { pingVisitor, VID_COOKIE } from "@/lib/presence";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: copy.statistik.metaTitle,
  description: copy.statistik.metaDesc,
};

export default async function StatistikPage() {
  const vid = (await cookies()).get(VID_COOKIE)?.value;
  if (vid) await pingVisitor(vid);

  const s = await getStatistik(db);
  return (
    <PageShell>
      <h1
        className="font-display text-3xl font-bold text-tinta sm:text-4xl"
        style={{ fontStretch: "125%" }}
      >
        {copy.statistik.judul}
      </h1>
      <p className="mt-2 text-tinta-redup">{copy.statistik.sub}</p>
      <p className="mt-1 font-mono text-xs text-tinta-redup">
        {copy.statistik.diperbarui(formatWIB(new Date()))}
      </p>

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

      {/* Umami — privacy-friendly (cookieless) analytics, this page only.
          next/script auto-applies the CSP nonce; cloud.umami.is is allowlisted
          in script-src + connect-src (middleware.ts). */}
      <Script
        src="https://cloud.umami.is/script.js"
        data-website-id="c70429e3-b6c0-4f83-91d1-5239f110278d"
        strategy="afterInteractive"
      />
    </PageShell>
  );
}
