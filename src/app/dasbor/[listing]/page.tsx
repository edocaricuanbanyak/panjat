import { notFound, redirect } from "next/navigation";
import { buttonClasses } from "@/components/Button";
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
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <a href="/dasbor" className="text-sm text-tinta-redup hover:text-tinta">
        ← Dasbor
      </a>
      <h1 className="mt-2 font-display text-2xl font-bold text-tinta" style={{ fontStretch: "120%" }}>
        {d.nama}
      </h1>
      <p className="font-mono text-xs text-tinta-redup">
        {d.urlNormal} · {d.status}
      </p>

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
        <h2 className="mb-2 text-sm font-semibold text-tinta">Posisi 7 hari</h2>
        <div className="rounded-lg border border-garis bg-kertas-1 p-3">
          <Sparkline ranks={d.seri7hari.map((p) => p.rank)} />
        </div>
      </section>

      <section className="mt-6 flex flex-wrap gap-2">
        <a href={`/manjat?url=${encodeURIComponent(d.urlNormal)}`} className={buttonClasses("primary", "md")}>
          Manjat lagi
        </a>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-tinta">Deskripsi</h2>
        <DescEdit listingId={d.listingId} initial={d.deskripsi ?? ""} />
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-tinta">Riwayat pembayaran</h2>
        {d.riwayat.length === 0 ? (
          <p className="text-sm text-tinta-redup">Belum ada pembayaran.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {d.riwayat.map((r, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-md border border-garis bg-kertas-1 px-3 py-2 text-sm"
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
    </main>
  );
}
