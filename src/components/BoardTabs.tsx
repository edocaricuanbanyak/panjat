type Tab = "sekarang" | "hari-ini" | "jelajah";

const TABS: { key: Tab; href: string; label: string }[] = [
  { key: "sekarang", href: "/", label: "Sekarang" },
  { key: "hari-ini", href: "/hari-ini", label: "Hari Ini" },
  { key: "jelajah", href: "/jelajah", label: "Jelajah" },
];

/**
 * The three board doors as editorial underline tabs (R22, §9.2). Papan is the
 * center; Hari Ini and Jelajah are peers you switch between, not a separate nav.
 */
export function BoardTabs({ active, className = "" }: { active: Tab; className?: string }) {
  return (
    <nav className={`flex gap-6 border-b border-garis ${className}`}>
      {TABS.map((t) => {
        const on = t.key === active;
        return (
          <a
            key={t.key}
            href={t.href}
            aria-current={on ? "page" : undefined}
            className={`-mb-px border-b-2 pb-2.5 font-display text-sm font-semibold transition ${
              on
                ? "border-merah text-tinta"
                : "border-transparent text-tinta-redup hover:text-tinta"
            }`}
          >
            {t.label}
          </a>
        );
      })}
    </nav>
  );
}
