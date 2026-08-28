import type { Metadata, Viewport } from "next";
import { Martian_Mono, Plus_Jakarta_Sans, Poppins } from "next/font/google";
import Script from "next/script";
import { PostHogProvider } from "@/components/PostHogProvider";
import { copy } from "@/copy";
import { BASE_URL } from "@/lib/site";
import "./globals.css";

// Headings.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
// Body / content / caption.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});
// Numbers / tabular data.
const martianMono = Martian_Mono({
  variable: "--font-martian-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: `${copy.merek.nama} — ${copy.merek.tagline}`,
  description: copy.merek.deskripsiSitus,
  applicationName: copy.merek.nama,
  appleWebApp: {
    capable: true,
    title: copy.merek.nama,
    statusBarStyle: "default",
  },
  // og:image / twitter:image are auto-added by src/app/opengraph-image.tsx.
  openGraph: {
    type: "website",
    siteName: copy.merek.nama,
    title: `${copy.merek.nama} — ${copy.merek.tagline}`,
    description: copy.merek.deskripsiSitus,
    url: "/",
    locale: "id_ID",
  },
  twitter: {
    card: "summary_large_image",
    title: `${copy.merek.nama} — ${copy.merek.tagline}`,
    description: copy.merek.deskripsiSitus,
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
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${poppins.variable} ${jakarta.variable} ${martianMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-kertas text-tinta">
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
      </body>
    </html>
  );
}
