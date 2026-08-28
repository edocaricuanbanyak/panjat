"use client";

import { useState } from "react";
import { Dropdown } from "./Dropdown";
import { fieldClasses } from "./Input";
import { KategoriIcon } from "./KategoriIcon";
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

  // Mobile: URL on row 1, then [Kategori | Manjat] on row 2 (saves a row so the
  // board reaches above the fold). Desktop: one row — the wrapper is `contents`.
  return (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && go()}
        placeholder="Tempel link yang mau kamu panjatkan"
        className={`${fieldClasses} sm:flex-1`}
      />
      <div className="flex gap-2 sm:contents">
        <Dropdown
          className="flex-1 sm:w-44"
          placeholder="Kategori"
          value={kategoriSlug}
          onChange={setKategoriSlug}
          options={kategori.map((k) => ({
            value: k.slug,
            label: k.nama,
            icon: <KategoriIcon slug={k.slug} className="size-4 shrink-0 text-tinta-redup" />,
          }))}
        />
        <button
          onClick={go}
          disabled={!url.trim()}
          className="h-12 shrink-0 rounded-xl bg-merah px-5 font-display font-semibold text-kertas-1 shadow-kartu transition-all ease-panjat hover:-translate-y-px hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-merah active:translate-y-0 disabled:opacity-50 sm:h-11"
        >
          Manjat →
        </button>
      </div>
    </div>
  );
}
