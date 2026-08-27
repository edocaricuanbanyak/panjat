import { buttonClasses } from "@/components/Button";
import { db } from "@/db";
import { getMomen } from "@/domain/momen";
import { formatRupiah } from "@/lib/format";
import { ShareButton } from "./ShareButton";

export const dynamic = "force-dynamic";

/**
 * Momen Puncak (MI-1) — "ini produk sesungguhnya" (§9.2). Static SSR version;
 * the animated reveal sequence is client polish, deferred.
 */
export default async function SelesaiPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  const momen = order ? await getMomen(db, order) : null;

  if (!momen) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-tinta">Pembayaran diproses</h1>
        <p className="mt-2 text-sm text-tinta-redup">
          Posisimu akan muncul di papan begitu pembayaran dikonfirmasi.
        </p>
        <a href="/" className={`${buttonClasses("primary", "md")} mt-6 self-center`}>
          Ke papan
        </a>
      </main>
    );
  }

  const heading = momen.puncak ? "Kamu di puncak!" : `Kamu naik ke #${momen.rank}`;

  return (
    <main className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-12 text-center">
      <p className="font-mono text-xs uppercase tracking-wide text-tinta-redup">Momen Puncak</p>

      <div
        className="mt-3 font-display font-extrabold text-merah"
        style={{ fontStretch: "150%", fontSize: "6rem", lineHeight: 1 }}
      >
        #{momen.rank}
      </div>
      <h1 className="mt-2 font-display text-2xl font-bold text-tinta" style={{ fontStretch: "120%" }}>
        {heading}
      </h1>
      <p className="mt-1 text-sm text-tinta-redup">
        {momen.nama} · pegangan {formatRupiah(momen.pegangan)}
        {momen.overtaken > 0 && <> · menyalip {momen.overtaken} pemanjat</>}
      </p>

      {/* Shareable flex card (R5) */}
      <img
        src={`/api/og/${momen.listingId}?story=1`}
        alt={`Kartu ${momen.nama}`}
        width={270}
        height={480}
        className="mt-6 rounded-lg border border-garis shadow-sm"
      />

      <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
        <ShareButton url="/" text={`Aku #${momen.rank} di Panjat!`} />
        <a href="/" className={buttonClasses("secondary", "md")}>
          Lihat papan
        </a>
      </div>
    </main>
  );
}
