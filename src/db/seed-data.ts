/**
 * Data required by BOTH the dev seed (`seed.ts`) and the production seed
 * (`seed-prod.ts`): the category list and the §6.6 config tunables. Kept in one
 * place so the two seeders never drift. No sample listings live here — those are
 * dev-only and stay in `seed.ts`.
 */

export const KATEGORI: { nama: string; slug: string }[] = [
  { nama: "AI Tools", slug: "ai-tools" },
  { nama: "SaaS", slug: "saas" },
  { nama: "Jasa", slug: "jasa" },
  { nama: "E-commerce", slug: "ecommerce" },
  { nama: "Konten & Media", slug: "konten" },
  { nama: "Game", slug: "game" },
  { nama: "Edukasi", slug: "edukasi" },
  { nama: "Fintech", slug: "fintech" },
  { nama: "Produktivitas", slug: "produktivitas" },
  { nama: "Komunitas", slug: "komunitas" },
  { nama: "Marketplace", slug: "marketplace" },
];

// §6.6 parameters — stored in DB, never hard-coded in feature code. Missing keys
// crash the app (loadRosotConfig), so production MUST have these.
export const KONFIGURASI: { key: string; value: unknown }[] = [
  {
    key: "laju_rosot",
    // decay per day by position tier (§6.1)
    value: { "1": 0.25, "2_3": 0.18, "4_10": 0.12, "11_30": 0.07, "31_plus": 0.03, kaki_tiang: 0 },
  },
  { key: "ambang_tier", value: { top1: 1, top3: 3, top10: 10, top30: 30 } },
  { key: "kaki_tiang", value: 1000 },
  { key: "minimum_naik", value: 5000 },
  { key: "minimum_manjat_lagi", value: 1000 },
  { key: "jam_hitung_ulang", value: 1 },
  { key: "bobot_spotlight", value: "pegangan" },
  // Share-card (OG) hero toggles — show the site's own screenshot / logo.
  { key: "og_tampilkan_screenshot", value: true },
  { key: "og_tampilkan_logo", value: true },
];
