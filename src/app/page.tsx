import { BoardLive } from "@/components/BoardLive";
import { CaraMain } from "@/components/CaraMain";
import { EmptyState } from "@/components/EmptyState";
import { Footer } from "@/components/Footer";
import { HeroManjat } from "@/components/HeroManjat";
import { KakiTiang } from "@/components/KakiTiang";
import { ManjatProvider } from "@/components/ManjatModal";
import { Nav } from "@/components/Nav";
import { Spotlight } from "@/components/Spotlight";
import { TebakJuara } from "@/components/TebakJuara";
import { TiangRail } from "@/components/TiangRail";
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

  return (
    <ManjatProvider kategori={kats}>
      <main className="mx-auto w-full max-w-3xl px-4 py-8">
        <Nav active="papan" />

        {/* HERO — value + the one action, up top */}
        <section className="py-2">
          <h1
            className="font-display text-4xl font-bold text-tinta"
            style={{ fontStretch: "130%" }}
          >
            Panjat
          </h1>
          <p className="mt-2 max-w-xl text-tinta-redup">
            Bayar untuk manjat. Pegangan paling kuat duduk paling atas. Tiangnya licin — yang
            berhenti manjat, merosot.
          </p>
          <HeroManjat kategori={kats} />
          <div className="mt-3 flex gap-4 font-mono tabular text-xs text-tinta-redup">
            <span>{entries.length} pemanjat</span>
            <span>{formatRupiah(totalPegangan)} total pegangan</span>
          </div>
        </section>

        <CaraMain />

        {/* PAPAN */}
        <section className="mt-10">
          <h2 className="mb-3 font-display text-lg font-semibold text-tinta">Papan</h2>
          {entries.length === 0 ? (
            <EmptyState title="Belum ada yang manjat." message="Tiangnya masih kinclong." />
          ) : (
            <div className="flex gap-4">
              <TiangRail className="w-3 shrink-0" />
              <BoardLive initial={{ entries, max }} />
            </div>
          )}
        </section>

        {/* KAKI TIANG (gratis) */}
        <KakiTiang entries={kakiTiang} remaining={sisaSorak} />
        <p className="mt-3 text-xs text-tinta-redup">
          Punya produk?{" "}
          <a href="/pasang-gratis" className="text-merah hover:underline">
            Pasang gratis di Kaki Tiang
          </a>
          .
        </p>

        {/* SEKUNDER — ritual & sorotan, di bawah */}
        {entries.length > 0 && (
          <div className="mt-10">
            <TebakJuara status={tebak} />
            <Spotlight items={entries.map((e) => ({ id: e.id, nama: e.nama, pegangan: e.pegangan }))} />
          </div>
        )}

        <Footer />
      </main>
    </ManjatProvider>
  );
}
