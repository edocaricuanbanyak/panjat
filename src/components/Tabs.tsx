type TabItem = { key: string; label: string; href?: string };

/**
 * Reusable tab bar. Two looks:
 * - "garis" (underline) for primary navigation between board doors.
 * - "pil" (segmented pills on glass) for in-place filters.
 */
export function Tabs({
  items,
  active,
  variant = "garis",
  className = "",
}: {
  items: TabItem[];
  active: string;
  variant?: "garis" | "pil";
  className?: string;
}) {
  if (variant === "pil") {
    return (
      <div className={`inline-flex gap-1 rounded-xl border border-garis bg-kertas-1 p-1 ${className}`}>
        {items.map((t) => {
          const on = t.key === active;
          const cls = `rounded-lg px-3.5 py-1.5 text-sm font-medium transition ease-panjat ${
            on ? "bg-merah text-kertas-1 shadow-kartu" : "text-tinta-redup hover:text-tinta"
          }`;
          return t.href ? (
            <a key={t.key} href={t.href} aria-current={on ? "page" : undefined} className={cls}>
              {t.label}
            </a>
          ) : (
            <span key={t.key} className={cls}>
              {t.label}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <nav className={`flex gap-6 border-b border-garis ${className}`}>
      {items.map((t) => {
        const on = t.key === active;
        const cls = `-mb-px border-b-2 pb-2.5 font-display text-sm font-semibold transition ease-panjat ${
          on ? "border-merah text-tinta" : "border-transparent text-tinta-redup hover:text-tinta"
        }`;
        return t.href ? (
          <a key={t.key} href={t.href} aria-current={on ? "page" : undefined} className={cls}>
            {t.label}
          </a>
        ) : (
          <span key={t.key} className={cls}>
            {t.label}
          </span>
        );
      })}
    </nav>
  );
}
