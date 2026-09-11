import { copy } from "@/copy";
import { MARKET } from "@/lib/market";
import { BASE_URL } from "@/lib/site";

/**
 * Schema.org JSON-LD builders. These describe the board so search engines can
 * render rich results (ItemList leaderboard, sitelinks search box, breadcrumbs).
 *
 * Structured data is descriptive only — it never asserts a ranking the board
 * itself doesn't already show. Order here mirrors `pegangan` desc (§5), so it
 * can't invent a "hidden algorithm" signal.
 */

const abs = (path: string) => `${BASE_URL}${path}`;

/** Shared publisher/brand node, referenced by the WebSite/ItemList graphs. */
const organization = {
  "@type": "Organization",
  name: copy.merek.nama,
  url: BASE_URL,
  logo: abs("/icon.svg"),
};

/** Home: WebSite + a SearchAction pointing at the real /jelajah?q= endpoint. */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: copy.merek.nama,
    url: BASE_URL,
    description: copy.merek.deskripsiSitus,
    inLanguage: MARKET.locale,
    publisher: organization,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: abs("/jelajah?q={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/** A leaderboard as an ordered ItemList — position mirrors the board rank. */
export function boardItemListJsonLd(
  name: string,
  entries: { id: string; nama: string; rank: number }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    numberOfItems: entries.length,
    itemListElement: entries.map((e) => ({
      "@type": "ListItem",
      position: e.rank,
      url: abs(`/l/${e.id}`),
      name: e.nama,
    })),
  };
}

/**
 * A plain ordered ItemList (no rank-order claim) — for Jelajah/category
 * directories, whose order is relevance/clicks, never money (R22). Position is
 * list index only, so it never reads as a bought ranking.
 */
export function directoryItemListJsonLd(
  name: string,
  items: { id: string; nama: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: abs(`/l/${it.id}`),
      name: it.nama,
    })),
  };
}

/** Breadcrumb trail. Paths are site-relative; names come from the copy deck. */
export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      item: abs(t.path),
    })),
  };
}

/** A listed site as an Organization (its own URL, not the board's). */
export function listingOrgJsonLd(l: {
  id: string;
  nama: string;
  urlNormal: string;
  deskripsi: string | null;
}) {
  // `urlNormal` is stored scheme-less (e.g. "areacuan.id"); schema.org `url`
  // must be absolute. Prepend https:// when no http/https scheme is present.
  const url = /^https?:\/\//i.test(l.urlNormal) ? l.urlNormal : `https://${l.urlNormal}`;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: l.nama,
    url,
    image: abs(`/api/og/${l.id}`),
    ...(l.deskripsi ? { description: l.deskripsi } : {}),
  };
}
