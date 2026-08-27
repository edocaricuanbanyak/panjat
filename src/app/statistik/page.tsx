import type { Metadata } from "next";
import { cookies } from "next/headers";
import { PageShell } from "@/components/PageShell";
import { StatTile } from "@/components/StatTile";
import { copy } from "@/copy";
import { db } from "@/db";
import { getStatistik } from "@/domain/statistik";
import { formatRupiah } from "@/lib/format";
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

      <div className="mt-6 grid grid-cols-2 gap-3">
        <StatTile label={copy.statistik.online} value={String(s.online)} />
        <StatTile label={copy.statistik.totalPengunjung} value={s.totalPengunjung.toLocaleString("id-ID")} />
        <StatTile label={copy.statistik.sponsor} value={String(s.sponsor)} />
        <StatTile label={copy.statistik.klik} value={s.klikTerkirim.toLocaleString("id-ID")} />
        <StatTile label={copy.statistik.pegangan} value={formatRupiah(s.totalPegangan)} />
        <StatTile label={copy.statistik.hari} value={String(s.hariDiarsip)} />
      </div>
    </PageShell>
  );
}
