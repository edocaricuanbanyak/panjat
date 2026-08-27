import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { db } from "@/db";
import { loadRosotConfig } from "@/domain/config";
import { formatRupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Aturan — Panjat",
  description: "Bagaimana tiang licin bekerja: laju rosot per posisi, contoh angka, dan kebijakan.",
};

export default async function AturanPage() {
  const cfg = await loadRosotConfig(db);
  const tiers: [string, number][] = [
    ["#1 (puncak)", cfg.lajuRosot.r1],
    ["#2–3", cfg.lajuRosot.r2_3],
    ["#4–10", cfg.lajuRosot.r4_10],
    ["#11–30", cfg.lajuRosot.r11_30],
    ["#31 ke bawah", cfg.lajuRosot.r31plus],
    [`Pegangan ≤ ${formatRupiah(cfg.kakiTiang)} (Kaki Tiang)`, 0],
  ];

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <Nav active="papan" />
      <h1 className="font-display text-2xl font-bold text-tinta" style={{ fontStretch: "120%" }}>
        Aturan
      </h1>
      <p className="mt-2 text-sm text-tinta-redup">
        Kamu bayar untuk manjat. Pegangan paling kuat duduk paling atas. Tiangnya licin — semua
        merosot pelan-pelan. Manjat lagi kalau mau bertahan.
      </p>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-tinta">Seberapa licin? (laju rosot per hari)</h2>
        <div className="overflow-hidden rounded-lg border border-garis">
          <table className="w-full text-sm">
            <thead className="bg-kertas-2 text-tinta-redup">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Posisi</th>
                <th className="px-3 py-2 text-right font-medium">Rosot / hari</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map(([label, rate]) => (
                <tr key={label} className="border-t border-garis bg-kertas-1">
                  <td className="px-3 py-2 text-tinta">{label}</td>
                  <td className="px-3 py-2 text-right font-mono tabular text-tinta">
                    {Math.round(rate * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 font-mono text-xs text-tinta-redup">
          Contoh: pegangan {formatRupiah(100_000)} di #1 → merosot {formatRupiah(25_000)}/hari. Berhenti
          manjat, dalam ~5 hari tinggal ~{formatRupiah(24_000)}. Papan pulih sendiri.
        </p>
      </section>

      <section className="mt-6 flex flex-col gap-2 text-sm text-tinta-redup">
        <p>
          <span className="text-tinta">Peringkat murni ditentukan pegangan.</span> Tidak ada algoritma
          tersembunyi, dan tidak ada posisi yang dijual di luar sistem.
        </p>
        <p>
          <span className="text-tinta">Tidak ada refund</span> untuk pegangan yang sudah dibayar, kecuali
          listing ditolak moderasi (dana kembali penuh).
        </p>
        <p>
          Rosot dihitung server-side tiap jam. Pegangan berhenti merosot di {formatRupiah(cfg.kakiTiang)}{" "}
          (Kaki Tiang) dan listing tidak pernah dihapus karena merosot.
        </p>
      </section>

      <Footer />
    </main>
  );
}
