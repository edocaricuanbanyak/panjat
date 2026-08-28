"use client";

import { useState } from "react";
import { copy } from "@/copy";

const RATIOS = [
  { key: "9x16", label: "9:16" },
  { key: "1x1", label: "1:1" },
  { key: "4x3", label: "4:3" },
] as const;

/**
 * Personalised share card with an aspect-ratio picker + live preview. The image
 * is rendered server-side by /api/og/[listing] at the chosen ratio.
 */
export function ShareCard({ listingId, nama }: { listingId: string; nama: string }) {
  const [ratio, setRatio] = useState<string>("9x16");
  const src = `/api/og/${listingId}?ratio=${ratio}`;

  return (
    <div className="flex w-full flex-col items-center gap-3">
      {/* preview — the image's own aspect ratio sizes it; capped by height */}
      <div className="flex min-h-[220px] w-full items-center justify-center">
        {/* biome-ignore lint/performance/noImgElement: dynamic OG render, not a static asset */}
        <img
          key={ratio}
          src={src}
          alt={copy.momen.kartuAlt(nama)}
          className="max-h-[360px] max-w-full rounded-xl border border-garis shadow-kartu"
        />
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
