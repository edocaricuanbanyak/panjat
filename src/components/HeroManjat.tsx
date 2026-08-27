"use client";

import { useState } from "react";
import { Dropdown } from "./Dropdown";
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
    <div className="mt-5 flex flex-col gap-2 sm:flex-row">
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && go()}
        placeholder="Tempel URL produkmu — mis. nyala.id"
        className="h-12 flex-1 rounded-lg border border-garis bg-kertas-1 px-4 text-base text-tinta shadow-kartu transition-shadow focus-visible:border-merah focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-merah/25"
      />
      <Dropdown
        className="sm:w-44"
        placeholder="Kategori"
        value={kategoriSlug}
        onChange={setKategoriSlug}
        options={kategori.map((k) => ({ value: k.slug, label: k.nama }))}
      />
      <button
        onClick={go}
        disabled={!url.trim()}
        className="h-12 shrink-0 rounded-lg bg-merah px-6 font-medium text-kertas-1 shadow-kartu transition-all ease-panjat hover:-translate-y-px hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-merah active:translate-y-0 disabled:opacity-50"
      >
        Manjat →
      </button>
    </div>
  );
}
