import type { MetadataRoute } from "next";
import { copy } from "@/copy";

/**
 * Web App Manifest (R20-d adjacent) — makes Panjat installable and, on mobile,
 * launch as a standalone app (no browser chrome). Colours come from the design
 * tokens: paper background, dark splash tile. Icons are the brand pole+pennant.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${copy.merek.nama} — papan peringkat berbayar`,
    short_name: copy.merek.nama,
    description: copy.merek.deskripsiSitus,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f3f0e9",
    theme_color: "#f3f0e9",
    lang: "id",
    dir: "ltr",
    categories: ["business", "shopping", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
