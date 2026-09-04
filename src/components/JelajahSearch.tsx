"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { copy } from "@/copy";
import { fieldClasses } from "./Input";

/**
 * The single Jelajah search box. Typing debounces a navigation to
 * `/jelajah?q=…`, which the server renders via Postgres full-text search
 * (relevance-ranked, R22). Every query is therefore a real, shareable,
 * crawlable URL — never a money-ordered surface.
 */
export function JelajahSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Skip the navigation on first mount — the server already rendered this query.
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const trimmed = q.trim();
      const href = trimmed ? `/jelajah?q=${encodeURIComponent(trimmed)}` : "/jelajah";
      // `replace` (not push) keeps the back button from filling up per keystroke.
      startTransition(() => router.replace(href, { scroll: false }));
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q, router]);

  return (
    <input
      type="search"
      value={q}
      onChange={(e) => setQ(e.target.value)}
      placeholder={copy.jelajah.cariPlaceholder}
      aria-label={copy.jelajah.cariLabel}
      className={`${fieldClasses} ${pending ? "opacity-70" : ""}`}
    />
  );
}
