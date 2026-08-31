import { MousePointerClick } from "lucide-react";
import { copy } from "@/copy";

/**
 * Click count as social proof of real traffic delivered — a bare icon + count
 * that inherits the surrounding meta line's colour. Shared by the paid board and
 * Kaki Tiang so both read identically. Renders nothing at 0 clicks (an empty
 * "0 klik" is anti-proof). Clicks are server-counted (R10) and never affect
 * ranking — display only.
 */
export function KlikChip({ n, className = "" }: { n: number; className?: string }) {
  if (n <= 0) return null;
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 tabular ${className}`}
      title={copy.papan.klikProof}
    >
      <MousePointerClick className="size-3.5" aria-hidden />
      {copy.papan.klik(n)}
    </span>
  );
}
