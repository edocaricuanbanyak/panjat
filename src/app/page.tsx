import { cookies } from "next/headers";
import { Suspense } from "react";
import { BoardLive } from "@/components/BoardLive";
import { CaraMain } from "@/components/CaraMain";
import { EmptyState } from "@/components/EmptyState";
import { HariIniBoard } from "@/components/HariIniBoard";
import { HeroManjat } from "@/components/HeroManjat";
import { HomeTabs } from "@/components/HomeTabs";
import { JuaraTerfavorit } from "@/components/JuaraTerfavorit";
import { KakiTiang } from "@/components/KakiTiang";
import { ListingCard } from "@/components/ListingCard";
import { PageShell } from "@/components/PageShell";
import { Pagination } from "@/components/Pagination";
import { PasangGratisModal } from "@/components/PasangGratisModal";
import { HomeSkeleton } from "@/components/Skeleton";
import { JsonLd } from "@/components/JsonLd";
import { VoteFavorit } from "@/components/VoteFavorit";
import { copy } from "@/copy";
import { boardItemListJsonLd, websiteJsonLd } from "@/lib/jsonld";
import { formatCount } from "@/lib/format";
import { db } from "@/db";
import { type BoardEntry, getBoard } from "@/domain/board";
import { listCategories } from "@/domain/jelajah";
import { getHariIni } from "@/domain/papan-hari-ini";
import { getJuaraKakiTiangArsip, getJuaraTerfavoritArsip } from "@/domain/juara-mingguan";
import { getKakiTiang, sorakRemaining } from "@/domain/sorak";
import { currentAnon } from "@/lib/anon";
import { favoritBoard, myFavoritToday } from "@/lib/favorit";
import { pingVisitor, VID_COOKIE, visitorStats } from "@/lib/presence";

// Reads the DB per request; also keeps it out of the build-time prerender.
export const dynamic = "force-dynamic";

const PER_PAGE = 20;

// The board + its 10 parallel queries are the slow part; the sticky header/ticker
// (from PageShell) paint first, then the body streams in behind a skeleton. A
// route-level loading.tsx can't be used here — at src/app/ it's the root boundary
// that wraps every route and turns notFound() into a soft-404 (removed earlier).
export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ hal?: string; baru?: string }>;
}) {
  return (
    <PageShell padBottomMobile>
      <Suspense fallback={<HomeSkeleton />}>
        <HomeBody searchParams={searchParams} />
      </Suspense>
    </PageShell>
  );
}

