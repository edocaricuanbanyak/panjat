"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FavoritEntry } from "@/lib/favorit";
import { Button } from "./Button";
import { Dropdown } from "./Dropdown";
import { LogoTile } from "./LogoTile";

/**
 * "Pemanjat terfavorit" — a free spectator vote alongside the paid board (never
 * money/ranking). One vote per WIB day, accumulated weekly. Before voting: a
 * picker. After voting: the week's top-5, laid out horizontally.
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
  const [pick, setPick] = useState("");
  const [saving, setSaving] = useState(false);
  const voted = myChoice !== null;

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
    <section className="rounded-2xl border border-garis bg-kertas-1 p-4 shadow-kartu">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-tinta">Pemanjat terfavorit</h3>
        <span className="font-mono text-xs text-tinta-redup">
          {voted ? "minggu ini" : "vote gratis · 1×/hari"}
        </span>
      </div>

      {voted ? (
        <>
          <p className="mt-1 text-sm text-tinta-redup">
            Kamu sudah vote hari ini. Suara diakumulasi mingguan.
          </p>
          {top5.length > 0 ? (
            <ol className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {top5.map((e, i) => (
                <li
                  key={e.id}
                  className={`flex w-28 shrink-0 flex-col items-center gap-1.5 rounded-xl border p-3 text-center ${
                    e.id === myChoice ? "border-tinta bg-kertas-2" : "border-garis"
                  }`}
                >
                  <span className="font-mono text-xs text-tinta-redup">#{i + 1}</span>
                  <LogoTile nama={e.nama} className="size-9 rounded-md text-sm" />
                  <span className="w-full truncate font-display text-sm font-semibold text-tinta">
                    {e.nama}
                  </span>
                  <span className="font-mono tabular text-xs text-tinta-redup">
                    {e.votes.toLocaleString("id-ID")} vote
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-tinta-redup">Jadilah yang pertama menerima suara.</p>
          )}
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-tinta-redup">
            Pilih favoritmu — bukan soal uang, soal selera. Sekali sehari.
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
              {saving ? "…" : "Vote"}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
