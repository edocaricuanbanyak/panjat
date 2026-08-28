import type { Metadata, Viewport } from "next";
import { Martian_Mono, Plus_Jakarta_Sans, Poppins } from "next/font/google";
import Script from "next/script";
import { PostHogProvider } from "@/components/PostHogProvider";
import { copy } from "@/copy";
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
  title: `${copy.merek.nama} — ${copy.merek.tagline}`,
  description: copy.merek.deskripsiSitus,
  applicationName: copy.merek.nama,
  appleWebApp: {
    capable: true,
    title: copy.merek.nama,
    statusBarStyle: "default",
  },
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
            process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ?? "1ccddccf-7d34-432b-84e6-e46903b2acf3"
          }
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
