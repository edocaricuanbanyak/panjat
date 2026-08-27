/**
 * Product doors (R22, §9.2): Papan (money-ranked) + Hari Ini (24h reset board)
 * + Jelajah (discovery). Spectators and searchers each find their entrance.
 */
export function Nav({ active }: { active: "papan" | "hari-ini" | "jelajah" }) {
  const link = (href: string, key: typeof active, label: string) => (
    <a
      href={href}
      className={`font-display text-sm font-semibold ${active === key ? "text-tinta" : "text-tinta-redup hover:text-tinta"}`}
    >
      {label}
    </a>
  );
  return (
    <nav className="mb-4 flex items-center gap-4 border-b border-garis pb-3">
      {link("/", "papan", "Papan")}
      {link("/hari-ini", "hari-ini", "Hari Ini")}
      {link("/jelajah", "jelajah", "Jelajah")}
    </nav>
  );
}
