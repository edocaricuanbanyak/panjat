import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { StatTile } from "@/components/StatTile";
import { db } from "@/db";
import { getStatistik } from "@/domain/statistik";
import { formatRupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Statistik — Panjat",
  description: "Angka publik Panjat: sponsor aktif, klik terkirim, pegangan total.",
};

export default async function StatistikPage() {
  const s = await getStatistik(db);
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <Nav active="papan" />
      <h1 className="font-display text-2xl font-bold text-tinta" style={{ fontStretch: "120%" }}>
        Statistik
      </h1>
      <p className="mt-1 text-sm text-tinta-redup">Angka publik, bersumber data first-party.</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <StatTile label="Sponsor aktif" value={String(s.sponsor)} />
        <StatTile label="Klik terkirim" value={String(s.klikTerkirim)} />
        <StatTile label="Total pegangan dibayar" value={formatRupiah(s.totalPegangan)} />
        <StatTile label="Hari diarsipkan" value={String(s.hariDiarsip)} />
      </div>

      <Footer />
    </main>
  );
}
