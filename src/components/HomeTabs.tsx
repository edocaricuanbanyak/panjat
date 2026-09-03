"use client";

import { useRef, useState } from "react";
import { copy } from "@/copy";
import { BoardSkeleton } from "./Skeleton";

type TabKey = "sekarang" | "hari-ini";

// Hari Ini leads (default view): a fresh 24h board resets daily — the lower-
// barrier, more dynamic entry point. All time sits second.
const ITEMS: { key: TabKey; label: string }[] = [
  { key: "hari-ini", label: copy.nav.hariIni },
  { key: "sekarang", label: copy.beranda.tabSepanjang },
];

/**
 * The two board views as a soft segmented control (no page navigation). The
 * active option is a raised paper pill that *slides* between positions on the
 * brand easing — spatial continuity over a snap. Neutral paper thumb keeps
 * `merah` reserved for the summit + primary actions. Full tablist a11y: roving
 * focus, arrow-key nav, visible ring; the slide is disabled under
 * prefers-reduced-motion. Jelajah lives in the navbar ("Cari"), off here.
 */
export function HomeTabs({
  sekarang,
  hariIni,
  defaultTab = "hari-ini",
}: {
  sekarang: React.ReactNode;
  hariIni: React.ReactNode;
  /** Which view opens first. page.tsx falls back to "sekarang" when today's
   *  board is empty so we never land on an empty Hari Ini. */
  defaultTab?: TabKey;
}) {
  const [tab, setTab] = useState<TabKey>(defaultTab);
  const [loading, setLoading] = useState(false);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeIndex = ITEMS.findIndex((t) => t.key === tab);

  // Switch view: jump back to the top and flash a board skeleton so the change
  // reads as a fresh load (the boards are separate islands that re-mount).
  const switchTo = (key: TabKey) => {
    if (key === tab) return;
    setTab(key);
    setLoading(true);
    window.scrollTo({ top: 0, behavior: "auto" });
    window.setTimeout(() => setLoading(false), 350);
  };

  const onKey = (e: React.KeyboardEvent) => {
    const last = ITEMS.length - 1;
    let next = activeIndex;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = activeIndex >= last ? 0 : activeIndex + 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = activeIndex <= 0 ? last : activeIndex - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    else return;
    e.preventDefault();
    switchTo(ITEMS[next].key);
    btnRefs.current[next]?.focus();
  };

  return (
    <section>
      <div
        role="tablist"
        aria-label={copy.nav.papanRingkas}
        className="relative mb-5 inline-grid grid-cols-2 rounded-full p-1 sm:bg-kertas-2 max-sm:fixed max-sm:bottom-[calc(1rem+env(safe-area-inset-bottom))] max-sm:left-1/2 max-sm:z-40 max-sm:-translate-x-1/2 max-sm:bg-kertas-1 max-sm:shadow-naik max-sm:ring-1 max-sm:ring-garis/60"
      >
        {/* Sliding thumb — transform only (compositor-friendly), brand easing. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-kertas-1 shadow-kartu ring-1 ring-garis/70 transition-transform duration-300 ease-panjat motion-reduce:transition-none"
          style={{ transform: activeIndex === 1 ? "translateX(100%)" : "translateX(0)" }}
        />
        {ITEMS.map((it, i) => {
          const on = it.key === tab;
          return (
            <button
              key={it.key}
              ref={(el) => {
                btnRefs.current[i] = el;
              }}
              role="tab"
              aria-selected={on}
              tabIndex={on ? 0 : -1}
              onClick={() => switchTo(it.key)}
              onKeyDown={onKey}
              className={`relative z-10 inline-flex touch-manipulation select-none items-center justify-center whitespace-nowrap rounded-full px-5 py-2 font-display text-sm font-semibold transition-colors ease-panjat [-webkit-tap-highlight-color:transparent] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-merah max-sm:min-h-11 ${
                on ? "text-tinta" : "text-tinta-redup hover:text-tinta"
              }`}
            >
              {it.label}
            </button>
          );
        })}
      </div>
      {loading ? <BoardSkeleton /> : tab === "sekarang" ? sekarang : hariIni}
    </section>
  );
}
