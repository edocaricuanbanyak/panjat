"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { copy } from "@/copy";

const RATIOS = [
  { key: "9x16", label: "Story" },
  { key: "1x1", label: "1:1" },
  { key: "4x3", label: "4:3" },
  { key: "16x9", label: "16:9" },
] as const;

/**
 * Personalised share card with an aspect-ratio picker + live preview + download.
 * The image is rendered server-side by /api/og/[listing] at the chosen ratio.
 */
export function ShareCard({ listingId, nama }: { listingId: string; nama: string }) {
  const [ratio, setRatio] = useState<string>("9x16");
  const [busy, setBusy] = useState(false);
  const src = `/api/og/${listingId}?ratio=${ratio}`;

  async function download() {
    setBusy(true);
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `panjat-${ratio}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } finally {
      setBusy(false);
    }
  }

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

      <button
        type="button"
        onClick={download}
        disabled={busy}
        className="inline-flex items-center gap-2 text-sm font-medium text-merah-teks hover:underline disabled:opacity-50"
      >
        <Download className="size-4" aria-hidden />
        {busy ? copy.momen.mengunduh : copy.momen.unduh}
      </button>
    </div>
  );
}
