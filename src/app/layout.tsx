import type { Metadata } from "next";
import { Anybody, Instrument_Sans, Martian_Mono } from "next/font/google";
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
  title: "Panjat — papan peringkat berbayar",
  description:
    "Bayar untuk manjat. Pegangan paling kuat duduk paling atas. Tiangnya licin — yang berhenti manjat, merosot.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${anybody.variable} ${instrumentSans.variable} ${martianMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-kertas text-tinta">{children}</body>
    </html>
  );
}
