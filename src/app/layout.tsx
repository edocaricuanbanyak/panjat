import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Poppins } from "next/font/google";
import Script from "next/script";
import { PostHogProvider } from "@/components/PostHogProvider";
import { copy } from "@/copy";
import { MARKET } from "@/lib/market";
import { BASE_URL } from "@/lib/site";
import "./globals.css";

// Headings.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
// Body / content / caption — and numbers (tabular figures via the .tabular utility).
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

// hreflang: when a sibling board is configured, tell search engines the two
// domains are locale/region variants of each other (so geo routing doesn't read
// as cloaking and each board indexes cleanly). Sibling locale is the opposite of
// this deployment's (id <-> en).
const siblingLocale = MARKET.defaultLocale === "id" ? "en-US" : "id-ID";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: `${copy.merek.nama} — ${copy.merek.tagline}`,
  description: copy.merek.deskripsiSitus,
  applicationName: copy.merek.nama,
  ...(MARKET.altBoard
    ? {
        alternates: {
          languages: {
            [MARKET.locale]: BASE_URL,
            [siblingLocale]: MARKET.altBoard.url,
            "x-default": BASE_URL,
          },
        },
      }
    : {}),
  appleWebApp: {
    capable: true,
    title: copy.merek.nama,
    statusBarStyle: "default",
  },
  // og:image / twitter:image are auto-added by src/app/opengraph-image.tsx.
  // title/description/url are intentionally omitted from openGraph/twitter so
  // each route's own metadata flows into og:*/twitter:* — otherwise every
  // sub-page share (kategori, hari-ini, …) inherits this site-wide headline.
  // The home page falls back to the top-level title/description above.
  openGraph: {
    type: "website",
    siteName: copy.merek.nama,
    locale: MARKET.locale.replace("-", "_"), // "id-ID" -> "id_ID"
  },
  twitter: {
    card: "summary_large_image",
  },
  // Google Search Console (URL-prefix "HTML tag" method). Set the token as the
  // GOOGLE_SITE_VERIFICATION env and the <meta> appears — nudges Google to crawl,
  // which is what refreshes the Search/s2 favicon.
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

// Installed/standalone app feel: paper theme colour on the status bar, cover the
// notch (safe-area insets are then honoured in the chrome), sane zoom for a11y.
export const viewport: Viewport = {
  themeColor: "#f3f0e9",
  width: "device-width",
  initialScale: 1,
  // Explicitly allow pinch-zoom (WCAG 1.4.4). Without this a `display: standalone`
  // PWA locks zoom on iOS/Android; 5× + userScalable keeps the board readable for
  // low-vision users. Never set maximumScale:1 / userScalable:false.
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  return (
    <html
      lang={MARKET.defaultLocale}
      className={`${poppins.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-kertas text-tinta">
        {/* GTM <noscript> fallback — immediately after <body> per Google's guide. */}
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="Google Tag Manager"
            />
          </noscript>
        )}
        <PostHogProvider>{children}</PostHogProvider>
        {/* Umami — privacy-friendly (cookieless) analytics, site-wide so every
            page is tracked (not just /statistik). next/script auto-applies the
            CSP nonce; cloud.umami.is is allowlisted in script-src + connect-src
            (middleware.ts). Switch to strategy="beforeInteractive" to emit into
            <head> if physical head placement is ever required. */}
        <Script
          src="https://cloud.umami.is/script.js"
          data-website-id={
            process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ?? "c70429e3-b6c0-4f83-91d1-5239f110278d"
          }
          strategy="afterInteractive"
        />
        {/* Google Tag Manager — the single container that loads GA4 (and any other
            tags) site-wide. Configure the GA4 tag (G-QTS41C8LWG) INSIDE GTM, not here,
            so nothing double-counts. next/script applies the CSP nonce; strict-dynamic
            lets GTM load its own injected tags. googletagmanager/google-analytics are
            allowlisted in middleware.ts (script/connect/frame-src). */}
        {gtmId && (
          <Script id="gtm" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
          </Script>
        )}
      </body>
    </html>
  );
}
