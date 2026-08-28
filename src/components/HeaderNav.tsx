"use client";

import { usePathname } from "next/navigation";
import { copy } from "@/copy";

const ITEMS = [
  { href: "/", label: copy.nav.sepanjangMasa }, // Papan Utama
  { href: "/statistik", label: copy.nav.statistik },
] as const;

/**
 * Header navigation — a plain menu: Papan Utama · Statistik. The active item is
 * shown in full-ink; the rest are muted. (Manjat lives in the hero + every Salip
 * button, so it's not repeated here.)
 */
export function HeaderNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav className="flex items-center gap-4 font-display text-sm font-semibold sm:gap-5">
      {ITEMS.map((it) => {
        const active = isActive(it.href);
        return (
          <a
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap transition-colors ${
              active ? "text-tinta" : "text-tinta-redup hover:text-tinta"
            }`}
          >
            {it.label}
          </a>
        );
      })}
    </nav>
  );
}
