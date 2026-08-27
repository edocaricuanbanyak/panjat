import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = { title: "Kebijakan Privasi — Panjat" };

// Draft aligned with UU PDP (§18.7). Requires legal review before public launch.
export default function PrivasiPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <Nav active="papan" />
      <h1 className="font-display text-2xl font-bold text-tinta" style={{ fontStretch: "120%" }}>
        Kebijakan Privasi
      </h1>
      <div className="mt-4 flex flex-col gap-3 text-sm text-tinta-redup">
        <p><span className="text-tinta">Data yang kami simpan.</span> Kontak sponsor (email/WA) untuk dasbor & notifikasi; hash IP klik bersalt (bukan IP mentah); cookie anonim tanpa data pribadi untuk fitur penonton.</p>
        <p><span className="text-tinta">Berapa lama.</span> Klik mentah 13 bulan lalu dihapus (agregat harian permanen). Log notifikasi 6 bulan. Data transaksi mengikuti kewajiban pajak/audit.</p>
        <p><span className="text-tinta">Hakmu.</span> Kamu bisa berhenti berlangganan notifikasi kapan saja, dan meminta penghapusan data kontak.</p>
        <p className="text-xs">Draf — menunggu tinjauan hukum sebelum peluncuran publik.</p>
      </div>
      <Footer />
    </main>
  );
}
