import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { KategoriIcon } from "@/components/KategoriIcon";
import { SiteLogo } from "@/components/SiteLogo";
import { PageShell } from "@/components/PageShell";
import { copy } from "@/copy";
import { db } from "@/db";
import { juaraHarian, listing } from "@/db/schema";
import { getJuaraMingguanTerbaru, type JuaraArsip } from "@/domain/juara-mingguan";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: copy.arsip.metaTitle,
  description: copy.arsip.metaDesc,
};

// The four weekly honours shown here (papan #2/#3 stay archived for the IG card
// but aren't listed). Full info, never the paid nominal.
const ORDER = ["papan1", "terfavorit", "klik_terbanyak", "kaki_tiang"];

/** Non-money headline metric per category (clicks for Juara 1 — no nominal). */
function metrikLabel(j: JuaraArsip): string {
  if (j.jenis === "terfavorit") return copy.favorit.vote_n(j.metrik);
  if (j.jenis === "kaki_tiang") return copy.kakiTiang.dukungan_n(j.metrik);
  if (j.jenis === "klik_terbanyak") return copy.papan.klik(j.metrik);
  return copy.papan.klik(j.klik); // Juara 1 — clicks, never the sponsor nominal
}

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
  const juaraMingguan = mingguan
    .filter((j) => ORDER.includes(j.jenis))
    .sort((a, b) => ORDER.indexOf(a.jenis) - ORDER.indexOf(b.jenis));

  return (
    <PageShell>
      <h1
        className="font-display text-3xl font-bold text-tinta sm:text-4xl"
        style={{ fontStretch: "125%" }}
      >
        {copy.arsip.judul}
      </h1>

      {juaraMingguan.length > 0 && (
        <section className="mt-6 rounded-2xl border border-emas/50 bg-gradient-to-b from-emas/12 to-kertas-1 p-4 shadow-kartu">
          <div>
            <h2 className="font-display font-semibold text-tinta">{copy.arsip.mingguanJudul}</h2>
            <p className="mt-0.5 tabular text-xs font-medium text-tinta">
              {copy.arsip.mingguanPekan(juaraMingguan[0].minggu)}
            </p>
            <p className="mt-0.5 text-xs text-tinta-redup">{copy.arsip.mingguanInfo}</p>
          </div>
          <ul className="mt-3 flex flex-col gap-2">
            {juaraMingguan.map((j) => (
              <li
                key={j.jenis}
                className="flex items-start gap-3 rounded-lg bg-kertas-1/60 px-3 py-2.5"
              >
                <span className="w-24 shrink-0 pt-0.5 tabular text-[11px] font-medium uppercase tracking-wide text-tinta-redup">
                  {copy.arsip.jenis[j.jenis] ?? j.jenis}
                </span>
                <SiteLogo listingId={j.listingId} nama={j.nama} className="size-9 shrink-0 rounded-md text-xs" />
                <div className="min-w-0 flex-1">
                  <a
                    href={`/k/${j.listingId}?asal=arsip`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate font-display font-semibold text-tinta hover:text-merah-teks"
                  >
                    {j.nama}
                  </a>
                  {j.deskripsi && (
                    <p className="truncate text-xs text-tinta-redup">{j.deskripsi}</p>
                  )}
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-tinta-redup">
                    <span className="truncate">
                      {j.urlNormal.replace(/^https?:\/\//, "").replace(/\/+$/, "")}
                    </span>
                    {j.kategoriNama && (
                      <>
                        <span aria-hidden>·</span>
                        <KategoriIcon slug={j.kategoriSlug} className="size-3.5 text-tinta-redup" />
                        {j.kategoriNama}
                      </>
                    )}
                    <span aria-hidden>·</span>
                    <span className="shrink-0 font-medium text-tinta">{metrikLabel(j)}</span>
                  </p>
                </div>
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
                  <span className="tabular text-xs text-tinta-redup">{r.tanggal}</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
