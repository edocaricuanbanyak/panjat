import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { copy } from "@/copy";
import { db } from "@/db";
import { loadRosotConfig } from "@/domain/config";
import { formatRupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: copy.aturan.metaTitle,
  description: copy.aturan.metaDesc,
};

export default async function AturanPage() {
  const cfg = await loadRosotConfig(db);
  const tiers: [string, number][] = [
    [copy.aturan.tierR1, cfg.lajuRosot.r1],
    [copy.aturan.tierR2_3, cfg.lajuRosot.r2_3],
    [copy.aturan.tierR4_10, cfg.lajuRosot.r4_10],
    [copy.aturan.tierR11_30, cfg.lajuRosot.r11_30],
    [copy.aturan.tierR31, cfg.lajuRosot.r31plus],
    [copy.aturan.tierKaki(formatRupiah(cfg.kakiTiang)), 0],
  ];

  return (
    <PageShell>
      <h1
        className="font-display text-3xl font-bold text-tinta sm:text-4xl"
        style={{ fontStretch: "125%" }}
      >
        {copy.aturan.judul}
      </h1>
      <p className="mt-2 max-w-xl text-tinta-redup">{copy.aturan.intro}</p>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-tinta">{copy.aturan.tabelJudul}</h2>
        <div className="overflow-hidden rounded-lg border border-garis">
          <table className="w-full text-sm">
            <thead className="bg-kertas-2 text-tinta-redup">
              <tr>
                <th className="px-3 py-2 text-left font-medium">{copy.aturan.kolomPosisi}</th>
                <th className="px-3 py-2 text-right font-medium">{copy.aturan.kolomRosot}</th>
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
          {copy.aturan.contoh(formatRupiah(100_000), formatRupiah(25_000), formatRupiah(24_000))}
        </p>
      </section>

      <section className="mt-6 flex flex-col gap-2 text-sm text-tinta-redup">
        <p>
          <span className="text-tinta">{copy.aturan.peringkatTebal}</span>
          {copy.aturan.peringkatSisa}
        </p>
        <p>
          <span className="text-tinta">{copy.aturan.refundTebal}</span>
          {copy.aturan.refundSisa}
        </p>
        <p>{copy.aturan.rosotServer(formatRupiah(cfg.kakiTiang))}</p>
      </section>
    </PageShell>
  );
}
