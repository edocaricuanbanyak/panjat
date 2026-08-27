import type { Metadata, Viewport } from "next";
import { Anybody, Instrument_Sans, Martian_Mono } from "next/font/google";
import { PostHogProvider } from "@/components/PostHogProvider";
import { copy } from "@/copy";
import "./globals.css";

// Display: variable width axis is a second data encoding (§9.6.3).
const anybody = Anybody({
  variable: "--font-anybody",
  subsets: ["latin"],
  axes: ["wdth"],
});
const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});
const martianMono = Martian_Mono({
  variable: "--font-martian-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${copy.merek.nama} — papan peringkat berbayar`,
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
      className={`${anybody.variable} ${instrumentSans.variable} ${martianMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-kertas text-tinta">
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
