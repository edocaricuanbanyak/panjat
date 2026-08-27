"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FavoritEntry } from "@/lib/favorit";
import { Button } from "./Button";
import { Dropdown } from "./Dropdown";

/**
 * "Board terfavorit" — a free spectator vote that runs alongside the paid board
 * (never money/ranking). Pick a favourite; a separate leaderboard ranks listings
 * by votes. One active vote per visitor, changeable.
 */
export function VoteFavorit({
  entries,
  leaderboard,
  myChoice,
}: {
  entries: { id: string; nama: string }[];
  leaderboard: FavoritEntry[];
  myChoice: string | null;
}) {
  const router = useRouter();
  const [pick, setPick] = useState(myChoice ?? "");
  const [saving, setSaving] = useState(false);

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

  return (
    <section className="rounded-2xl border border-garis bg-kertas-1 p-4 shadow-kartu">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-tinta">Board terfavorit</h3>
        <span className="font-mono text-xs text-tinta-redup">vote gratis</span>
      </div>
      <p className="mt-1 text-sm text-tinta-redup">
        Pilih favoritmu — bukan soal uang, soal selera.
      </p>

      <div className="mt-3 flex items-end gap-2">
        <Dropdown
          className="flex-1"
          placeholder="Pilih listing…"
          value={pick}
          onChange={setPick}
          options={entries.map((e) => ({ value: e.id, label: e.nama }))}
        />
        <Button onClick={vote} disabled={!pick || saving}>
          {saving ? "…" : myChoice ? "Ganti" : "Vote"}
        </Button>
      </div>

      {leaderboard.length > 0 && (
        <ol className="mt-4 flex flex-col divide-y divide-garis/60">
          {leaderboard.map((e, i) => (
            <li key={e.id} className="flex items-center gap-3 py-1.5 text-sm">
              <span className="w-6 shrink-0 text-right font-mono tabular text-tinta-redup">
                #{i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate font-display font-semibold text-tinta">
                {e.nama}
                {e.id === myChoice && <span className="ml-1.5 text-xs text-tinta-redup">♥ pilihanmu</span>}
              </span>
              <span className="shrink-0 font-mono tabular text-xs text-tinta-redup">
                {e.votes.toLocaleString("id-ID")} vote
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
