import { notFound, redirect } from "next/navigation";
import { buttonClasses } from "@/components/Button";
import { LencanaRow } from "@/components/LencanaRow";
import { PageShell } from "@/components/PageShell";
import { Sparkline } from "@/components/Sparkline";
import { StatTile } from "@/components/StatTile";
import { db } from "@/db";
import { getDashboard, ownsListing } from "@/domain/dashboard";
import { formatRupiah, formatWIB } from "@/lib/format";
import { currentKontak } from "@/lib/session";
import { DescEdit } from "./DescEdit";

export const dynamic = "force-dynamic";

export default async function DasborListing({
  params,
}: {
  params: Promise<{ listing: string }>;
}) {
  const kontakId = await currentKontak();
  if (!kontakId) redirect("/dasbor/masuk");

  const { listing: listingId } = await params;
  if (!(await ownsListing(db, listingId, kontakId))) notFound();

  const d = await getDashboard(db, listingId);
  if (!d) notFound();

  return (
    <PageShell>
      <a href="/dasbor" className="text-sm text-tinta-redup hover:text-tinta">
        ← Dasbor
      </a>
      <h1 className="mt-2 font-display text-3xl font-bold text-tinta sm:text-4xl" style={{ fontStretch: "125%" }}>
        {d.nama}
      </h1>
      <p className="mt-1 font-mono text-xs text-tinta-redup">
        {d.urlNormal} · {d.status}
      </p>
      {d.badges.length > 0 && (
        <div className="mt-3">
          <LencanaRow badges={d.badges} />
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label="Pegangan" value={formatRupiah(d.pegangan)} />
        <StatTile label="Posisi" value={d.rank ? `#${d.rank}` : "—"} />
        <StatTile
          label="Laju rosot"
          value={d.rosotPerHari ? `${formatRupiah(d.rosotPerHari)}/hari` : "—"}
        />
        <StatTile
          label="Estimasi bertahan"
          value={d.estimasiHari === null ? "stabil" : `~${d.estimasiHari} hari`}
        />
        <StatTile
          label="Klik hari ini"
          value={String(d.klikHariIni)}
          sub={`total ${d.klikTotal}`}
        />
        <StatTile
          label="CPC"
          value={d.cpc === null ? "—" : `${formatRupiah(d.cpc)}/klik`}
          sub={d.cpc === null ? "belum ada klik" : "biaya rosot ÷ klik hari ini"}
        />
      </div>

      <section className="mt-6">
        <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-tinta-redup">
          Posisi 7 hari
        </h2>
        <div className="rounded-xl border border-garis bg-kertas-1 p-4 shadow-kartu">
          <Sparkline ranks={d.seri7hari.map((p) => p.rank)} />
        </div>
      </section>

      <section className="mt-6 flex flex-wrap gap-2">
        <a href={`/manjat?url=${encodeURIComponent(d.urlNormal)}`} className={buttonClasses("primary", "md")}>
          Manjat lagi
        </a>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-tinta-redup">
          Deskripsi
        </h2>
        <DescEdit listingId={d.listingId} initial={d.deskripsi ?? ""} />
      </section>

      <section className="mt-6">
        <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-tinta-redup">
          Riwayat pembayaran
        </h2>
        {d.riwayat.length === 0 ? (
          <p className="text-sm text-tinta-redup">Belum ada pembayaran.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {d.riwayat.map((r, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-lg border border-garis bg-kertas-1 px-3.5 py-2.5 text-sm shadow-kartu"
              >
                <span className="text-tinta-redup">
                  {formatWIB(r.waktu)} · {r.metode ?? "—"}
                </span>
                <span className="font-mono tabular font-semibold text-tinta">
                  {formatRupiah(r.nominal)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageShell>
  );
}
