import { copy } from "@/copy";
import { HeaderNav } from "./HeaderNav";
import { Logomark } from "./Logomark";

/**
 * Global chrome: wordmark + a Papan⇄Statistik switch and the Manjat action
 * (HeaderNav). This is the only nav on mobile now — the bottom tab bar was
 * dropped so the board isn't pushed below the fold.
 */
export function SiteHeader() {
  return (
    <header className="flex items-center justify-between gap-2 py-3">
      <a
        href="/"
        className="flex shrink-0 items-center gap-1.5 font-display text-xl font-bold tracking-tight text-tinta"
        style={{ fontStretch: "125%" }}
        aria-label={copy.merek.nama}
      >
        <Logomark className="size-5" />
        <span className="hidden min-[380px]:inline">{copy.merek.nama}</span>
      </a>
      <HeaderNav />
    </header>
  );
}
