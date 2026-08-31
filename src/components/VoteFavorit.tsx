"use client";

import { Check, Search, Trophy, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { copy } from "@/copy";
import type { FavoritEntry } from "@/lib/favorit";
import { Button, buttonClasses } from "./Button";
import { fieldClasses } from "./Input";
import { Modal } from "./Modal";
import { SiteLogo } from "./SiteLogo";

type PickEntry = { id: string; nama: string; urlNormal: string };

/**
 * "Pemanjat terfavorit" — a free spectator vote alongside the paid board (never
 * money/ranking). One vote per WIB day, accumulated weekly. Before voting: the
 * week's favourites shown as quick-pick tiles (tap to select, then confirm) plus
 * a "Pilih lainnya" sheet to search any climber. After voting: the week's top-5.
 */
export function VoteFavorit({
  entries,
  leaderboard,
  myChoice,
}: {
  entries: PickEntry[];
  leaderboard: FavoritEntry[];
  myChoice: string | null;
}) {
  const router = useRouter();
  const [pick, setPick] = useState("");
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const voted = myChoice !== null;

  const picked = useMemo(() => entries.find((e) => e.id === pick), [entries, pick]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = needle ? entries.filter((e) => e.nama.toLowerCase().includes(needle)) : entries;
    return list.slice(0, 40);
  }, [entries, q]);

  async function vote() {
    if (!pick || saving) return;
    setSaving(true);
    try {
      await fetch("/api/favorit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: pick }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const top5 = leaderboard.slice(0, 5);
  // Quick-pick tiles (belum-vote). A pick made via the search sheet may not be in
  // this list — show it as an extra highlighted tile so the choice stays visible.
  const quickPick = leaderboard.slice(0, 5);
  const pickInGrid = quickPick.some((e) => e.id === pick);

  return (
    <section className="rounded-xl border border-garis/70 bg-kertas px-3.5 py-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-tinta">{copy.favorit.judul}</h3>
        {voted ? (
          <span className="inline-flex items-center gap-1 text-xs text-hidup">
            <Check className="size-3.5" aria-hidden /> {copy.favorit.sudahVote}
          </span>
        ) : (
          <span className="text-xs text-tinta-redup">{copy.favorit.labelBelumVote}</span>
        )}
      </div>

      {/* Weekly prize — motivates the vote, kept as a quiet line. */}
      <p className="mt-1 flex items-center gap-1.5 text-xs text-tinta-redup">
        <Trophy className="size-3.5 shrink-0 text-merah-teks" aria-hidden />
        {copy.favorit.hadiah}
      </p>

      {voted ? (
        top5.length > 0 ? (
          <ol className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-5 sm:overflow-visible sm:pb-0">
            {top5.map((e, i) => (
              <li
                key={e.id}
                className={`flex w-28 shrink-0 flex-col items-center gap-1.5 rounded-xl border p-3 text-center sm:w-auto ${
                  e.id === myChoice ? "border-tinta bg-kertas-2" : "border-garis"
                }`}
              >
                <span className="font-sans tabular text-xs text-tinta-redup">#{i + 1}</span>
                <SiteLogo listingId={e.id} nama={e.nama} className="size-9 rounded-md text-sm" />
                <span className="w-full truncate font-display text-sm font-semibold text-tinta">
                  {e.nama}
                </span>
                <span className="font-sans tabular text-xs text-tinta-redup">
                  {copy.favorit.vote_n(e.votes)}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-sm text-tinta-redup">{copy.favorit.belumAda}</p>
        )
      ) : (
        <>
          <p className="mt-1 text-sm text-tinta-redup">{copy.favorit.ajakan}</p>

          {/* Quick-pick: tap a tile to select (highlight), then confirm with Vote.
              A single tap never casts — the daily vote can't be changed. */}
          <ol className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-5 sm:overflow-visible sm:pb-0">
            {quickPick.map((e) => (
              <li key={e.id} className="w-28 shrink-0 sm:w-auto">
                <QuickTile
                  entry={e}
                  selected={pick === e.id}
                  onSelect={() => setPick(e.id)}
                />
              </li>
            ))}
          </ol>

          {/* A pick from the search sheet that isn't among the quick picks — its
              own tidy row instead of an orphan tile that wraps the grid. */}
          {picked && !pickInGrid && (
            <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-tinta bg-kertas-2 px-3 py-2">
              <SiteLogo listingId={picked.id} nama={picked.nama} className="size-8 shrink-0 rounded-md text-xs" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[11px] uppercase tracking-wide text-tinta-redup">
                  {copy.favorit.terpilih}
                </span>
                <span className="truncate font-display text-sm font-semibold text-tinta">
                  {picked.nama}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setPick("")}
                aria-label={copy.favorit.batalPilih}
                className="shrink-0 rounded-md p-1 text-tinta-redup transition hover:text-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-merah"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          )}

          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className={`${buttonClasses("secondary")} gap-2 sm:flex-1`}
            >
              <Search className="size-4" aria-hidden />
              {copy.favorit.pilihLainnya}
            </button>
            <Button onClick={vote} disabled={!pick || saving} className="sm:flex-1">
              {saving ? "…" : copy.favorit.vote}
            </Button>
          </div>

          {/* "Pilih lainnya" — searchable sheet over every live climber. */}
          <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={copy.favorit.pilihJudul}>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tinta-redup"
                aria-hidden
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={copy.favorit.cari}
                autoFocus
                role="combobox"
                aria-expanded
                aria-controls="favorit-list"
                className={`${fieldClasses} h-10 pl-9`}
              />
            </div>
            <ul
              id="favorit-list"
              className="mt-2 max-h-[50vh] divide-y divide-garis/50 overflow-y-auto rounded-xl border border-garis bg-kertas-1"
            >
              {results.length === 0 ? (
                <li className="px-3 py-3 text-sm text-tinta-redup">{copy.favorit.takAda}</li>
              ) : (
                results.map((e) => {
                  const on = pick === e.id;
                  return (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setPick(e.id);
                          setModalOpen(false);
                        }}
                        aria-pressed={on}
                        className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition ${
                          on ? "bg-merah/8" : "hover:bg-kertas-2"
                        }`}
                      >
                        <SiteLogo listingId={e.id} nama={e.nama} className="size-7 rounded-md text-xs" />
                        <span className="min-w-0 flex-1 truncate text-tinta">{e.nama}</span>
                        {on && <Check className="size-4 shrink-0 text-merah-teks" aria-hidden />}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </Modal>
        </>
      )}
    </section>
  );
}

/** One selectable favourite in the quick-pick row. */
function QuickTile({
  entry,
  selected,
  onSelect,
}: {
  entry: FavoritEntry;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`relative flex w-full flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition ease-panjat ${
        selected ? "border-tinta bg-kertas-2" : "border-garis hover:bg-kertas-2"
      }`}
    >
      {selected && (
        <span className="absolute right-1.5 top-1.5 inline-flex size-5 items-center justify-center rounded-full bg-tinta text-kertas-1 shadow-kartu">
          <Check className="size-3" aria-hidden />
        </span>
      )}
      <SiteLogo listingId={entry.id} nama={entry.nama} className="size-9 rounded-md text-sm" />
      <span className="w-full truncate font-display text-sm font-semibold text-tinta">
        {entry.nama}
      </span>
      {entry.votes > 0 && (
        <span className="font-sans tabular text-xs text-tinta-redup">
          {copy.favorit.vote_n(entry.votes)}
        </span>
      )}
    </button>
  );
}
