"use client";

import { useEffect, useState } from "react";
import { LogoTile } from "./LogoTile";

/**
 * The listing's real site logo (its favicon), with a graceful fall back to the
 * neutral letter tile when the site has none / it fails (R2). The favicon is
 * preloaded off-DOM, so the letter tile is the immediate default and the real
 * logo only swaps in once it genuinely loads — no broken-image flash. Loaded
 * from the sponsor's own domain (CSP already allows remote https images).
 */
export function SiteLogo({
  urlNormal,
  nama,
  className,
}: {
  urlNormal: string;
  nama: string;
  className?: string;
}) {
  const host = urlNormal
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "")
    .split("/")[0];
  const src = host ? `https://${host}/favicon.ico` : null;
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!src) return;
    setOk(false);
    const img = new window.Image();
    img.onload = () => setOk(img.naturalWidth > 1);
    img.onerror = () => setOk(false);
    img.src = src;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  if (!ok || !src) return <LogoTile nama={nama} className={className} />;
  return (
    // biome-ignore lint/performance/noImgElement: remote favicon, not a static asset
    <img
      src={src}
      alt=""
      className={`border border-garis bg-kertas-1 object-contain p-0.5 ${className ?? "size-11 rounded-md"}`}
    />
  );
}
