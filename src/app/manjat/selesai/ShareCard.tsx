"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { copy } from "@/copy";

const RATIOS = [
  { key: "9x16", label: "9:16" },
  { key: "1x1", label: "1:1" },
  { key: "4x3", label: "4:3" },
  { key: "16x9", label: "16:9" },
] as const;

/**
 * Personalised share card with an aspect-ratio picker + live preview. The image
 * is rendered server-side by /api/og/[listing] at the chosen ratio. Rank/total
 * are pinned from the moment (passed through) so the preview, the image, and the
 * reveal all show the same number. Logo/Screenshot toggles override the config
 * default per card. When the listing has no screenshot yet, we fire a one-shot
 * capture (/api/momen/shot) on mount and swap the preview once it's ready.
 */
export function ShareCard({
  listingId,
  nama,
  rank,
  total,
  order,
  hasScreenshot,
  onImageChange,
}: {
  listingId: string;
  nama: string;
  rank: number;
  total: number;
  order?: string;
  hasScreenshot: boolean;
  /** Reports the currently-previewed OG image URL so the share action can save it. */
  onImageChange?: (src: string) => void;
}) {
  const [ratio, setRatio] = useState<string>("9x16");
  // Default to the logo: it resolves instantly, so the first paint is smooth. The
  // screenshot can take a beat to capture/load, so it's opt-in via the switcher.
  const [mode, setMode] = useState<"shot" | "logo">("logo");
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

  const src =
    `/api/og/${listingId}?ratio=${ratio}&rank=${rank}&total=${total}` +
    `&shot=${mode === "shot" ? 1 : 0}&logo=1${mode === "shot" && bust ? `&v=${bust}` : ""}`;

  // Cross-fade the preview on switch: the incoming render is layered in and fades
  // up once it loads (the outgoing one stays put underneath), so there's no flash.
  const [layers, setLayers] = useState<string[]>([src]);
  useEffect(() => {
    setLayers((prev) => (prev[prev.length - 1] === src ? prev : [...prev, src].slice(-2)));
  }, [src]);

  // Surface the chosen image URL so the "Bagikan" action can download exactly this.
  useEffect(() => {
    onImageChange?.(src);
  }, [src, onImageChange]);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      {/* preview — layered so switching designs cross-fades instead of popping */}
      <div className="relative flex min-h-[220px] w-full items-center justify-center">
        {layers.map((s, i) => {
          const top = i === layers.length - 1;
          const settling = top && layers.length > 1;
          return (
            // biome-ignore lint/performance/noImgElement: dynamic OG render, not a static asset
            <img
              key={s}
              src={s}
              alt={copy.momen.kartuAlt(nama)}
              onLoad={() => {
                if (settling) setLayers([s]);
              }}
              className={`max-h-[360px] max-w-full rounded-xl border border-garis shadow-kartu transition-all duration-300 ease-panjat ${
                top ? "" : "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 object-contain"
              } ${settling ? "scale-[0.97] opacity-0" : "scale-100 opacity-100"}`}
            />
          );
        })}
        {/* Loading pill while an incoming render (esp. the screenshot) is still
            fetching — the previous image stays put underneath until it arrives. */}
        {(layers.length > 1 || (mode === "shot" && preparing)) && (
          <span className="pointer-events-none absolute top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-tinta/80 px-3 py-1 font-sans text-xs text-kertas-1">
            <Loader2 className="size-3 animate-spin" aria-hidden />
            {copy.momen.siapkanPratinjau}
          </span>
        )}
      </div>

      {/* Controls — two labeled segmented controls (sliding neutral pill), one
          compact wrapping row. Consistent language + a11y group labels. */}
      <div className="flex flex-wrap items-end justify-center gap-x-4 gap-y-3">
        {/* Rasio — 4-way */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="tabular text-[11px] font-medium uppercase tracking-wide text-tinta-redup">
            {copy.momen.rasio}
          </span>
          <div
            role="group"
            aria-label={copy.momen.rasio}
            className="relative inline-flex rounded-xl border border-garis bg-kertas-2 p-1"
          >
            <span
              aria-hidden
              className="absolute top-1 bottom-1 left-1 w-12 rounded-lg bg-tinta shadow-kartu transition-transform duration-300 ease-panjat"
              style={{ transform: `translateX(${Math.max(0, RATIOS.findIndex((r) => r.key === ratio)) * 100}%)` }}
            />
            {RATIOS.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRatio(r.key)}
                aria-pressed={r.key === ratio}
                className={`relative z-10 w-12 rounded-lg py-2.5 text-center text-[13px] font-medium tabular-nums transition-colors duration-200 ${
                  r.key === ratio ? "text-kertas-1" : "text-tinta-redup hover:text-tinta"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gambar — 2-way */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="tabular text-[11px] font-medium uppercase tracking-wide text-tinta-redup">
            {copy.momen.gambar}
          </span>
          <div
            role="group"
            aria-label={copy.momen.gambar}
            className="relative inline-flex rounded-xl border border-garis bg-kertas-2 p-1"
          >
            <span
              aria-hidden
              className="absolute top-1 bottom-1 left-1 w-24 rounded-lg bg-tinta shadow-kartu transition-transform duration-300 ease-panjat"
              style={{ transform: mode === "logo" ? "translateX(100%)" : "translateX(0)" }}
            />
            {(["shot", "logo"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={m === mode}
                className={`relative z-10 w-24 rounded-lg py-2.5 text-center text-[13px] font-medium transition-colors duration-200 ${
                  m === mode ? "text-kertas-1" : "text-tinta-redup hover:text-tinta"
                }`}
              >
                {m === "shot" ? copy.momen.toggleScreenshot : copy.momen.toggleLogo}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
