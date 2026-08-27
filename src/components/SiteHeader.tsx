import { copy } from "@/copy";
import { Logomark } from "./Logomark";

/**
 * Minimal global chrome: wordmark + top-level menu (Leaderboard, Statistik).
 * The Manjat action lives in the hero and on every board row (Salip), so the
 * header stays a calm nav line on every page.
 */
export function SiteHeader() {
  return (
    <header className="flex items-center justify-between py-3">
      <a
        href="/"
        className="flex items-center gap-1.5 font-display text-xl font-bold tracking-tight text-tinta"
        style={{ fontStretch: "125%" }}
      >
        <Logomark className="size-5" />
        {copy.merek.nama}
      </a>
      <nav className="hidden items-center gap-4 font-display text-sm font-semibold md:flex">
        <a href="/" className="text-tinta-redup hover:text-tinta">
          {copy.nav.leaderboard}
        </a>
        <a href="/statistik" className="text-tinta-redup hover:text-tinta">
          {copy.nav.statistik}
        </a>
      </nav>
    </header>
  );
}
