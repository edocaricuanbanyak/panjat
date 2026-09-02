import { redirect } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { copy } from "@/copy";
import { db } from "@/db";
import { listMyListings } from "@/domain/dashboard";
import { formatRupiah } from "@/lib/format";
import { currentKontak } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DasborIndex() {
  const kontakId = await currentKontak();
  if (!kontakId) redirect("/dasbor/masuk");

  const listings = await listMyListings(db, kontakId);

  return (
    <PageShell>
      <div className="flex items-end justify-between">
        <h1
          className="font-display text-3xl font-bold text-tinta sm:text-4xl"
          style={{ fontStretch: "125%" }}
        >
          {copy.dasbor.judul}
        </h1>
        <form action="/api/dasbor/keluar" method="post">
          <button className="text-sm text-tinta-redup hover:text-tinta">{copy.dasbor.keluar}</button>
        </form>
      </div>

      {listings.length === 0 ? (
        <p className="mt-6 text-tinta-redup">
          {copy.dasbor.belumAdaListing}{" "}
          <a href="/manjat" className="text-merah-teks hover:underline">
            {copy.dasbor.manjatSekarang}
          </a>
          .
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-2.5">
          {listings.map((l) => (
            <li key={l.id}>
              <a
                href={`/dasbor/${l.id}`}
                className="flex items-center justify-between rounded-xl border border-garis bg-kertas-1 p-4 shadow-kartu transition-all ease-panjat hover:-translate-y-px hover:border-tinta/20"
              >
                <span className="min-w-0">
                  <span className="block truncate font-display font-semibold text-tinta">
                    {l.nama}
                  </span>
                  <span className="tabular text-xs text-tinta-redup">{l.status}</span>
                </span>
                <span className="font-sans tabular text-base font-semibold text-tinta">
                  {formatRupiah(l.pegangan)}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
