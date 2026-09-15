import { buttonClasses } from "@/components/Button";
import { copy } from "@/copy";
import { db } from "@/db";
import { getMomen } from "@/domain/momen";
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
        <h1 className="display-md">{copy.manjat.diprosesJudul}</h1>
        <p className="mt-2 text-sm text-tinta-redup">{copy.manjat.diprosesPesan}</p>
        <a href="/" className={`${buttonClasses("primary", "md")} mt-6 self-center`}>
          {copy.manjat.kePapan}
        </a>
      </main>
    );
  }

  const heading = momen.puncak ? copy.momen.dipuncak : copy.momen.naik(momen.rank);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-10 text-center md:max-w-4xl">
      <MomenPuncakReveal
        rank={momen.rank}
        total={momen.rank + momen.overtaken}
        heading={heading}
        nama={momen.nama}
        listingId={momen.listingId}
        order={order}
        hasScreenshot={momen.hasScreenshot}
      />
    </main>
  );
}
