type TabItem = { key: string; label: string; href?: string };

/**
 * Reusable tab bar. Two looks:
 * - "garis" (underline) for primary navigation between board doors.
 * - "pil" (segmented pills) for in-place filters.
 * Pass `onSelect` for in-place tabs (renders buttons, no navigation); items with
 * `href` render links.
 */
export function Tabs({
  items,
  active,
  variant = "garis",
  onSelect,
  className = "",
}: {
  items: TabItem[];
  active: string;
  variant?: "garis" | "pil";
  onSelect?: (key: string) => void;
  className?: string;
}) {
  const wrap = variant === "pil";
  const cls = (on: boolean) =>
    wrap
      ? `rounded-lg px-3.5 py-1.5 text-sm font-medium transition ease-panjat ${
          on ? "bg-merah text-kertas-1 shadow-kartu" : "text-tinta-redup hover:text-tinta"
        }`
      : `-mb-px border-b-2 pb-2.5 font-display text-sm font-semibold transition ease-panjat ${
          on ? "border-merah text-tinta" : "border-transparent text-tinta-redup hover:text-tinta"
        }`;

  const inner = items.map((t) => {
    const on = t.key === active;
    if (t.href) {
      return (
        <a key={t.key} href={t.href} aria-current={on ? "page" : undefined} className={cls(on)}>
          {t.label}
        </a>
      );
    }
    if (onSelect) {
      return (
        <button
          key={t.key}
          type="button"
          aria-current={on ? "page" : undefined}
          onClick={() => onSelect(t.key)}
          className={`${cls(on)} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-merah`}
        >
          {t.label}
        </button>
      );
    }
    return (
      <span key={t.key} className={cls(on)}>
        {t.label}
      </span>
    );
  });

  return wrap ? (
    <div className={`inline-flex gap-1 rounded-xl border border-garis bg-kertas-1 p-1 ${className}`}>
      {inner}
    </div>
  ) : (
    <nav className={`flex gap-6 border-b border-garis ${className}`}>{inner}</nav>
  );
}
