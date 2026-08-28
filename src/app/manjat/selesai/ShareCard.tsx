"use client";

import { useEffect, useRef, useState } from "react";
import { copy } from "@/copy";

const RATIOS = [
  { key: "9x16", label: "9:16" },
  { key: "1x1", label: "1:1" },
  { key: "4x3", label: "4:3" },
] as const;

/**
 * Personalised share card with an aspect-ratio picker + live preview. The image
 * is rendered server-side by /api/og/[listing] at the chosen ratio. When the
 * listing has no screenshot yet, we fire a one-shot capture (/api/momen/shot) on
 * mount and swap the preview to the product screenshot once it's ready — until
 * then the card falls back to the site logo.
 */
export function ShareCard({
  listingId,
  nama,
  order,
  hasScreenshot,
}: {
  listingId: string;
  nama: string;
  order?: string;
  hasScreenshot: boolean;
}) {
  const [ratio, setRatio] = useState<string>("9x16");
  const [bust, setBust] = useState(0);
  const [preparing, setPreparing] = useState(!hasScreenshot && Boolean(order));
  const fired = useRef(false);

  useEffect(() => {
    if (hasScreenshot || !order || fired.current) return;
    fired.current = true;
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/momen/shot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order }),
        });
        const data = (await res.json().catch(() => ({}))) as { ready?: boolean };
        if (alive && data.ready) setBust((v) => v + 1);
      } catch {
        // keep the logo fallback
      } finally {
        if (alive) setPreparing(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [hasScreenshot, order]);

  const src = `/api/og/${listingId}?ratio=${ratio}${bust ? `&v=${bust}` : ""}`;

  return (
    <div className="flex w-full flex-col items-center gap-3">
      {/* preview — the image's own aspect ratio sizes it; capped by height */}
      <div className="relative flex min-h-[220px] w-full items-center justify-center">
        {/* biome-ignore lint/performance/noImgElement: dynamic OG render, not a static asset */}
        <img
          key={`${ratio}-${bust}`}
          src={src}
          alt={copy.momen.kartuAlt(nama)}
          className="max-h-[360px] max-w-full rounded-xl border border-garis shadow-kartu"
        />
        {preparing && (
          <span className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-tinta/80 px-3 py-1 font-sans text-xs text-kertas-1">
            {copy.momen.siapkanPratinjau}
          </span>
        )}
      </div>

      {/* ratio picker */}
      <div className="inline-flex gap-1 rounded-xl border border-garis bg-kertas-1 p-1">
        {RATIOS.map((r) => {
          const on = r.key === ratio;
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => setRatio(r.key)}
              aria-pressed={on}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition ease-panjat ${
                on ? "bg-merah text-kertas-1 shadow-kartu" : "text-tinta-redup hover:text-tinta"
              }`}
            >
              {r.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
