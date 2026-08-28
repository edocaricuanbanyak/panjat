"use client";

import { Check, ChevronDown, Search, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { copy } from "@/copy";
import type { FavoritEntry } from "@/lib/favorit";
import { Button } from "./Button";
import { fieldClasses } from "./Input";
import { SiteLogo } from "./SiteLogo";

type PickEntry = { id: string; nama: string; urlNormal: string };

/**
 * "Pemanjat terfavorit" — a free spectator vote alongside the paid board (never
 * money/ranking). One vote per WIB day, accumulated weekly. Before voting: a
 * click-to-open, searchable combobox (each row shows the site's logo). After
 * voting: the week's top-5.
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
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const voted = myChoice !== null;

  const picked = useMemo(() => entries.find((e) => e.id === pick), [entries, pick]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = needle ? entries.filter((e) => e.nama.toLowerCase().includes(needle)) : entries;
    return list.slice(0, 40);
  }, [entries, q]);

  // Close the dropdown on outside click.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

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

          {/* Click-to-open, searchable combobox. */}
          <div ref={boxRef} className="relative mt-3">
            {picked ? (
              <SiteLogo
                listingId={picked.id}
                nama={picked.nama}
                className="pointer-events-none absolute left-2.5 top-1/2 size-5 -translate-y-1/2 rounded text-[10px]"
              />
            ) : (
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-tinta-redup"
                aria-hidden
              />
            )}
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPick("");
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder={copy.favorit.cari}
              aria-expanded={open}
              role="combobox"
              aria-controls="favorit-list"
              className={`${fieldClasses} h-10 pl-9 pr-8`}
            />
            <ChevronDown
              className={`pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-tinta-redup transition ${
                open ? "rotate-180" : ""
              }`}
              aria-hidden
            />

            {open && (
              <ul
                id="favorit-list"
                className="absolute z-20 mt-1 max-h-56 w-full divide-y divide-garis/50 overflow-y-auto rounded-xl border border-garis bg-kertas-1 shadow-kartu"
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
                            setQ(e.nama);
                            setOpen(false);
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
            )}
          </div>

          <Button onClick={vote} disabled={!pick || saving} className="mt-2 w-full">
            {saving ? "…" : copy.favorit.vote}
          </Button>
        </>
      )}
    </section>
  );
}