async function HomeBody({
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
  ]);

  const sp = await searchParams;
  const totalPages = Math.max(1, Math.ceil(entries.length / PER_PAGE));
  const page = Math.min(Math.max(1, Number(sp.hal) || 1), totalPages);
  const pageEntries = entries.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // The weekly Kaki Tiang champion (free, Rp0) also earns a shot at "pemanjat
  // terfavorit" — added to the free vote pool (never touches money/ranking).
  const voteEntries = [
    ...entries.map((e) => ({ id: e.id, nama: e.nama, urlNormal: e.urlNormal })),
    ...(juaraKakiTiang
      ? [{ id: juaraKakiTiang.id, nama: juaraKakiTiang.nama, urlNormal: juaraKakiTiang.urlNormal }]
      : []),
  ].filter((e, i, a) => a.findIndex((x) => x.id === e.id) === i);

  // The weekly Kaki Tiang champion joins the board as its bottom row at Rp0 — a
  // free entry (no grip), easily overtaken by any paid listing. Same look as a
  // rank 4+ row; it rotates each week as a new champion is crowned.
  const championEntry: BoardEntry | null = juaraKakiTiang
    ? {
        rank: entries.length + 1,
        id: juaraKakiTiang.id,
        nama: juaraKakiTiang.nama,
        urlNormal: juaraKakiTiang.urlNormal,
        deskripsi: juaraKakiTiang.deskripsi,
        kategoriNama: juaraKakiTiang.kategoriNama,
        kategoriSlug: juaraKakiTiang.kategoriSlug,
        pegangan: 0,
        klikTotal: juaraKakiTiang.klik,
        rosotPerHari: 0,
        masihTerjaga: false,
        screenshotUrl: null,
        badges: [],
      }
    : null;

  // The champion "graduates" to the board row above, so drop it from the Kaki
  // Tiang list (no empty slot — the rest shift up).
  const kakiTiangEntries = championEntry
    ? kakiTiang.filter((e) => e.id !== championEntry.id)
    : kakiTiang;

  return (
    <>
      {/* Structured data: the site (with a real search box) + the board as an
          ordered ItemList. Position mirrors the on-page rank (pegangan desc), so
          it asserts no ranking the board doesn't already show. */}
      <JsonLd
        data={[
          websiteJsonLd(),
          boardItemListJsonLd(
            `${copy.merek.nama} — ${copy.nav.sepanjangMasa}`,
            pageEntries.map((e) => ({ id: e.id, nama: e.nama, rank: e.rank })),
          ),
        ]}
      />

      {/* HERO — value + the one action */}
      <section className="pt-1 pb-5">
        <h1 className="display-xl text-tinta">{copy.beranda.heroJudul}</h1>
        {/* Live social proof — the USP as one soft chip linking to full stats. */}
        <div className="mt-6">
          <a
            href="/statistik"
            className="group inline-flex max-w-full flex-wrap items-center justify-center gap-x-2.5 gap-y-1 rounded-full bg-kertas-2 px-4 py-2 text-sm"
          >
            <span className="inline-flex items-center gap-1.5">
              <span className="blink inline-block size-1.5 rounded-full bg-hidup" aria-hidden />
              <span className="font-semibold tabular text-hidup">
                {formatCount(visitor.online)}
              </span>
              <span className="text-tinta-redup">{copy.beranda.statOnline}</span>
            </span>
            <span className="h-3.5 w-px bg-garis" aria-hidden />
            <span className="inline-flex items-center gap-1.5">
              <span className="font-semibold tabular text-tinta">
                {formatCount(visitor.total)}
              </span>
              <span className="text-tinta-redup">{copy.beranda.statPengunjung}</span>
            </span>
            <span className="text-merah-teks group-hover:underline">
              {copy.beranda.lihatStatistik}
            </span>
          </a>
        </div>
        <HeroManjat kategori={kats} />
      </section>

      {/* PAPAN — three in-place tabs (no page navigation) */}
      <HomeTabs
        defaultTab={hariIni.length > 0 ? "hari-ini" : "sekarang"}
        sekarang={
          <>
            {entries.length === 0 ? (
              <EmptyState
                title={copy.beranda.papanKosongJudul}
                message={copy.beranda.papanKosongPesan}
                action={{ label: copy.beranda.papanKosongCta, href: "/manjat" }}
              />
            ) : page === 1 ? (
              <>
                <BoardLive
                  initial={{ entries, max }}
                  terfavoritId={juaraTerfavorit?.id ?? null}
                  middle={
                    <VoteFavorit entries={voteEntries} leaderboard={favorit} myChoice={choice} />
                  }
                />
                {/* Weekly Kaki Tiang champion as the board's bottom row (Rp0, free
                    — easily overtaken, no grip, never a paid rank / R16). */}
                {championEntry && (
                  <div className="mt-2.5">
                    <ListingCard entry={championEntry} kakiTiangJuara />
                  </div>
                )}
                {/* Terfavorit showcase (free spectator-vote winner). */}
                {juaraTerfavorit && <JuaraTerfavorit entry={juaraTerfavorit} />}
              </>
            ) : (
              <div className="flex flex-col gap-baris">
                {pageEntries.map((e) => (
                  <ListingCard key={e.id} entry={e} />
                ))}
              </div>
            )}
            <Pagination page={page} totalPages={totalPages} />
          </>
        }
        hariIni={<HariIniBoard entries={hariIni} />}
      />

      {/* KAKI TIANG (gratis) — below both boards (All time + Hari Ini). */}
      <div className="mt-seksi">
        <KakiTiang entries={kakiTiangEntries} remaining={sisaSorak} baruId={sp.baru ?? null} />
        <div className="mt-3 text-xs text-tinta-redup">
          {copy.beranda.punyaProduk}{" "}
          <PasangGratisModal kategori={kats} className="text-merah-teks hover:underline" />.
        </div>
      </div>

      {/* CARA MAIN */}
      <section className="mt-seksi">
        <h2 className="masthead mb-6">
          <span>{copy.beranda.caraMainJudul}</span>
        </h2>
        <CaraMain />
      </section>
    </>
  );
}
