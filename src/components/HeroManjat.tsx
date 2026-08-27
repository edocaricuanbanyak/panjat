"use client";

import { useState } from "react";
import { useManjat } from "./ManjatModal";

type Kategori = { slug: string; nama: string };

/**
 * Front-page express entry: paste a link, pick a category → straight to the
 * preview + pay step (§9.1 "papan dulu, form belakangan" — but make the form
 * one paste away).
 */
export function HeroManjat({ kategori }: { kategori: Kategori[] }) {
  const { open } = useManjat();
  const [url, setUrl] = useState("");
  const [kategoriSlug, setKategoriSlug] = useState("");

  function go() {
    if (!url.trim()) return;
    open({ url, kategoriSlug: kategoriSlug || undefined, express: true });
  }

  return (
    <div className="mt-4 rounded-lg border border-garis bg-kertas-1 p-3">
      <p className="mb-2 text-sm text-tinta-redup">
        Naikkan produkmu ke papan — tempel link, pilih kategori, bayar.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder="tempel URL produkmu — mis. nyala.id"
          className="h-11 flex-1 rounded-md border border-garis bg-kertas-2 px-3 text-base text-tinta focus-visible:outline-2 focus-visible:outline-merah"
        />
        <select
          value={kategoriSlug}
          onChange={(e) => setKategoriSlug(e.target.value)}
          className="h-11 rounded-md border border-garis bg-kertas-2 px-3 text-base text-tinta"
        >
          <option value="">Kategori</option>
          {kategori.map((k) => (
            <option key={k.slug} value={k.slug}>{k.nama}</option>
          ))}
        </select>
        <button
          onClick={go}
          disabled={!url.trim()}
          className="h-11 rounded-md bg-merah px-5 text-sm font-medium text-kertas-1 disabled:opacity-50"
        >
          Manjat →
        </button>
      </div>
    </div>
  );
}
