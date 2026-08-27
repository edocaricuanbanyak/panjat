"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { copy } from "@/copy";
import type { KakiTiangEntry } from "@/domain/sorak";
import { LogoTile } from "./LogoTile";

/**
 * Kaki Tiang — the free (Rp0) tier below all paid listings, ordered by Sorak
 * (R16). Visitors give 3 free Sorak/day; the most-cheered rise. A gentle door
 * to a first payment. Dukung is optimistic + animated (a little heart burst);
 * the POST still enforces one-per-anon-per-day server-side, and the shared
 * `remaining` counter updates live.
 */
export function KakiTiang({
  entries,
  remaining: initialRemaining,
}: {
  entries: KakiTiangEntry[];
  remaining: number;
}) {
  const [remaining, setRemaining] = useState(initialRemaining);
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(entries.map((e) => [e.id, e.sorak])),
  );
  const [done, setDone] = useState<Set<string>>(new Set());

  async function dukung(id: string) {
    if (remaining <= 0 || done.has(id)) return;
    // Optimistic: bump this listing + spend one from the daily allowance.
    setCounts((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
    setRemaining((r) => r - 1);
    setDone((d) => new Set(d).add(id));
    try {
      const body = new FormData();
      body.set("listingId", id);
      const res = await fetch("/api/sorak", {
        method: "POST",
        headers: { Accept: "application/json" },
        body,
      });
      if (!res.ok) throw new Error("gagal");
    } catch {
      // Revert on failure (already supported today, rate-limited, offline…).
      setCounts((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 1) - 1) }));
      setRemaining((r) => r + 1);
      setDone((d) => {
        const n = new Set(d);
        n.delete(id);
        return n;
      });
    }
  }

  return (
    <section id="kaki-tiang" className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-semibold text-tinta">{copy.kakiTiang.judul}</h2>
        <span className="font-mono text-xs text-tinta-redup">
          {copy.kakiTiang.sisaDukungan(remaining)}
        </span>
      </div>
      <p className="mt-1 text-xs text-tinta-redup">{copy.kakiTiang.ajakan}</p>

      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-tinta-redup">{copy.kakiTiang.kosong}</p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {entries.map((e) => (
            <article
              key={e.id}
              className="flex items-center gap-3 rounded-lg border border-garis bg-kertas-2 p-3"
            >
              <LogoTile nama={e.nama} />
              <div className="min-w-0 flex-1">
                <a
                  href={`/k/${e.id}?asal=papan`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate font-display font-semibold text-tinta hover:text-merah-teks"
                >
                  {e.nama}
                </a>
                {e.deskripsi && <p className="truncate text-xs text-tinta-redup">{e.deskripsi}</p>}
              </div>
              <span className="font-mono tabular text-xs text-tinta-redup">
                {copy.kakiTiang.dukungan_n(counts[e.id] ?? 0)}
              </span>
              <DukungButton
                onDukung={() => dukung(e.id)}
                disabled={remaining <= 0 || done.has(e.id)}
                supported={done.has(e.id)}
              />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

// Six little hearts fanning up-and-out, plus a rising "+1".
const PARTICLES = [
  { tx: "-22px", ty: "-30px", rot: "-24deg", delay: "0ms" },
  { tx: "0px", ty: "-38px", rot: "0deg", delay: "20ms" },
  { tx: "22px", ty: "-30px", rot: "24deg", delay: "40ms" },
  { tx: "-14px", ty: "-24px", rot: "-14deg", delay: "60ms" },
  { tx: "14px", ty: "-24px", rot: "14deg", delay: "30ms" },
  { tx: "0px", ty: "-20px", rot: "0deg", delay: "80ms" },
];

function DukungButton({
  onDukung,
  disabled,
  supported,
}: {
  onDukung: () => void;
  disabled: boolean;
  supported: boolean;
}) {
  const [burst, setBurst] = useState(0);

  function click() {
    if (disabled) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) setBurst((b) => b + 1);
    onDukung();
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={click}
        disabled={disabled}
        aria-pressed={supported}
        className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm shadow-kartu transition ease-panjat focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-merah disabled:opacity-50 ${
          supported
            ? "border-merah bg-merah text-kertas-1"
            : "border-garis bg-kertas-1 text-tinta hover:bg-kertas-2 active:scale-95"
        }`}
      >
        <Heart
          className={`size-3.5 transition-transform ${supported ? "fill-kertas-1" : ""} ${
            burst > 0 ? "dukung-pop" : ""
          }`}
          aria-hidden
        />
        {copy.kakiTiang.dukung}
      </button>

      {burst > 0 && (
        <span
          key={burst}
          className="pointer-events-none absolute left-1/2 top-1 -translate-x-1/2"
          aria-hidden
        >
          <span className="dukung-plus absolute left-1/2 -translate-x-1/2 font-mono text-xs font-semibold text-merah-teks">
            +1
          </span>
          {PARTICLES.map((p, i) => (
            <Heart
              key={i}
              className="dukung-particle absolute left-1/2 top-0 size-3 -translate-x-1/2 fill-merah text-merah"
              style={
                {
                  "--tx": p.tx,
                  "--ty": p.ty,
                  "--rot": p.rot,
                  animationDelay: p.delay,
                } as React.CSSProperties
              }
            />
          ))}
        </span>
      )}
    </div>
  );
}
