"use client";

import { useMemo, useState } from "react";
import { copy } from "@/copy";
import type { JelajahCard as Card } from "@/domain/jelajah";
import { fieldClasses } from "./Input";
import { JelajahCard } from "./JelajahCard";

type Kategori = { slug: string; nama: string };

/**
 * In-place Jelajah tab (R22): search + selectable category chips filter the
 * preloaded live listings client-side. Ordered by relevance/recency, never by
 * money — this surface can't be bought.
 */
export function JelajahPanel({ items, categories }: { items: Card[]; categories: Kategori[] }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((it) => {
      if (cat && it.kategoriSlug !== cat) return false;
      if (!needle) return true;
      return (
        it.nama.toLowerCase().includes(needle) ||
        (it.deskripsi ?? "").toLowerCase().includes(needle) ||
        (it.kategoriNama ?? "").toLowerCase().includes(needle)
      );
    });
  }, [items, q, cat]);

  const chip = (on: boolean) =>
    `inline-flex h-8 items-center rounded-full border px-3 text-sm transition ${
      on
        ? "border-merah bg-merah text-kertas-1"
        : "border-garis bg-kertas-1 text-tinta-redup hover:bg-kertas-2"
    }`;

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={copy.jelajah.cariPlaceholder}
        className={fieldClasses}
      />

      {/* Selectable category chips */}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => setCat(null)} className={chip(cat === null)}>
          {copy.jelajah.semua}
        </button>
        {categories.map((k) => (
          <button
            key={k.slug}
            type="button"
            onClick={() => setCat((c) => (c === k.slug ? null : k.slug))}
            className={chip(cat === k.slug)}
          >
            {k.nama}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <p className="mt-6 text-sm text-tinta-redup">{copy.jelajah.kosong}</p>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {results.map((c) => (
            <JelajahCard key={c.id} card={c} asal={q.trim() ? "pencarian" : "jelajah"} />
          ))}
        </div>
      )}
    </div>
  );
}
