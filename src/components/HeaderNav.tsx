"use client";

import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { copy } from "@/copy";

const ITEMS = [
  { href: "/", label: copy.nav.sepanjangMasa }, // Papan Utama
  { href: "/jelajah", label: copy.nav.cari, icon: Search }, // discovery door for tool-seekers
] as const;

/**
 * Header navigation — a plain menu: Papan Utama · Cari. The active item is shown
 * in full-ink; the rest are muted. Cari (search icon) is the discovery door for
 * visitors hunting tools, not advertisers. Statistik lives in the footer + the
 * hero "pengunjung" chip, so it's off the top nav. (Manjat lives in the hero +
 * every Salip button, so it's not repeated here.)
 */
export function HeaderNav() {
  const pathname = usePathname();
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    // Cari covers the whole discovery flow, including category pages.
    if (href === "/jelajah") return pathname.startsWith("/jelajah") || pathname.startsWith("/kategori");
    return pathname.startsWith(href);
  };

  return (
    <nav className="flex items-center gap-4 font-display text-sm font-semibold sm:gap-5">
      {ITEMS.map((it) => {
        const active = isActive(it.href);
        const Icon = "icon" in it ? it.icon : undefined;
        return (
          <a
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              active ? "text-tinta" : "text-tinta-redup hover:text-tinta"
            }`}
          >
            {Icon && <Icon className="size-4" aria-hidden />}
            {it.label}
          </a>
        );
      })}
    </nav>
  );
}
