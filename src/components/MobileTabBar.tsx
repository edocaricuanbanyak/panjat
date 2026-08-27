"use client";

import { BarChart3, Crown, ScrollText, TrendingUp, Trophy } from "lucide-react";
import { usePathname } from "next/navigation";
import { copy } from "@/copy";
import { useManjat } from "./ManjatModal";

type Tab = { href: string; label: string; icon: typeof Trophy };

const LEFT: Tab[] = [
  { href: "/", label: copy.nav.papanRingkas, icon: Trophy },
  { href: "/statistik", label: copy.nav.statistik, icon: BarChart3 },
];
const RIGHT: Tab[] = [
  { href: "/arsip", label: copy.nav.arsip, icon: Crown },
  { href: "/aturan", label: copy.nav.aturan, icon: ScrollText },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/**
 * Native-app bottom navigation for the installed/mobile (PWA) experience. Fixed
 * to the bottom with a safe-area inset, a raised Manjat action in the middle, and
 * the four board destinations around it. Hidden on md+ where the top nav takes
 * over. The Manjat button reuses the same modal as everywhere else.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const { open } = useManjat();

  const item = (t: Tab) => {
    const on = isActive(pathname, t.href);
    const Icon = t.icon;
    return (
      <a
        key={t.href}
        href={t.href}
        aria-current={on ? "page" : undefined}
        className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
          on ? "text-merah-teks" : "text-tinta-redup"
        }`}
      >
        <Icon className="size-5" strokeWidth={on ? 2.4 : 2} aria-hidden />
        <span className="max-w-full truncate leading-none">{t.label}</span>
      </a>
    );
  };

  return (
    <nav
      aria-label={copy.merek.nama}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-garis bg-kertas md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-3xl items-stretch">
        {LEFT.map(item)}
        {/* Raised primary action — the one thing the product asks you to do. */}
        <div className="flex w-16 shrink-0 flex-col items-center justify-start">
          <button
            type="button"
            onClick={() => open()}
            aria-label={copy.nav.manjat}
            className="-mt-5 flex size-12 items-center justify-center rounded-full bg-merah text-kertas-1 shadow-naik ring-4 ring-kertas transition-transform ease-panjat active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-merah"
          >
            <TrendingUp className="size-6" strokeWidth={2.4} aria-hidden />
          </button>
          <span className="mt-0.5 text-[10px] font-semibold text-merah-teks">
            {copy.nav.manjat}
          </span>
        </div>
        {RIGHT.map(item)}
      </div>
    </nav>
  );
}
