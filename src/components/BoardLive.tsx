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
export function BoardLive({ initial }: { initial: Board }) {
  const [board, setBoard] = useState<Board>(initial);
  const [live, setLive] = useState(false);
  const [announce, setAnnounce] = useState("");
  const topRef = useRef<string | undefined>(initial.entries[0]?.id);

  useEffect(() => {
    const es = new EventSource("/api/board/stream");
    es.onopen = () => setLive(true);
    es.onerror = () => setLive(false);
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

  const puncak = board.entries.slice(0, 3);
  const sisa = board.entries.slice(3);

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center gap-1.5 font-mono text-xs text-tinta-redup">
        <span
          className={`inline-block size-1.5 rounded-full ${live ? "bg-merah" : "bg-garis"}`}
          aria-hidden
        />
        {live ? "papan hidup" : "menyambungkan…"}
      </div>

      {/* Board updates must not be read row-by-row (R20-e). */}
      <div aria-live="off">
        <section className="flex flex-col gap-3">
          {puncak.map((e) => (
            <div key={e.id} style={{ viewTransitionName: `vt-${e.id}` } as React.CSSProperties}>
              <ListingCard entry={e} max={board.max} density="puncak" />
            </div>
          ))}
        </section>
        {sisa.length > 0 && (
          <section className="mt-4 flex flex-col gap-2">
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
