import { cookies } from "next/headers";
import { BoardLive } from "@/components/BoardLive";
import { CaraMain } from "@/components/CaraMain";
import { EmptyState } from "@/components/EmptyState";
import { HariIniBoard } from "@/components/HariIniBoard";
import { HeroManjat } from "@/components/HeroManjat";
import { HomeTabs } from "@/components/HomeTabs";
import { JelajahPanel } from "@/components/JelajahPanel";
import { JuaraKakiTiang } from "@/components/JuaraKakiTiang";
import { JuaraTerfavorit } from "@/components/JuaraTerfavorit";
import { KakiTiang } from "@/components/KakiTiang";
import { ListingCard } from "@/components/ListingCard";
import { PageShell } from "@/components/PageShell";
import { Pagination } from "@/components/Pagination";
import { PasangGratisModal } from "@/components/PasangGratisModal";
import { VoteFavorit } from "@/components/VoteFavorit";
import { copy } from "@/copy";
import { db } from "@/db";
import { getBoard } from "@/domain/board";
import { jelajahAll, listCategories } from "@/domain/jelajah";
import { getHariIni } from "@/domain/papan-hari-ini";
import { getJuaraKakiTiangArsip, getJuaraTerfavoritArsip } from "@/domain/juara-mingguan";
import { getKakiTiang, sorakRemaining } from "@/domain/sorak";
import { currentAnon } from "@/lib/anon";
import { favoritBoard, myFavoritToday } from "@/lib/favorit";
import { pingVisitor, VID_COOKIE, visitorStats } from "@/lib/presence";

// Reads the DB per request; also keeps it out of the build-time prerender.
export const dynamic = "force-dynamic";

const PER_PAGE = 20;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ hal?: string; baru?: string }>;
}) {
  const now = new Date();
  const anonId = await currentAnon();
  const vid = (await cookies()).get(VID_COOKIE)?.value;
  if (vid) await pingVisitor(vid);

  const { entries, max } = await getBoard(db);
  const [
    kakiTiang,
    juaraKakiTiang,
    juaraTerfavorit,
    sisaSorak,
    kats,
    visitor,
    favorit,
    choice,
    hariIni,
    jelajahItems,
  ] = await Promise.all([
    getKakiTiang(db),
    getJuaraKakiTiangArsip(db),
    getJuaraTerfavoritArsip(db),
    sorakRemaining(db, anonId, now),
    listCategories(db),
    visitorStats(),
    favoritBoard(db, now, 5),
    myFavoritToday(vid, now),
    getHariIni(db, now),
    jelajahAll(db),
  ]);

  const sp = await searchParams;
  const totalPages = Math.max(1, Math.ceil(entries.length / PER_PAGE));
  const page = Math.min(Math.max(1, Number(sp.hal) || 1), totalPages);
  const pageEntries = entries.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const voteEntries = entries.map((e) => ({ id: e.id, nama: e.nama, urlNormal: e.urlNormal }));

  return (
    <PageShell manjatKategori={kats}>
      {/* HERO — value + the one action */}
      <section className="pt-1 pb-5">
        <h1
          className="font-display text-4xl font-bold leading-[0.95] text-tinta sm:text-5xl md:text-6xl"
          style={{ fontStretch: "130%" }}
        >
          {copy.beranda.heroJudul}
        </h1>
        <p className="mt-3 max-w-xl text-base text-tinta-redup sm:text-lg">{copy.beranda.heroSub}</p>
        {/* Live social proof — the USP, leading into the CTA (one compact line). */}
        <dl className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5">
          <div className="inline-flex items-center gap-1.5">
            <span className="blink inline-block size-1.5 rounded-full bg-hidup" aria-hidden />
            <dd className="font-display text-lg font-bold leading-none text-hidup tabular">
              {visitor.online.toLocaleString("id-ID")}
            </dd>
            <dt className="text-xs text-tinta-redup">{copy.beranda.statOnline}</dt>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <dd className="font-display text-lg font-bold leading-none text-tinta tabular">
              {visitor.total.toLocaleString("id-ID")}
            </dd>
            <dt className="text-xs text-tinta-redup">{copy.beranda.statPengunjung}</dt>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <dd className="font-display text-lg font-bold leading-none text-tinta tabular">
              {entries.length.toLocaleString("id-ID")}
            </dd>
            <dt className="text-xs text-tinta-redup">{copy.beranda.statPeserta}</dt>
          </div>
        </dl>
        <HeroManjat kategori={kats} />
      </section>

      {/* PAPAN — three in-place tabs (no page navigation) */}
      <HomeTabs
        sekarang={
          <>
            {entries.length === 0 ? (
              <EmptyState
                title={copy.beranda.papanKosongJudul}
                message={copy.beranda.papanKosongPesan}
              />
            ) : page === 1 ? (
              <>
                <BoardLive
                  initial={{ entries, max }}
                  middle={
                    <VoteFavorit entries={voteEntries} leaderboard={favorit} myChoice={choice} />
                  }
                />
                {/* Weekly free-tier champion sits below rank 20 as a labelled
                    showcase — never a paid rank (R16). */}
                {juaraKakiTiang && <JuaraKakiTiang entry={juaraKakiTiang} />}
                {juaraTerfavorit && <JuaraTerfavorit entry={juaraTerfavorit} />}
              </>
            ) : (
              <div className="flex flex-col gap-2.5">
                {pageEntries.map((e) => (
                  <ListingCard key={e.id} entry={e} />
                ))}
              </div>
            )}
            <Pagination page={page} totalPages={totalPages} />
          </>
        }
        hariIni={
          <>
            <p className="mb-4 max-w-xl text-tinta-redup">{copy.hariIni.sub}</p>
            <HariIniBoard entries={hariIni} />
          </>
        }
        jelajah={<JelajahPanel items={jelajahItems} categories={kats} />}
      />

      {/* KAKI TIANG (gratis) */}
      <div className="mt-12">
        <KakiTiang entries={kakiTiang} remaining={sisaSorak} baruId={sp.baru ?? null} />
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
