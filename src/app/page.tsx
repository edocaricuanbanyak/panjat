import { BoardLive } from "@/components/BoardLive";
import { buttonClasses } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { Nav } from "@/components/Nav";
import { TebakJuara } from "@/components/TebakJuara";
import { TiangRail } from "@/components/TiangRail";
import { db } from "@/db";
import { getBoard } from "@/domain/board";
import { guessStatus } from "@/domain/tebakan";
import { currentAnon } from "@/lib/anon";
import { formatRupiah } from "@/lib/format";

// Reads the DB per request; also keeps it out of the build-time prerender.
export const dynamic = "force-dynamic";

export default async function Home() {
  const { entries, max } = await getBoard(db);
  const totalPegangan = entries.reduce((sum, e) => sum + e.pegangan, 0);
  const tebak = await guessStatus(db, await currentAnon(), new Date());

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Nav active="papan" />
      <header>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1
              className="font-display text-3xl font-bold text-tinta"
              style={{ fontStretch: "125%" }}
            >
              Panjat
            </h1>
            <p className="mt-1 text-sm text-tinta-redup">Manjat, atau merosot.</p>
          </div>
          <a href="/manjat" className={buttonClasses("primary", "md")}>
            Manjat
          </a>
        </div>

        <div className="mt-4 flex gap-4 font-mono tabular text-xs text-tinta-redup">
          <span>{entries.length} pemanjat</span>
          <span>{formatRupiah(totalPegangan)} total pegangan</span>
        </div>

        {/* Cara main, 10 detik (R20-b) */}
        <p className="mt-4 rounded-md bg-kertas-2 px-3 py-2 text-xs text-tinta-redup">
          Bayar untuk manjat · Tiangnya licin, semua merosot · Manjat lagi kalau mau bertahan
        </p>
      </header>

      {entries.length > 0 && <TebakJuara status={tebak} />}

      {entries.length === 0 ? (
        <EmptyState title="Belum ada yang manjat." message="Tiangnya masih kinclong." />
      ) : (
        <div className="mt-6 flex gap-4">
          <TiangRail className="w-3 shrink-0" />
          <BoardLive initial={{ entries, max }} />
        </div>
      )}
    </main>
  );
}
