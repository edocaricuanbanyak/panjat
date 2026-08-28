import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { SiteLogo } from "@/components/SiteLogo";
import { PageShell } from "@/components/PageShell";
import { copy } from "@/copy";
import { db } from "@/db";
import { juaraHarian, listing } from "@/db/schema";
import { getJuaraMingguanTerbaru } from "@/domain/juara-mingguan";
import { formatRupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: copy.arsip.metaTitle,
  description: copy.arsip.metaDesc,
};

const ORDER = ["papan1", "papan2", "papan3", "terfavorit", "kaki_tiang"];

export default async function ArsipPage() {
  const [mingguan, rows] = await Promise.all([
    getJuaraMingguanTerbaru(db),
    db
      .select({ tanggal: juaraHarian.tanggal, id: listing.id, nama: listing.nama, urlNormal: listing.urlNormal })
      .from(juaraHarian)
      .innerJoin(listing, eq(listing.id, juaraHarian.listingId))
      .orderBy(desc(juaraHarian.tanggal))
      .limit(90),
  ]);
  const juaraMingguan = [...mingguan].sort(
    (a, b) => ORDER.indexOf(a.jenis) - ORDER.indexOf(b.jenis),
  );

  return (
    <PageShell>
      <h1
        className="font-display text-3xl font-bold text-tinta sm:text-4xl"
        style={{ fontStretch: "125%" }}
      >
        {copy.arsip.judul}
      </h1>
      <p className="mt-2 max-w-xl text-tinta-redup">{copy.arsip.sub}</p>

      {juaraMingguan.length > 0 && (
        <section className="mt-6 rounded-2xl border border-emas/50 bg-gradient-to-b from-emas/12 to-kertas-1 p-4 shadow-kartu">
          <div>
            <h2 className="font-display font-semibold text-tinta">{copy.arsip.mingguanJudul}</h2>
            <p className="mt-0.5 font-mono text-xs font-medium text-tinta">
              {copy.arsip.mingguanPekan(juaraMingguan[0].minggu)}
            </p>
            <p className="mt-0.5 text-xs text-tinta-redup">{copy.arsip.mingguanInfo}</p>
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {juaraMingguan.map((j) => (
              <li
                key={j.jenis}
                className="flex items-center gap-3 rounded-lg bg-kertas-1/60 px-3 py-2"
              >
                <span className="w-24 shrink-0 font-mono text-[11px] uppercase tracking-wide text-tinta-redup">
                  {copy.arsip.jenis[j.jenis] ?? j.jenis}
                </span>
                <SiteLogo listingId={j.listingId} nama={j.nama} className="size-8 rounded-md text-xs" />
                <span className="min-w-0 flex-1 truncate font-display font-semibold text-tinta">
                  {j.nama}
                </span>
                <span className="shrink-0 font-sans tabular text-xs text-tinta-redup">
                  {j.jenis.startsWith("papan")
                    ? formatRupiah(j.metrik)
                    : j.jenis === "terfavorit"
                      ? `${j.metrik.toLocaleString("id-ID")} vote`
                      : `${j.metrik.toLocaleString("id-ID")} dukungan`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <h2 className="mt-8 font-display text-sm font-semibold uppercase tracking-wide text-tinta-redup">
        {copy.arsip.harianJudul}
      </h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-tinta-redup">{copy.arsip.kosong}</p>
      ) : (
        <ul className="mt-3 divide-y divide-garis">
          {rows.map((r) => (
            <li key={r.tanggal}>
              <a
                href={`/hari-ini/${r.tanggal}`}
                className="flex items-center gap-3 py-3 hover:text-merah-teks"
              >
                <SiteLogo listingId={r.id} nama={r.nama} />
                <div className="min-w-0">
                  <span className="block truncate font-display font-semibold text-tinta">
                    {r.nama}
                  </span>
                  <span className="font-mono text-xs text-tinta-redup">{r.tanggal}</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
