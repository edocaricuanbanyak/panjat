import { copy } from "@/copy";
import { Logomark } from "./Logomark";
import { ManjatButton } from "./ManjatModal";

/**
 * Minimal global chrome (editorial IA): wordmark + the one action. Product doors
 * (Sekarang/Hari Ini/Jelajah) live in BoardTabs within the board area, not here —
 * the header stays a single, calm line on every page.
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
      <ManjatButton size="sm">{copy.nav.manjat}</ManjatButton>
    </header>
  );
}
