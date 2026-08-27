import { BoardLive } from "@/components/BoardLive";
import { BoardTabs } from "@/components/BoardTabs";
import { CaraMain } from "@/components/CaraMain";
import { EmptyState } from "@/components/EmptyState";
import { HeroManjat } from "@/components/HeroManjat";
import { KakiTiang } from "@/components/KakiTiang";
import { PageShell } from "@/components/PageShell";
import { Spotlight } from "@/components/Spotlight";
import { TebakJuara } from "@/components/TebakJuara";
import { db } from "@/db";
import { getBoard } from "@/domain/board";
import { listCategories } from "@/domain/jelajah";
import { getKakiTiang, sorakRemaining } from "@/domain/sorak";
import { guessStatus } from "@/domain/tebakan";
import { currentAnon } from "@/lib/anon";
import { formatRupiah } from "@/lib/format";

// Reads the DB per request; also keeps it out of the build-time prerender.
export const dynamic = "force-dynamic";

export default async function Home() {
  const now = new Date();
  const anonId = await currentAnon();
  const { entries, max } = await getBoard(db);
  const totalPegangan = entries.reduce((sum, e) => sum + e.pegangan, 0);
  const [tebak, kakiTiang, sisaSorak, kats] = await Promise.all([
    guessStatus(db, anonId, now),
    getKakiTiang(db),
    sorakRemaining(db, anonId, now),
    listCategories(db),
  ]);

  const spotlightItems = entries.map((e) => ({ id: e.id, nama: e.nama, pegangan: e.pegangan }));

  return (
    <PageShell
      manjatKategori={kats}
      topbar={spotlightItems.length > 0 ? <Spotlight items={spotlightItems} /> : undefined}
    >
      {/* HERO — value + the one action */}
      <section className="pt-2 pb-8">
        <h1
          className="font-display text-5xl font-bold leading-[0.95] text-tinta sm:text-6xl"
          style={{ fontStretch: "130%" }}
        >
          Panjat tenar? Di sini aja.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-tinta-redup">
          Pegangan paling kuat duduk paling atas. Tiangnya licin — yang berhenti manjat, merosot.
        </p>
        <HeroManjat kategori={kats} />
        <div className="mt-4 flex gap-6 font-mono tabular text-xs text-tinta-redup">
          <span>
            <b className="text-tinta">{entries.length}</b> pemanjat
          </span>
          <span>
            <b className="text-tinta">{formatRupiah(totalPegangan)}</b> total pegangan
          </span>
        </div>
      </section>

      {/* PAPAN — the board, under its tab */}
      <section>
        <BoardTabs active="sekarang" className="mb-5" />
        {entries.length === 0 ? (
          <EmptyState title="Belum ada yang manjat." message="Tiangnya masih kinclong." />
        ) : (
          <BoardLive initial={{ entries, max }} />
        )}
      </section>

      {/* KAKI TIANG (gratis) */}
      <div className="mt-12">
        <KakiTiang entries={kakiTiang} remaining={sisaSorak} />
        <p className="mt-3 text-xs text-tinta-redup">
          Punya produk?{" "}
          <a href="/pasang-gratis" className="text-merah hover:underline">
            Pasang gratis di Kaki Tiang
          </a>
          .
        </p>
      </div>

      {/* CARA MAIN */}
      <section className="mt-14">
        <h2 className="mb-6 font-display text-sm font-semibold uppercase tracking-wide text-tinta-redup">
          Cara main
        </h2>
        <CaraMain />
      </section>

      {/* SEKUNDER — ritual */}
      {entries.length > 0 && (
        <div className="mt-14">
          <TebakJuara status={tebak} />
        </div>
      )}
    </PageShell>
  );
}
