import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buttonClasses } from "@/components/Button";
import { JsonLd } from "@/components/JsonLd";
import { LencanaRow } from "@/components/LencanaRow";
import { KategoriIcon } from "@/components/KategoriIcon";
import { ManjatButton } from "@/components/ManjatModal";
import { copy } from "@/copy";
import { SiteLogo } from "@/components/SiteLogo";
import { PageShell } from "@/components/PageShell";
import { Sparkline } from "@/components/Sparkline";
import { db } from "@/db";
import { getListingPublik } from "@/domain/listing-publik";
import { formatRupiah } from "@/lib/format";
import { breadcrumbJsonLd, listingOrgJsonLd } from "@/lib/jsonld";
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

  const title = `${l.nama}${l.rank ? ` · #${l.rank}` : ""} — ${copy.merek.nama}`;
  const description = l.deskripsi ?? copy.listing.ogDeskripsi(l.nama);
  const url = `${BASE_URL}/l/${id}`;
  // The per-listing share card (/api/og/[id]) — 1200×630. Set dimensions + alt so
  // scrapers render the large card immediately, and repeat title/description on
  // both graphs so a Twitter/X share doesn't fall back to the site-wide default.
  const image = {
    url: `${BASE_URL}/api/og/${id}`,
    width: 1200,
    height: 630,
    alt: copy.listing.ogAlt(l.nama, l.rank),
  };
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: copy.merek.nama,
      locale: "id_ID",
      title,
      description,
      url,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
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

  const trail = [
    { name: copy.nav.beranda, path: "/" },
    ...(l.kategoriSlug && l.kategoriNama
      ? [{ name: l.kategoriNama, path: `/kategori/${l.kategoriSlug}` }]
      : []),
    { name: l.nama, path: `/l/${l.id}` },
  ];

  return (
    <PageShell>
      <JsonLd data={[breadcrumbJsonLd(trail), listingOrgJsonLd(l)]} />
      <div className="flex items-start gap-4">
        <SiteLogo listingId={l.id} nama={l.nama} className="size-16 rounded-md text-3xl" />
        <div className="min-w-0 flex-1">
          <h1 className="display-lg">
            {l.nama}
          </h1>
          <p className="tabular text-xs text-tinta-redup">
            {l.urlNormal}
            {l.kategoriSlug && (
              <>
                {" · "}
                <a
                  href={`/kategori/${l.kategoriSlug}`}
                  className="inline-flex items-center gap-1 align-middle hover:text-tinta"
                >
                  <KategoriIcon slug={l.kategoriSlug} className="size-3.5" />
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
        <span className="font-sans tabular text-sm text-tinta">
          {l.rank ? `#${l.rank}` : "—"} · pegangan {formatRupiah(l.pegangan)}
        </span>
        <a href={`/k/${l.id}?asal=jelajah`} target="_blank" rel="noopener noreferrer" className={buttonClasses("primary", "sm")}>
          Kunjungi situs
        </a>
        <ManjatButton url={l.urlNormal} nominal={l.pegangan + 1000} variant="secondary" size="sm">
          Salip di papan
        </ManjatButton>
      </div>

      {/* Site screenshot (R21) — own storage; absent → the logo above stands in. */}
      {l.screenshotUrl && (
        <img
          src={l.screenshotUrl}
          alt={copy.listing.pratinjauAlt(l.nama)}
          width={1200}
          height={800}
          className="mt-6 w-full rounded-xl border border-garis shadow-kartu"
        />
      )}

      {l.riwayat.length >= 2 && (
        <section className="mt-6">
          <h2 className="masthead mb-2">Posisi terakhir</h2>
          <div className="rounded-lg border border-garis bg-kertas-1 p-3">
            <Sparkline ranks={l.riwayat.map((p) => p.rank)} />
          </div>
        </section>
      )}

      {l.serupa.length > 0 && (
        <section className="mt-6">
          <h2 className="masthead mb-2">Serupa di kategori ini</h2>
          <ul className="flex flex-col gap-2">
            {l.serupa.map((s) => (
              <li key={s.id}>
                <a href={`/l/${s.id}`} className="flex items-center gap-3 rounded-lg border border-garis bg-kertas-1 p-3 hover:bg-kertas-2">
                  <SiteLogo listingId={s.id} nama={s.nama} />
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
