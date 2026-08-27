"use client";

import { ShareButton } from "./ShareButton";
import { ShareCard } from "./ShareCard";
import { buttonClasses } from "@/components/Button";
import { Confetti } from "@/components/Confetti";
import { copy } from "@/copy";

/**
 * Momen Puncak (MI-1) — "ini produk sesungguhnya" (§9.2). A ~1.2s staggered
 * entrance: rank pops, name and stats rise, a flag waves once, the share card
 * arrives. transform/opacity only; reduced-motion collapses to instant.
 */
export function MomenPuncakReveal({
  rank,
  heading,
  nama,
  pegangan,
  overtaken,
  listingId,
}: {
  rank: number;
  heading: string;
  nama: string;
  pegangan: string;
  overtaken: number;
  listingId: string;
}) {
  return (
    <>
      <Confetti />
      <p className="reveal font-mono text-xs uppercase tracking-wide text-tinta-redup">
        {copy.momen.eyebrow}
      </p>

      <div className="relative mt-3">
        {rank === 1 && (
          <span
            className="reveal-wave absolute -top-4 left-1/2 block h-3 w-4 -translate-x-1/2 bg-merah"
            style={{ clipPath: "polygon(0 0, 100% 50%, 0 100%)" }}
            aria-hidden
          />
        )}
        <div
          className="reveal-pop font-display font-extrabold text-merah-teks"
          style={{ fontStretch: "150%", fontSize: "6rem", lineHeight: 1, animationDelay: "0.1s" }}
        >
          #{rank}
        </div>
      </div>

      <h1
        className="reveal mt-2 font-display text-2xl font-bold text-tinta"
        style={{ fontStretch: "120%", animationDelay: "0.45s" }}
      >
        {heading}
      </h1>
      <p className="reveal mt-1 text-sm text-tinta-redup" style={{ animationDelay: "0.6s" }}>
        {copy.momen.ringkas(nama, pegangan)}
        {overtaken > 0 && <> · {copy.momen.menyalip(overtaken)}</>}
      </p>

      <div className="reveal mt-6 w-full" style={{ animationDelay: "0.85s" }}>
        <ShareCard listingId={listingId} nama={nama} />
      </div>

      <div
        className="reveal mt-6 flex w-full max-w-xs flex-col gap-2"
        style={{ animationDelay: "1.05s" }}
      >
        <ShareButton url="/" text={copy.momen.share(rank)} />
        <a href="/" className={buttonClasses("secondary", "md")}>
          {copy.momen.lihatPapan}
        </a>
      </div>
    </>
  );
}
