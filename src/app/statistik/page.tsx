import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
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
    <PageShell>
      <h1
        className="font-display text-3xl font-bold text-tinta sm:text-4xl"
        style={{ fontStretch: "125%" }}
      >
        Statistik
      </h1>
      <p className="mt-2 text-tinta-redup">Angka publik, bersumber data first-party.</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <StatTile label="Sponsor aktif" value={String(s.sponsor)} />
        <StatTile label="Klik terkirim" value={String(s.klikTerkirim)} />
        <StatTile label="Total pegangan dibayar" value={formatRupiah(s.totalPegangan)} />
        <StatTile label="Hari diarsipkan" value={String(s.hariDiarsip)} />
      </div>
    </PageShell>
  );
}
