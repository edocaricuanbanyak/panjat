import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { buttonClasses } from "@/components/Button";
import { LencanaRow } from "@/components/LencanaRow";
import { PageShell } from "@/components/PageShell";
import { DasborListingSkeleton } from "@/components/Skeleton";
import { Sparkline } from "@/components/Sparkline";
import { StatTile } from "@/components/StatTile";
import { copy } from "@/copy";
import { db } from "@/db";
import { jagaPosisi } from "@/db/schema";
import { getDashboard, ownsListing } from "@/domain/dashboard";
import { formatRupiah, formatWIB } from "@/lib/format";
import { currentKontak } from "@/lib/session";
import { DescEdit } from "./DescEdit";
import { JagaPosisiPanel } from "./JagaPosisiPanel";
import { ScreenshotPanel } from "./ScreenshotPanel";

export const dynamic = "force-dynamic";

export default async function DasborListing({
  params,
}: {
  params: Promise<{ listing: string }>;
}) {
  const kontakId = await currentKontak();
  if (!kontakId) redirect("/dasbor/masuk");

  const { listing: listingId } = await params;
  // Ownership is the real 404 gate (unowned / nonexistent) and is resolved here,
  // before any streaming, so it stays a hard 404.
  if (!(await ownsListing(db, listingId, kontakId))) notFound();

  return (
    <PageShell>
      <a href="/dasbor" className="text-sm text-tinta-redup hover:text-tinta">
        ← Dasbor
      </a>
      {/* The heavy dashboard aggregate streams in behind a skeleton. */}
      <Suspense fallback={<DasborListingSkeleton />}>
        <DashboardBody listingId={listingId} />
      </Suspense>
    </PageShell>
  );
}

async function DashboardBody({ listingId }: { listingId: string }) {
  const d = await getDashboard(db, listingId);
  if (!d) notFound();

  const [jaga] = await db
    .select({ target: jagaPosisi.target, budgetSisa: jagaPosisi.budgetSisa, aktif: jagaPosisi.aktif })
    .from(jagaPosisi)
    .where(eq(jagaPosisi.listingId, listingId))
    .limit(1);

  return (
    <>
      <h1 className="display-lg mt-2">{d.nama}</h1>
      <p className="mt-1 tabular text-xs text-tinta-redup">
        {d.urlNormal} · {d.status}
      </p>
      {d.badges.length > 0 && (
        <div className="mt-3">
          <LencanaRow badges={d.badges} />
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile label={copy.dasbor.statPegangan} value={formatRupiah(d.pegangan)} />
        <StatTile label={copy.dasbor.statPosisi} value={d.rank ? `#${d.rank}` : "—"} />
        <StatTile
          label={copy.dasbor.statRosot}
          value={d.rosotPerHari ? copy.dasbor.perHari(formatRupiah(d.rosotPerHari)) : "—"}
        />
        <StatTile
          label={copy.dasbor.statEstimasi}
          value={d.estimasiHari === null ? copy.dasbor.stabil : copy.dasbor.bertahanHari(d.estimasiHari)}
        />
        <StatTile
          label={copy.dasbor.statKlik}
          value={String(d.klikHariIni)}
          sub={copy.dasbor.totalKlik(d.klikTotal)}
        />
        <StatTile
          label={copy.dasbor.statCpc}
          value={d.cpc === null ? "—" : copy.dasbor.perKlik(formatRupiah(d.cpc))}
          sub={d.cpc === null ? copy.dasbor.cpcBelum : copy.dasbor.cpcSub}
        />
      </div>

      <section className="mt-6">
        <h2 className="masthead mb-2">
          {copy.dasbor.posisi7}
        </h2>
        <div className="rounded-xl border border-garis bg-kertas-1 p-4 shadow-kartu">
          <Sparkline ranks={d.seri7hari.map((p) => p.rank)} />
        </div>
      </section>

      <section className="mt-6 flex flex-wrap gap-2">
        <a href={`/manjat?url=${encodeURIComponent(d.urlNormal)}`} className={buttonClasses("primary", "md")}>
          {copy.dasbor.manjatLagi}
        </a>
      </section>

      <section className="mt-6">
        <h2 className="masthead mb-2">
          {copy.dasbor.jagaJudul}
        </h2>
        <JagaPosisiPanel listingId={d.listingId} jaga={jaga ?? null} />
      </section>

      <section className="mt-6">
        <h2 className="masthead mb-2">
          {copy.dasbor.pratinjauSitus}
        </h2>
        <ScreenshotPanel listingId={d.listingId} screenshotUrl={d.screenshotUrl} nama={d.nama} />
      </section>

      <section className="mt-6">
        <h2 className="masthead mb-2">
          {copy.dasbor.deskripsi}
        </h2>
        <DescEdit listingId={d.listingId} initial={d.deskripsi ?? ""} />
      </section>

      <section className="mt-6">
        <h2 className="masthead mb-2">
          {copy.dasbor.riwayat}
        </h2>
        {d.riwayat.length === 0 ? (
          <p className="text-sm text-tinta-redup">{copy.dasbor.belumBayar}</p>
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
                <span className="font-sans tabular font-semibold text-tinta">
                  {formatRupiah(r.nominal)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
