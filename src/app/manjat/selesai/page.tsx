import { buttonClasses } from "@/components/Button";
import { db } from "@/db";
import { getMomen } from "@/domain/momen";
import { formatRupiah } from "@/lib/format";
import { MomenPuncakReveal } from "./MomenPuncakReveal";

export const dynamic = "force-dynamic";

/** Momen Puncak (MI-1) — "ini produk sesungguhnya" (§9.2). Animated reveal. */
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
      <MomenPuncakReveal
        rank={momen.rank}
        heading={heading}
        nama={momen.nama}
        pegangan={formatRupiah(momen.pegangan)}
        overtaken={momen.overtaken}
        listingId={momen.listingId}
      />
    </main>
  );
}
