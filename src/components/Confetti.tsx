"use client";

import { useEffect, useState } from "react";

// Brand-ish palette: merah, emas, hidup-green, tinta, plus two lighter accents.
const COLORS = ["#da2e20", "#c8971c", "#1a6e3c", "#1f1b16", "#e2503f", "#d9a520"];

type Piece = {
  id: number;
  left: number;
  delay: number;
  dur: number;
  color: string;
  w: number;
  h: number;
  drift: number;
  rot: number;
};

/**
 * One-shot confetti burst (celebration after a successful payment). Pure DOM +
 * CSS, no dependency; self-removes after the fall. Skipped under reduced motion.
 */
export function Confetti({ count = 70 }: { count?: number }) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const arr: Piece[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      dur: 2.6 + Math.random() * 1.6,
      color: COLORS[i % COLORS.length],
      w: 6 + Math.random() * 7,
      h: 10 + Math.random() * 10,
      drift: (Math.random() - 0.5) * 180,
      rot: 240 + Math.random() * 520,
    }));
    setPieces(arr);
    const t = setTimeout(() => setPieces([]), 4600);
    return () => clearTimeout(t);
  }, [count]);

  if (pieces.length === 0) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={
            {
              left: `${p.left}%`,
              width: p.w,
              height: p.h,
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.dur}s`,
              "--drift": `${p.drift}px`,
              "--rot": `${p.rot}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
