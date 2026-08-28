import type { Metadata, Viewport } from "next";
import { Martian_Mono, Plus_Jakarta_Sans, Poppins } from "next/font/google";
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
      </body>
    </html>
  );
}
