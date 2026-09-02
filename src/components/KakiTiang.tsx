"use client";

import { Heart, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { copy } from "@/copy";
import type { KakiTiangEntry } from "@/domain/sorak";
import { StatusText, useTransientStatus } from "@/lib/use-status";
import { KategoriIcon } from "./KategoriIcon";
import { KlikChip } from "./KlikChip";
import { SiteLogo } from "./SiteLogo";

/** Sort by live support desc; ties keep the server order (origIndex) as the stable
 *  tiebreak (server orders desc(sorak), desc(createdAt)). */
function sortBySupport(
  entries: KakiTiangEntry[],
  counts: Record<string, number>,
  origIndex: Record<string, number>,
): KakiTiangEntry[] {
  return [...entries].sort(
    (a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0) || origIndex[a.id] - origIndex[b.id],
  );
}

/**
 * Kaki Tiang — the free (Rp0) tier below all paid listings, ordered by Sorak
 * (R16). Visitors give 3 free Sorak/day; the most-cheered rise. A gentle door
 * to a first payment. Dukung is optimistic + animated (a little heart burst);
 * the POST still enforces one-per-anon-per-day server-side, and the shared
 * `remaining` counter updates live.
 */
export function KakiTiang({
  entries,
  remaining: initialRemaining,
  baruId = null,
}: {
  entries: KakiTiangEntry[];
  remaining: number;
  /** A just-posted free listing to confirm + highlight (from `/?baru=…`). */
  baruId?: string | null;
}) {
  const [remaining, setRemaining] = useState(initialRemaining);
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(entries.map((e) => [e.id, e.sorak])),
  );
  // How many of my 5 I've poured into each listing (for styling + revert).
  const [mine, setMine] = useState<Record<string, number>>({});
  // The row that just climbed on a dukung — gets a soft "lift" glow for a beat.
  const [lifted, setLifted] = useState<string | null>(null);
  const { status, show } = useTransientStatus();

  // Stable tiebreak (server order) + the live-support ordering used for display.
  const origIndex = useMemo(
    () => Object.fromEntries(entries.map((e, i) => [e.id, i])) as Record<string, number>,
    [entries],
  );
  const ordered = useMemo(
    () => sortBySupport(entries, counts, origIndex),
    [entries, counts, origIndex],
  );

  // Just-posted confirmation: scroll to the new row + flash it (the free flow
  // keeps you here instead of an unreachable listing page). Banner gives closure
  // even when the listing was held by screening (not in `entries`).
  const [showBaru, setShowBaru] = useState(Boolean(baruId));
  const [flash, setFlash] = useState<string | null>(null);
  const rowRefs = useRef<Record<string, HTMLElement | null>>({});
  useEffect(() => {
    if (!baruId) return;
    const el = rowRefs.current[baruId];
    if (!el) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setFlash(baruId);
    const t = setTimeout(() => setFlash(null), 2000);
    return () => clearTimeout(t);
  }, [baruId]);

  const reduceMotion = () =>
    typeof window !== "undefined" &&
    !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  // Slide rows to their new order via the View Transitions API (like the board);
  // falls back to an instant commit when unsupported or reduced-motion.
  const viewTransition = (commit: () => void): Promise<unknown> => {
    const start = (
      document as unknown as {
        startViewTransition?: (cb: () => void) => { finished?: Promise<unknown> };
      }
    ).startViewTransition;
    if (!reduceMotion() && typeof start === "function") {
      return start.call(document, commit).finished ?? Promise.resolve();
    }
    commit();
    return Promise.resolve();
  };

  async function dukung(id: string) {
    if (remaining <= 0) return;

    // Will this dukung make the row overtake the one above it? (for the lift cue)
    const nextCounts = { ...counts, [id]: (counts[id] ?? 0) + 1 };
    const oldIdx = ordered.findIndex((e) => e.id === id);
    const newIdx = sortBySupport(entries, nextCounts, origIndex).findIndex((e) => e.id === id);
    const climbed = newIdx < oldIdx;

    // Optimistic: bump this listing + spend one from the daily allowance. You may
    // stack all 5 on a single listing. The reorder animates; the climber lifts.
    viewTransition(() => {
      setCounts((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
      setRemaining((r) => r - 1);
      setMine((m) => ({ ...m, [id]: (m[id] ?? 0) + 1 }));
    }).then(() => {
      if (climbed && !reduceMotion()) {
        setLifted(id);
        window.setTimeout(() => setLifted((l) => (l === id ? null : l)), 700);
      }
    });

    try {
      const body = new FormData();
      body.set("listingId", id);
      const res = await fetch("/api/sorak", {
        method: "POST",
        headers: { Accept: "application/json" },
        body,
      });
      if (!res.ok) throw new Error("gagal");
      // Nudge the activity ticker to refetch now (server already pushed the event).
      window.dispatchEvent(new CustomEvent("panjat:aktivitas"));
    } catch {
      // Revert on failure (daily cap hit, rate-limited, offline…) — slide back too.
      viewTransition(() => {
        setCounts((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 1) - 1) }));
        setRemaining((r) => r + 1);
        setMine((m) => ({ ...m, [id]: Math.max(0, (m[id] ?? 1) - 1) }));
      });
      // The revert alone is silent — say what happened.
      show("galat", copy.kakiTiang.dukungGagal);
    }
  }

  return (
    <section id="kaki-tiang" className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-tinta">{copy.kakiTiang.judul}</h2>
        <span className="font-mono text-xs text-tinta-redup">
          {copy.kakiTiang.sisaDukungan(remaining)}
        </span>
      </div>
      <p className="mt-1 text-xs text-tinta-redup">{copy.kakiTiang.ajakan}</p>
      {status && (
        <p className="mt-1.5">
          <StatusText status={status} />
        </p>
      )}

      {showBaru && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-merah/40 bg-merah/5 px-3 py-2 text-sm text-tinta">
          <span className="flex-1">{copy.kakiTiang.baruNaik}</span>
          <button
            type="button"
            onClick={() => setShowBaru(false)}
            aria-label={copy.kakiTiang.baruTutup}
            className="shrink-0 rounded-full p-1 text-tinta-redup hover:bg-kertas-2 hover:text-tinta"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}

      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-tinta-redup">{copy.kakiTiang.kosong}</p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {ordered.map((e) => (
            <article
              key={e.id}
              ref={(el) => {
                rowRefs.current[e.id] = el;
              }}
              style={{ viewTransitionName: `vt-kt-${e.id}` } as React.CSSProperties}
              className={`flex items-center gap-3 rounded-lg border p-3 ${
                lifted === e.id ? "kt-lift " : ""
              }${
                flash === e.id ? "manjat-slot border-merah bg-merah/5" : "border-garis bg-kertas-2"
              }`}
            >
              <SiteLogo listingId={e.id} nama={e.nama} />
              <div className="min-w-0 flex-1">
                <a
                  href={`/k/${e.id}?asal=papan`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate font-display font-semibold text-tinta hover:text-merah-teks"
                >
                  {e.nama}
                </a>
                {e.deskripsi && <p className="truncate text-xs text-tinta-redup">{e.deskripsi}</p>}
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-tinta-redup">
                  <span className="truncate font-mono text-tinta-redup">
                    {e.urlNormal.replace(/^https?:\/\//, "").replace(/\/+$/, "")}
                  </span>
                  {e.kategoriNama && (
                    <span className="hidden shrink-0 items-center gap-1 lg:flex">
                      <span aria-hidden>·</span>
                      <KategoriIcon slug={e.kategoriSlug} className="size-3.5 text-tinta-redup" />
                      {e.kategoriNama}
                    </span>
                  )}
                  {e.klik > 0 && (
                    <>
                      <span aria-hidden>·</span>
                      <KlikChip n={e.klik} />
                    </>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                <span className="font-sans tabular text-xs text-tinta-redup">
                  {copy.kakiTiang.dukungan_n(counts[e.id] ?? 0)}
                </span>
                <DukungButton
                  onDukung={() => dukung(e.id)}
                  disabled={remaining <= 0}
                  supported={(mine[e.id] ?? 0) > 0}
                  mineCount={mine[e.id] ?? 0}
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

// Six little hearts fanning up-and-out, plus a rising "+1".
const PARTICLES = [
  { tx: "-22px", ty: "-30px", rot: "-24deg", delay: "0ms" },
  { tx: "0px", ty: "-38px", rot: "0deg", delay: "20ms" },
  { tx: "22px", ty: "-30px", rot: "24deg", delay: "40ms" },
  { tx: "-14px", ty: "-24px", rot: "-14deg", delay: "60ms" },
  { tx: "14px", ty: "-24px", rot: "14deg", delay: "30ms" },
  { tx: "0px", ty: "-20px", rot: "0deg", delay: "80ms" },
];

function DukungButton({
  onDukung,
  disabled,
  supported,
  mineCount,
}: {
  onDukung: () => void;
  disabled: boolean;
  supported: boolean;
  /** How many of my daily Sorak I've stacked here (0 = none yet). */
  mineCount: number;
}) {
  const [burst, setBurst] = useState(0);

  function click() {
    if (disabled) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) setBurst((b) => b + 1);
    onDukung();
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={click}
        disabled={disabled}
        aria-pressed={supported}
        className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm shadow-kartu transition ease-panjat focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-merah disabled:opacity-50 ${
          supported
            ? "border-merah bg-merah text-kertas-1"
            : "border-garis bg-kertas-1 text-tinta hover:bg-kertas-2"
        } ${disabled ? "" : "active:scale-95"}`}
      >
        <Heart
          className={`size-3.5 transition-transform ${supported ? "fill-kertas-1" : ""} ${
            burst > 0 ? "dukung-pop" : ""
          }`}
          aria-hidden
        />
        {copy.kakiTiang.dukung}
        {mineCount > 0 && <span className="font-sans tabular text-xs">×{mineCount}</span>}
      </button>

      {burst > 0 && (
        <span
          key={burst}
          className="pointer-events-none absolute left-1/2 top-1 -translate-x-1/2"
          aria-hidden
        >
          <span className="dukung-plus absolute left-1/2 -translate-x-1/2 font-mono text-xs font-semibold text-merah-teks">
            +1
          </span>
          {PARTICLES.map((p, i) => (
            <Heart
              key={i}
              className="dukung-particle absolute left-1/2 top-0 size-3 -translate-x-1/2 fill-merah text-merah"
              style={
                {
                  "--tx": p.tx,
                  "--ty": p.ty,
                  "--rot": p.rot,
                  animationDelay: p.delay,
                } as React.CSSProperties
              }
            />
          ))}
        </span>
      )}
    </div>
  );
}
