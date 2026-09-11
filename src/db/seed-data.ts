/**
 * Data required by BOTH the dev seed (`seed.ts`) and the production seed
 * (`seed-prod.ts`): the category list and the §6.6 config tunables. Kept in one
 * place so the two seeders never drift. No sample listings live here — those are
 * dev-only and stay in `seed.ts`.
 *
 * Market-aware: category names follow MARKET.defaultLocale and the money-
 * magnitude tunables follow MARKET.currency (integer minor units — rupiah for
 * IDR, cents for USD). Ratio-based tunables (decay rates, floor ratio) are
 * currency-independent and shared. On the default (Indonesian) deployment the
 * exported values are byte-identical to before.
 */
import { MARKET } from "@/lib/market";

const KATEGORI_ID: { nama: string; slug: string }[] = [
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
  { nama: "Media Sosial", slug: "sosial" },
];

// English names for the global board. Slugs are kept stable so URLs and any
// existing links do not depend on the display language.
const KATEGORI_EN: { nama: string; slug: string }[] = [
  { nama: "AI Tools", slug: "ai-tools" },
  { nama: "SaaS", slug: "saas" },
  { nama: "Services", slug: "jasa" },
  { nama: "E-commerce", slug: "ecommerce" },
  { nama: "Content & Media", slug: "konten" },
  { nama: "Games", slug: "game" },
  { nama: "Education", slug: "edukasi" },
  { nama: "Fintech", slug: "fintech" },
  { nama: "Productivity", slug: "produktivitas" },
  { nama: "Community", slug: "komunitas" },
  { nama: "Marketplace", slug: "marketplace" },
  { nama: "Social Media", slug: "sosial" },
];

export const KATEGORI = MARKET.defaultLocale === "en" ? KATEGORI_EN : KATEGORI_ID;

/**
 * Money-magnitude tunables per currency, in integer minor units. USD values are
 * chosen to keep the same product feel (summit ≈ Rp95k ≈ a few dollars, a
 * cheap-to-reach floor). Tune per market as needed.
 */
interface MoneyTunables {
  kaki_tiang: number;
  lantai_maks: number;
  minimum_naik: number;
  minimum_manjat_lagi: number;
  ambang_tinjau_manual: number;
}
const MONEY_TUNABLES: Record<string, MoneyTunables> = {
  IDR: {
    kaki_tiang: 1000, // Rp1.000
    lantai_maks: 10000, // Rp10.000
    minimum_naik: 5000, // Rp5.000
    minimum_manjat_lagi: 1000, // Rp1.000
    ambang_tinjau_manual: 0,
  },
  USD: {
    kaki_tiang: 100, // $1.00
    lantai_maks: 1000, // $10.00
    minimum_naik: 500, // $5.00
    minimum_manjat_lagi: 100, // $1.00
    ambang_tinjau_manual: 0,
  },
};
const money = MONEY_TUNABLES[MARKET.currency] ?? MONEY_TUNABLES.IDR;

// §6.6 parameters — stored in DB, never hard-coded in feature code. Missing keys
// crash the app (loadRosotConfig), so production MUST have these.
export const KONFIGURASI: { key: string; value: unknown }[] = [
  {
    key: "laju_rosot",
    // decay per day by position tier (§6.1) — currency-independent
    value: { "1": 0.25, "2_3": 0.18, "4_10": 0.12, "11_30": 0.07, "31_plus": 0.03, kaki_tiang: 0 },
  },
  { key: "ambang_tier", value: { top1: 1, top3: 3, top10: 10, top30: 30 } },
  { key: "kaki_tiang", value: money.kaki_tiang },
  // Protected floor for paid listings: grip won't decay below this fraction of
  // total paid, capped at lantai_maks (kept ≪ summit so #1 stays contestable).
  { key: "lantai_rasio", value: 0.1 },
  { key: "lantai_maks", value: money.lantai_maks },
  // Grace: decay is paused for this many hours after the latest payment
  // (top-up resets it). 0 = disabled.
  { key: "masa_tenang_jam", value: 48 },
  { key: "minimum_naik", value: money.minimum_naik },
  { key: "minimum_manjat_lagi", value: money.minimum_manjat_lagi },
  // §18.5 fraud gate: a NEW listing reaching this grip goes to manual review
  // before going public. 0 = disabled (new listings auto-list at any amount).
  { key: "ambang_tinjau_manual", value: money.ambang_tinjau_manual },
  // Max FREE listings per host — stops one advertiser flooding Kaki Tiang with
  // many paths of the same domain. Paid listings are never capped.
  { key: "maks_gratis_per_domain", value: 1 },
  { key: "jam_hitung_ulang", value: 1 },
  { key: "bobot_spotlight", value: "pegangan" },
  // Share-card (OG) hero toggles — show the site's own screenshot / logo.
  { key: "og_tampilkan_screenshot", value: true },
  { key: "og_tampilkan_logo", value: true },
];
