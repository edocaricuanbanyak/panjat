"use client";

import { useEffect, useRef, useState } from "react";
import { copy } from "@/copy";
import type { Board } from "@/domain/board";
import { ListingCard } from "./ListingCard";
import { TiangRail } from "./TiangRail";

/**
 * Live board island (R1). Subscribes to the SSE stream and swaps in new
 * standings. Reorder is animated by the View Transitions API (transform/opacity
 * only, §9.6.4), disabled under prefers-reduced-motion. The board container is
 * aria-live="off"; a separate polite region summarizes changes (R20-e).
 */
export function BoardLive({
  initial,
  middle,
  terfavoritId = null,
}: {
  initial: Board;
  /** Slot rendered between the top-3 podium and rank 4+ (e.g. Tebak Juara). */
  middle?: React.ReactNode;
  /** The reigning weekly Terfavorit — gets a cosmetic chip on its card. */
  terfavoritId?: string | null;
}) {
  const [board, setBoard] = useState<Board>(initial);
  const [announce, setAnnounce] = useState("");
  const [stale, setStale] = useState(false);
  const topRef = useRef<string | undefined>(initial.entries[0]?.id);

  useEffect(() => {
    let es: EventSource;
    let retry: ReturnType<typeof setTimeout>;
    let announceTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      es = new EventSource("/api/board/stream");
      es.onopen = () => setStale(false);
      es.onmessage = (ev) => {
        setStale(false);
        const next = JSON.parse(ev.data) as Board;
        const prevTop = topRef.current;
        const nextTop = next.entries[0]?.id;
        topRef.current = nextTop;

        const msg =
          nextTop && prevTop && nextTop !== prevTop && next.entries[0]
            ? copy.papan.puncakBerganti(next.entries[0].nama)
            : copy.papan.papanDiperbarui;

        const commit = () => {
          setBoard(next);
          setAnnounce(msg);
          // Clear after a beat so an identical next message still announces —
          // a live region only fires when its text actually changes.
          clearTimeout(announceTimer);
          announceTimer = setTimeout(() => setAnnounce(""), 1000);
        };

        const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        const start = (document as unknown as { startViewTransition?: (cb: () => void) => void })
          .startViewTransition;
        if (!reduce && typeof start === "function") start.call(document, commit);
        else commit();
      };
      es.onerror = () => {
        setStale(true);
        // The browser auto-retries transient drops; only when it fully gives up
        // (CLOSED) do we rebuild the connection ourselves.
        if (es.readyState === EventSource.CLOSED) {
          clearTimeout(retry);
          retry = setTimeout(connect, 3000);
        }
      };
    };
    connect();

    return () => {
      clearTimeout(retry);
      clearTimeout(announceTimer);
      es.close();
    };
  }, []);

  // Page one shows at most 20; deeper ranks live on paginated (static) pages.
  const shown = board.entries.slice(0, 20);
  const puncak = shown.slice(0, 3);
  const sisa = shown.slice(3);

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Quiet notice when the live feed drops — the board keeps showing the last
          standings while we reconnect, so it never just freezes silently. */}
      {stale && (
        <p
          role="status"
          className="flex items-center gap-1.5 text-xs text-tinta-redup"
        >
          <span className="size-1.5 shrink-0 rounded-full bg-tinta-redup" aria-hidden />
          {copy.papan.koneksiPutus}
        </p>
      )}
      {/* Board updates must not be read row-by-row (R20-e). */}
      <div aria-live="off">
        {/* Summit zone — the pole rises in a left gutter through the top three,
            prize + flag at #1. auto-rows-fr keeps all three the same height. */}
        <section className="relative flex gap-2.5 sm:gap-3">
          <TiangRail className="w-5 shrink-0 sm:w-6" />
          <div className="grid flex-1 auto-rows-fr grid-cols-1 gap-3">
            {puncak.map((e) => (
              <div
                key={e.id}
                style={{ viewTransitionName: `vt-${e.id}` } as React.CSSProperties}
                className={`h-full rounded-2xl border shadow-baris ${
                  e.rank === 1 ? "podium-1" : e.rank === 2 ? "podium-2" : "podium-3"
                }`}
              >
                <ListingCard entry={e} max={board.max} density="puncak" terfavoritId={terfavoritId} />
              </div>
            ))}
          </div>
        </section>
        {middle && <div className="my-5">{middle}</div>}
        {sisa.length > 0 && (
          <section className="mt-5 flex flex-col gap-2.5">
            {sisa.map((e) => (
              <div key={e.id} style={{ viewTransitionName: `vt-${e.id}` } as React.CSSProperties}>
                <ListingCard entry={e} max={board.max} terfavoritId={terfavoritId} />
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
