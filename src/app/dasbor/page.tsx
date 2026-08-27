import { redirect } from "next/navigation";
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
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-tinta" style={{ fontStretch: "120%" }}>
          Dasbor
        </h1>
        <form action="/api/dasbor/keluar" method="post">
          <button className="text-sm text-tinta-redup hover:text-tinta">Keluar</button>
        </form>
      </div>

      {listings.length === 0 ? (
        <p className="mt-6 text-sm text-tinta-redup">
          Belum ada listing atas akun ini.{" "}
          <a href="/manjat" className="text-merah hover:underline">
            Manjat sekarang
          </a>
          .
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {listings.map((l) => (
            <li key={l.id}>
              <a
                href={`/dasbor/${l.id}`}
                className="flex items-center justify-between rounded-lg border border-garis bg-kertas-1 p-3 hover:bg-kertas-2"
              >
                <span className="min-w-0">
                  <span className="block truncate font-display font-semibold text-tinta">
                    {l.nama}
                  </span>
                  <span className="font-mono text-xs text-tinta-redup">{l.status}</span>
                </span>
                <span className="font-mono tabular text-sm font-semibold text-tinta">
                  {formatRupiah(l.pegangan)}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
