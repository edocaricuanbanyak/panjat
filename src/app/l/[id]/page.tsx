import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buttonClasses } from "@/components/Button";
import { LencanaRow } from "@/components/LencanaRow";
import { LogoTile } from "@/components/LogoTile";
import { PageShell } from "@/components/PageShell";
import { Sparkline } from "@/components/Sparkline";
import { db } from "@/db";
import { getListingPublik } from "@/domain/listing-publik";
import { formatRupiah } from "@/lib/format";
import { BASE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  if (!UUID.test(id)) return { title: "Panjat" };
  const l = await getListingPublik(db, id);
  if (!l) return { title: "Panjat" };
  const title = `${l.nama}${l.rank ? ` · #${l.rank}` : ""} — Panjat`;
  return {
    title,
    description: l.deskripsi ?? `${l.nama} di papan Panjat.`,
    alternates: { canonical: `${BASE_URL}/l/${id}` },
    openGraph: { title, images: [`${BASE_URL}/api/og/${id}`] },
  };
}

export default async function ListingPublikPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const l = await getListingPublik(db, id);
  if (!l) notFound();

  return (
    <PageShell>
      <div className="flex items-start gap-4">
        <LogoTile nama={l.nama} className="size-16 rounded-md text-3xl" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-bold text-tinta" style={{ fontStretch: "125%" }}>
            {l.nama}
          </h1>
          <p className="font-mono text-xs text-tinta-redup">
            {l.urlNormal}
            {l.kategoriSlug && (
              <>
                {" · "}
                <a href={`/kategori/${l.kategoriSlug}`} className="hover:text-tinta">
                  {l.kategoriNama}
                </a>
              </>
            )}
          </p>
        </div>
      </div>

      {l.deskripsi && <p className="mt-3 text-sm text-tinta">{l.deskripsi}</p>}
      {l.badges.length > 0 && (
        <div className="mt-3">
          <LencanaRow badges={l.badges} />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="font-mono tabular text-sm text-tinta">
          {l.rank ? `#${l.rank}` : "—"} · pegangan {formatRupiah(l.pegangan)}
        </span>
        <a href={`/k/${l.id}?asal=jelajah`} target="_blank" rel="noopener noreferrer" className={buttonClasses("primary", "sm")}>
          Kunjungi situs
        </a>
        <a href={`/manjat?url=${encodeURIComponent(l.urlNormal)}`} className={buttonClasses("secondary", "sm")}>
          Salip di papan
        </a>
      </div>

      {l.riwayat.length >= 2 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-tinta">Posisi terakhir</h2>
          <div className="rounded-lg border border-garis bg-kertas-1 p-3">
            <Sparkline ranks={l.riwayat.map((p) => p.rank)} />
          </div>
        </section>
      )}

      {l.serupa.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-tinta">Serupa di kategori ini</h2>
          <ul className="flex flex-col gap-2">
            {l.serupa.map((s) => (
              <li key={s.id}>
                <a href={`/l/${s.id}`} className="flex items-center gap-3 rounded-lg border border-garis bg-kertas-1 p-3 hover:bg-kertas-2">
                  <LogoTile nama={s.nama} />
                  <div className="min-w-0">
                    <span className="block truncate font-display font-semibold text-tinta">{s.nama}</span>
                    {s.deskripsi && <span className="block truncate text-xs text-tinta-redup">{s.deskripsi}</span>}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-6 text-xs text-tinta-redup">
        <a href={`/lapor?listing=${l.id}`} className="hover:text-tinta">
          Laporkan / klaim listing ini
        </a>
      </p>
    </PageShell>
  );
}
