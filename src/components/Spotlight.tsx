"use client";

import { useEffect, useState } from "react";

/**
 * Spotlight rotasi (§6.4) — one above-the-fold slot showing a listing every 30s,
 * probability proportional to pegangan (not rank). Even a Rp5.000 sponsor gets
 * airtime, breaking the "kalau nggak punya Rp100rb, percuma" perception.
 */
export interface SpotlightItem {
  id: string;
  nama: string;
  pegangan: number;
}

function pickWeighted(items: SpotlightItem[]): SpotlightItem | null {
  const total = items.reduce((s, i) => s + Math.max(1, i.pegangan), 0);
  if (total <= 0) return items[0] ?? null;
  let r = Math.random() * total;
  for (const i of items) {
    r -= Math.max(1, i.pegangan);
    if (r <= 0) return i;
  }
  return items[items.length - 1] ?? null;
}

export function Spotlight({ items }: { items: SpotlightItem[] }) {
  const [pick, setPick] = useState<SpotlightItem | null>(items[0] ?? null);

  useEffect(() => {
    if (items.length === 0) return;
    setPick(pickWeighted(items));
    const t = setInterval(() => setPick(pickWeighted(items)), 30_000);
    return () => clearInterval(t);
  }, [items]);

  if (!pick) return null;
  return (
    <a
      href={`/k/${pick.id}?asal=papan`}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 flex items-center gap-2 rounded-md border border-garis bg-kertas-1 px-3 py-2 text-sm hover:bg-kertas-2"
    >
      <span className="font-mono text-xs text-merah">Spotlight</span>
      <span className="truncate font-display font-semibold text-tinta">{pick.nama}</span>
    </a>
  );
}
