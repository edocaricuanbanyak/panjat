"use client";

import { useEffect, useRef, useState } from "react";
import type { Board } from "@/domain/board";
import { ListingCard } from "./ListingCard";

/**
 * Live board island (R1). Subscribes to the SSE stream and swaps in new
 * standings. Reorder is animated by the View Transitions API (transform/opacity
 * only, §9.6.4), disabled under prefers-reduced-motion. The board container is
 * aria-live="off"; a separate polite region summarizes changes (R20-e).
 */
export function BoardLive({
  initial,
  middle,
}: {
  initial: Board;
  /** Slot rendered between the top-3 podium and rank 4+ (e.g. Tebak Juara). */
  middle?: React.ReactNode;
}) {
  const [board, setBoard] = useState<Board>(initial);
  const [announce, setAnnounce] = useState("");
  const topRef = useRef<string | undefined>(initial.entries[0]?.id);

  useEffect(() => {
    const es = new EventSource("/api/board/stream");
    es.onmessage = (ev) => {
      const next = JSON.parse(ev.data) as Board;
      const prevTop = topRef.current;
      const nextTop = next.entries[0]?.id;
      topRef.current = nextTop;

      const msg =
        nextTop && prevTop && nextTop !== prevTop && next.entries[0]
          ? `Puncak berganti — ${next.entries[0].nama} kini #1`
          : "Papan diperbarui";

      const commit = () => {
        setBoard(next);
        setAnnounce(msg);
      };

      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      const start = (document as unknown as { startViewTransition?: (cb: () => void) => void })
        .startViewTransition;
      if (!reduce && typeof start === "function") start.call(document, commit);
      else commit();
    };
    return () => es.close();
  }, []);

  // Page one shows at most 20; deeper ranks live on paginated (static) pages.
  const shown = board.entries.slice(0, 20);
  const puncak = shown.slice(0, 3);
  const sisa = shown.slice(3);

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Board updates must not be read row-by-row (R20-e). */}
      <div aria-live="off">
        {/* Summit zone — the top three each get their own rank-tinted card;
            auto-rows-fr keeps all three the same height regardless of content. */}
        <section className="grid auto-rows-fr gap-3">
          {puncak.map((e) => (
            <div
              key={e.id}
              style={{ viewTransitionName: `vt-${e.id}` } as React.CSSProperties}
              className={`h-full rounded-2xl border shadow-kartu ${
                e.rank === 1 ? "podium-1" : e.rank === 2 ? "podium-2" : "podium-3"
              }`}
            >
              <ListingCard entry={e} max={board.max} density="puncak" />
            </div>
          ))}
        </section>
        {middle && <div className="my-5">{middle}</div>}
        {sisa.length > 0 && (
          <section className="mt-5 flex flex-col gap-2.5">
            {sisa.map((e) => (
              <div key={e.id} style={{ viewTransitionName: `vt-${e.id}` } as React.CSSProperties}>
                <ListingCard entry={e} max={board.max} />
              </div>
            ))}
          </section>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </div>
  );
}
