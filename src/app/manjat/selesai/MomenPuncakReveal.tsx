"use client";

import { ShareButton } from "./ShareButton";
import { buttonClasses } from "@/components/Button";

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
      <p className="reveal font-mono text-xs uppercase tracking-wide text-tinta-redup">
        Momen Puncak
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
          className="reveal-pop font-display font-extrabold text-merah"
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
        {nama} · pegangan {pegangan}
        {overtaken > 0 && <> · menyalip {overtaken} pemanjat</>}
      </p>

      <img
        src={`/api/og/${listingId}?story=1`}
        alt={`Kartu ${nama}`}
        width={270}
        height={480}
        className="reveal mt-6 rounded-lg border border-garis shadow-sm"
        style={{ animationDelay: "0.85s" }}
      />

      <div
        className="reveal mt-6 flex w-full max-w-xs flex-col gap-2"
        style={{ animationDelay: "1.05s" }}
      >
        <ShareButton url="/" text={`Aku #${rank} di Panjat!`} />
        <a href="/" className={buttonClasses("secondary", "md")}>
          Lihat papan
        </a>
      </div>
    </>
  );
}
