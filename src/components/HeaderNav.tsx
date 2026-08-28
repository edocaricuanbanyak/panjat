"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { copy } from "@/copy";

const SEGS = [
  { href: "/", label: copy.nav.papanRingkas },
  { href: "/statistik", label: copy.nav.statistik },
] as const;

/**
 * Header navigation for every breakpoint: a Papan⇄Statistik switch with a sliding
 * pill — the highlight animates to the tapped segment optimistically, so the slide
 * plays through the route change. Replaces the old bottom tab bar so the board
 * isn't pushed below the fold. (Manjat lives in the hero + every Salip button.)
 */
export function HeaderNav() {
  const pathname = usePathname();
  const router = useRouter();

  const activeIdx = pathname.startsWith("/statistik") ? 1 : 0;
  const [pending, setPending] = useState<number | null>(null);
  const idx = pending ?? activeIdx;

  // Clear the optimistic target once the new route has landed.
  useEffect(() => setPending(null), [pathname]);

  function go(i: number, e: React.MouseEvent) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // let real link behaviour win
    e.preventDefault();
    if (i === idx) return;
    setPending(i); // slides the pill now; the current header stays mounted through the soft nav
    router.push(SEGS[i].href);
  }

  return (
    <div className="relative inline-flex overflow-hidden rounded-full border border-garis bg-kertas-1 font-display text-sm font-semibold">
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-tinta transition-transform duration-300 ease-panjat"
        style={{ transform: `translateX(${idx * 100}%)` }}
      />
      {SEGS.map((s, i) => (
        <a
          key={s.href}
          href={s.href}
          onClick={(e) => go(i, e)}
          aria-current={i === activeIdx ? "page" : undefined}
          className={`relative z-10 flex-1 basis-0 whitespace-nowrap px-3.5 py-1 text-center transition-colors duration-200 ${
            i === idx ? "text-kertas-1" : "text-tinta-redup hover:text-tinta"
          }`}
        >
          {s.label}
        </a>
      ))}
    </div>
  );
}
