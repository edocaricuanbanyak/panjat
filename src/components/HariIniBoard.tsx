import { copy } from "@/copy";
import type { BoardEntry } from "@/domain/board";
import type { HariIniEntry } from "@/domain/papan-hari-ini";
import { EmptyState } from "./EmptyState";
import { ListingCard } from "./ListingCard";
import { TiangRail } from "./TiangRail";

/**
 * Papan Hari Ini standings — same money-ranked shape as the main board, 24h
 * window. Renders the identical ListingCard treatment (podium tinting for the
 * top 3 + Salip button), but with `todayGrip` as the amount and no rosot line
 * (decay is an all-time-board mechanic, not a per-day one).
 */
function toBoardEntry(e: HariIniEntry): BoardEntry {
  return {
    rank: e.rank,
    id: e.id,
    nama: e.nama,
    urlNormal: e.urlNormal,
    deskripsi: e.deskripsi, // same description as the all-time card
    kategoriNama: e.kategoriNama,
    kategoriSlug: e.kategoriSlug, // real slug → same category icon as the all-time board
    pegangan: e.todayGrip, // today's paid grip drives rank + the Salip nominal
    klikTotal: e.klikTotal, // same all-time click social-proof
    rosotPerHari: 0,
    masihTerjaga: false,
    screenshotUrl: null,
    badges: [],
  };
}

export function HariIniBoard({ entries }: { entries: HariIniEntry[] }) {
  if (entries.length === 0) {
    return <EmptyState compact message={copy.hariIni.kosong} />;
  }

  const rows = entries.map(toBoardEntry);
  const puncak = rows.slice(0, 3);
  const sisa = rows.slice(3);

  return (
    // Same structure + spacing as BoardLive so both boards read identically.
    <div className="mt-6">
      {/* Summit zone — top 3 in rank-tinted cards, matching the main board:
          the pole rises in a left gutter with the prize + flag at #1. */}
      <section className="relative flex gap-2.5 sm:gap-3">
        <TiangRail className="w-5 shrink-0 sm:w-6" />
        <div className="grid flex-1 auto-rows-fr grid-cols-1 gap-3">
          {puncak.map((e) => (
            <div
              key={e.id}
              className={`h-full rounded-2xl border shadow-baris ${
                e.rank === 1 ? "podium-1" : e.rank === 2 ? "podium-2" : "podium-3"
              }`}
            >
              <ListingCard entry={e} density="puncak" showRosot={false} />
            </div>
          ))}
        </div>
      </section>
      {sisa.length > 0 && (
        <section className="mt-5 flex flex-col gap-baris">
          {sisa.map((e) => (
            <ListingCard key={e.id} entry={e} showRosot={false} />
          ))}
        </section>
      )}
    </div>
  );
}
