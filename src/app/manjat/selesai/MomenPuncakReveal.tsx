"use client";

import { useState } from "react";
import { ShareButton } from "./ShareButton";
import { ShareCard } from "./ShareCard";
import { buttonClasses } from "@/components/Button";
import { Confetti } from "@/components/Confetti";
import { copy } from "@/copy";

/**
 * Momen Puncak (MI-1) — "ini produk sesungguhnya" (§9.2). A staggered entrance:
 * confetti, the rank pops, the heading rises, then the product-forward share card
 * arrives (the card carries name + stat, so nothing is repeated here). transform/
 * opacity only; reduced-motion collapses to instant.
 */
export function MomenPuncakReveal({
  rank,
  total,
  heading,
  nama,
  listingId,
  order,
  hasScreenshot,
}: {
  rank: number;
  total: number;
  heading: string;
  nama: string;
  listingId: string;
  order?: string;
  hasScreenshot: boolean;
}) {
  const [shareImg, setShareImg] = useState<string | null>(null);

  const actions = (
    <>
      <p className="text-xs text-tinta-redup">{copy.momen.bagikanAjak}</p>
      {/* Desktop: save the chosen OG image. Mobile: Web Share the buyer's own listing
          (rich per-listing OG card via /api/og/[id]) — "ini produkku, aku di #N". */}
      <ShareButton
        url={`/l/${listingId}`}
        text={copy.momen.share(rank)}
        imageUrl={shareImg}
        nama={nama}
        rank={rank}
      />
      <a href="/" className={buttonClasses("secondary", "md")}>
        {copy.momen.lihatPapan}
      </a>
    </>
  );

  return (
    <>
      <Confetti />
      {/* Mobile: celebration → card → actions. Desktop: celebration + actions on
          the left, the share card on the right — so it stays above the fold. */}
      <div className="flex w-full flex-col items-center gap-7 md:flex-row md:items-center md:justify-center md:gap-14 md:text-left">
        <div className="flex w-full flex-col items-center gap-6 md:order-2 md:w-auto md:max-w-sm md:items-start">
          <div className="flex flex-col items-center md:items-start">
            <p className="reveal tabular text-xs uppercase tracking-wide text-tinta-redup">
              {copy.momen.eyebrow}
            </p>
            <div className="relative mt-2">
              {rank === 1 && (
                <span
                  className="reveal-wave absolute -top-4 left-1/2 block h-3 w-4 -translate-x-1/2 bg-merah"
                  style={{ clipPath: "polygon(0 0, 100% 50%, 0 100%)" }}
                  aria-hidden
                />
              )}
              <div
                className="reveal-pop font-display font-extrabold text-merah-teks"
                style={{ fontStretch: "150%", fontSize: "5.25rem", lineHeight: 1, animationDelay: "0.1s" }}
              >
                #{rank}
              </div>
            </div>
            <h1
              className="reveal display-lg mt-1"
              style={{ animationDelay: "0.45s" }}
            >
              {heading}
            </h1>
          </div>
          {/* Actions — desktop only (mobile copy lives after the card). */}
          <div className="reveal hidden w-full flex-col gap-2 md:flex" style={{ animationDelay: "0.9s" }}>
            {actions}
          </div>
        </div>

        <div className="reveal w-full md:order-1 md:w-[400px] md:flex-shrink-0" style={{ animationDelay: "0.7s" }}>
          <ShareCard
            listingId={listingId}
            nama={nama}
            rank={rank}
            total={total}
            order={order}
            hasScreenshot={hasScreenshot}
            onImageChange={setShareImg}
          />
        </div>

        <div className="reveal flex w-full max-w-xs flex-col gap-2 md:hidden" style={{ animationDelay: "0.9s" }}>
          {actions}
        </div>
      </div>
    </>
  );
}
