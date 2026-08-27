import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = { title: "Kebijakan Privasi — Panjat" };

// PageShell fetches categories for the site-wide Manjat modal → render per request.
export const dynamic = "force-dynamic";

// Draft aligned with UU PDP (§18.7). Requires legal review before public launch.
export default function PrivasiPage() {
  return (
    <PageShell>
      <h1
        className="font-display text-3xl font-bold text-tinta sm:text-4xl"
        style={{ fontStretch: "125%" }}
      >
        Kebijakan Privasi
      </h1>
      <div className="mt-4 flex max-w-xl flex-col gap-3 text-sm text-tinta-redup">
        <p><span className="text-tinta">Data yang kami simpan.</span> Kontak sponsor (email/WA) untuk dasbor & notifikasi; hash IP klik bersalt (bukan IP mentah); cookie anonim tanpa data pribadi untuk fitur penonton.</p>
        <p><span className="text-tinta">Berapa lama.</span> Klik mentah 13 bulan lalu dihapus (agregat harian permanen). Log notifikasi 6 bulan. Data transaksi mengikuti kewajiban pajak/audit.</p>
        <p><span className="text-tinta">Hakmu.</span> Kamu bisa berhenti berlangganan notifikasi kapan saja, dan meminta penghapusan data kontak.</p>
        <p className="text-xs">Draf — menunggu tinjauan hukum sebelum peluncuran publik.</p>
      </div>
    </PageShell>
  );
}
