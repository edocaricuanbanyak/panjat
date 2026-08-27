import { ManjatButton } from "./ManjatModal";

/**
 * Minimal global chrome (editorial IA): wordmark + the one action. Product doors
 * (Sekarang/Hari Ini/Jelajah) live in BoardTabs within the board area, not here —
 * the header stays a single, calm line on every page.
 */
export function SiteHeader() {
  return (
    <header className="flex items-center justify-between py-4">
      <a
        href="/"
        className="font-display text-xl font-bold tracking-tight text-tinta"
        style={{ fontStretch: "125%" }}
      >
        Panjat
      </a>
      <ManjatButton size="sm">Manjat</ManjatButton>
    </header>
  );
}
