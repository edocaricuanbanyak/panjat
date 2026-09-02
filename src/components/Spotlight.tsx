"use client";

import { useEffect, useRef, useState } from "react";
import { copy } from "@/copy";
import type { Aktivitas } from "@/lib/aktivitas";

/**
 * Live activity ticker (§6.4) — a sticky running strip of the latest things that
 * happened on the board (vote, dukung, naik/salip). The track is duplicated so
 * the marquee loops seamlessly; it pauses on hover and stops under reduced-motion.
 *
 * Updates live but quietly: new activity is fetched in near-realtime (poll + a
 * `panjat:aktivitas` event when the visitor cheers) but only *applied* at the
 * next marquee loop boundary — the track is back at its start there, so the swap
 * is invisible (no jump, no fade, no flicker). Cosmetic/best-effort.
 */
const POLL_MS = 12_000;

function label(a: Aktivitas): string {
  switch (a.jenis) {
    case "vote":
      return copy.papan.aktivitasVote;
    case "dukung":
      return copy.papan.aktivitasDukung;
    case "naik":
      return a.rank ? copy.papan.aktivitasNaik(a.rank) : copy.papan.aktivitasManjat;
  }
}

const sig = (items: Aktivitas[]) => items.map((a) => `${a.id}:${a.jenis}:${a.rank ?? ""}`).join("|");

type AktivitasGabung = Aktivitas & { count: number };

/**
 * Collapse repeated cheers/votes for the same listing into one entry with a
 * count ("… baru didukung 2x"), keeping newest-first order. Rank changes (naik)
 * stay separate — each is a distinct position event.
 */
function gabung(items: Aktivitas[]): AktivitasGabung[] {
  const out: AktivitasGabung[] = [];
  const at = new Map<string, number>();
  for (const a of items) {
    const key = a.jenis === "vote" || a.jenis === "dukung" ? `${a.id}:${a.jenis}` : null;
    if (key !== null && at.has(key)) {
      out[at.get(key)!].count += 1;
    } else {
      if (key !== null) at.set(key, out.length);
      out.push({ ...a, count: 1 });
    }
  }
  return out;
}
const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function Spotlight({ initialItems = [] }: { initialItems?: Aktivitas[] }) {
  const [items, setItems] = useState<Aktivitas[]>(initialItems);
  const sigRef = useRef(sig(initialItems));
  const pendingRef = useRef<Aktivitas[] | null>(null);
  const hasItemsRef = useRef(initialItems.length > 0);

  useEffect(() => {
    hasItemsRef.current = items.length > 0;
  }, [items]);

  useEffect(() => {
    let alive = true;

    async function refresh() {
      if (document.visibilityState === "hidden") return;
      try {
        const res = await fetch("/api/aktivitas", { headers: { Accept: "application/json" } });
        if (!res.ok) return;
        const next = (await res.json()) as Aktivitas[];
        // Ignore transient empty reads (best-effort feed) and no-op updates.
        if (!alive || next.length === 0 || sig(next) === sigRef.current) return;
        sigRef.current = sig(next);
        // Show right away only when nothing is scrolling yet (or motion is off);
        // otherwise buffer and let onAnimationIteration swap it in at the loop seam.
        if (!hasItemsRef.current || prefersReducedMotion()) {
          setItems(next);
        } else {
          pendingRef.current = next;
        }
      } catch {
        /* feed is best-effort */
      }
    }

    void refresh(); // populate right away (SSR feed read can start empty)
    const id = window.setInterval(refresh, POLL_MS);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("panjat:aktivitas", refresh);
    return () => {
      alive = false;
      window.clearInterval(id);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("panjat:aktivitas", refresh);
    };
  }, []);

  // Apply buffered activity exactly when the marquee wraps (back at start) → the
  // content swaps with no visible jump.
  function onLoop() {
    if (pendingRef.current) {
      const next = pendingRef.current;
      pendingRef.current = null;
      setItems(next);
    }
  }

  if (items.length === 0) return null;

  // Collapse repeats (… 2x), then build one "unit" wide enough to fill the strip
  // and render it exactly twice. The keyframe scrolls to translateX(-50%), which
  // lands precisely on the unit boundary → the loop restarts with no visible jump.
  const entries = gabung(items);
  const reps = Math.max(1, Math.ceil(8 / entries.length));
  const unit = Array.from({ length: reps }, () => entries).flat();
  const loop = [...unit, ...unit];

  return (
    <div className="flex items-center gap-3 overflow-hidden py-1.5">
      <span className="shrink-0 tabular text-[11px] font-semibold uppercase tracking-wide text-merah-teks">
        {copy.papan.aktivitas}
      </span>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div
          className="ticker-track flex w-max gap-8 whitespace-nowrap"
          onAnimationIteration={onLoop}
        >
          {loop.map((a, i) => (
            <a
              key={`${a.id}-${i}`}
              href={`/l/${a.id}`}
              className="flex items-center gap-1.5 text-sm hover:text-merah-teks"
              aria-hidden={i >= unit.length ? true : undefined}
            >
              <span className="font-display font-semibold text-tinta">{a.nama}</span>
              <span className="text-tinta-redup">
                {label(a)}
                {a.count > 1 ? copy.papan.aktivitasKali(a.count) : ""}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
