import { cookies } from "next/headers";
import { BoardLive } from "@/components/BoardLive";
import { BoardTabs } from "@/components/BoardTabs";
import { CaraMain } from "@/components/CaraMain";
import { EmptyState } from "@/components/EmptyState";
import { HeroManjat } from "@/components/HeroManjat";
import { KakiTiang } from "@/components/KakiTiang";
import { ListingCard } from "@/components/ListingCard";
import { JuaraKakiTiang } from "@/components/JuaraKakiTiang";
import { PageShell } from "@/components/PageShell";
import { Pagination } from "@/components/Pagination";
import { PasangGratisModal } from "@/components/PasangGratisModal";
import { Spotlight } from "@/components/Spotlight";
import { VoteFavorit } from "@/components/VoteFavorit";
import { copy } from "@/copy";
import { db } from "@/db";
import { getBoard } from "@/domain/board";
import { listCategories } from "@/domain/jelajah";
import { getKakiTiang, sorakRemaining } from "@/domain/sorak";
import { recentAktivitas } from "@/lib/aktivitas";
import { currentAnon } from "@/lib/anon";
import { favoritBoard, myFavoritToday } from "@/lib/favorit";
import { pingVisitor, VID_COOKIE, visitorStats } from "@/lib/presence";

// Reads the DB per request; also keeps it out of the build-time prerender.
export const dynamic = "force-dynamic";

const PER_PAGE = 20;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ hal?: string }>;
}) {
  const now = new Date();
  const anonId = await currentAnon();
  const vid = (await cookies()).get(VID_COOKIE)?.value;
  if (vid) await pingVisitor(vid);

  const { entries, max } = await getBoard(db);
  const [kakiTiang, sisaSorak, kats, visitor, favorit, choice, aktivitas] = await Promise.all([
    getKakiTiang(db),
    sorakRemaining(db, anonId, now),
    listCategories(db),
    visitorStats(),
    favoritBoard(db, now, 5),
    myFavoritToday(vid, now),
    recentAktivitas(20),
  ]);

  const totalPages = Math.max(1, Math.ceil(entries.length / PER_PAGE));
  const page = Math.min(Math.max(1, Number((await searchParams).hal) || 1), totalPages);
  const pageEntries = entries.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const voteEntries = entries.map((e) => ({ id: e.id, nama: e.nama }));
  const juaraGratis = kakiTiang[0]; // top Kaki Tiang by dukungan (wildcard showcase)

  return (
    <PageShell
      manjatKategori={kats}
      topbar={aktivitas.length > 0 ? <Spotlight items={aktivitas} /> : undefined}
    >
      {/* HERO — value + the one action */}
      <section className="pt-2 pb-8">
        <h1
          className="font-display text-5xl font-bold leading-[0.95] text-tinta sm:text-6xl"
          style={{ fontStretch: "130%" }}
        >
          {copy.beranda.heroJudul}
        </h1>
        <p className="mt-4 max-w-xl text-lg text-tinta-redup">{copy.beranda.heroSub}</p>
        <HeroManjat kategori={kats} />
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 font-mono tabular text-xs text-tinta-redup">
          <span className="inline-flex items-center gap-1.5">
            <span className="blink inline-block size-1.5 rounded-full bg-hidup" aria-hidden />
            <b className="text-tinta">{visitor.online}</b> {copy.beranda.statOnline}
          </span>
          <span>
            <b className="text-tinta">{visitor.total.toLocaleString("id-ID")}</b>{" "}
            {copy.beranda.statPengunjung}
          </span>
          <span>
            <b className="text-tinta">{entries.length}</b> {copy.beranda.statPeserta}
          </span>
        </div>
      </section>

      {/* PAPAN — the board, under its tab */}
      <section>
        <BoardTabs active="sekarang" className="mb-5" />
        {entries.length === 0 ? (
          <EmptyState title={copy.beranda.papanKosongJudul} message={copy.beranda.papanKosongPesan} />
        ) : page === 1 ? (
          <>
            <BoardLive
              initial={{ entries, max }}
              middle={<VoteFavorit entries={voteEntries} leaderboard={favorit} myChoice={choice} />}
            />
            {/* Top free listing rises here as a labelled wildcard — never a paid rank (R16). */}
            {juaraGratis && juaraGratis.sorak > 0 && <JuaraKakiTiang entry={juaraGratis} />}
          </>
        ) : (
          <div className="flex flex-col gap-2.5">
            {pageEntries.map((e) => (
              <ListingCard key={e.id} entry={e} />
            ))}
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} />
      </section>

      {/* KAKI TIANG (gratis) */}
      <div className="mt-12">
        <KakiTiang entries={kakiTiang} remaining={sisaSorak} />
        <div className="mt-3 text-xs text-tinta-redup">
          {copy.beranda.punyaProduk}{" "}
          <PasangGratisModal kategori={kats} className="text-merah-teks hover:underline" />.
        </div>
      </div>

      {/* CARA MAIN */}
      <section className="mt-14">
        <h2 className="mb-6 font-display text-sm font-semibold uppercase tracking-wide text-tinta-redup">
          {copy.beranda.caraMainJudul}
        </h2>
        <CaraMain />
      </section>
    </PageShell>
  );
}
