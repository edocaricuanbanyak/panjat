/**
 * Two equal doors (R22): Papan (money-ranked) and Jelajah (discovery). Spectators
 * and searchers each find their entrance in a second.
 */
export function Nav({ active }: { active: "papan" | "jelajah" }) {
  const link = (href: string, key: "papan" | "jelajah", label: string) => (
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
      {link("/jelajah", "jelajah", "Jelajah")}
    </nav>
  );
}
