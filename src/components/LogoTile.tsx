/**
 * Logo placeholder — a first-letter tile on a neutral surface. Real scraped
 * logos land with the preview slice; a blurry logo hurts the brand more than
 * none (R2), so the tile is the honest default. Never tinted with identity
 * colors — the sponsor's brand is not a data carrier (§9.6.2).
 */
export function LogoTile({ nama, className }: { nama: string; className?: string }) {
  const letter = nama.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      className={`grid place-items-center bg-kertas-2 text-tiang font-display font-semibold select-none ${className ?? "size-11 rounded-md text-lg"}`}
      aria-hidden
    >
      {letter}
    </div>
  );
}
