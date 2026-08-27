import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = { title: "Syarat & Ketentuan — Panjat" };

// PageShell fetches categories for the site-wide Manjat modal → render per request.
export const dynamic = "force-dynamic";

// Draft (§18.7). Requires legal review before public launch.
export default function KetentuanPage() {
  return (
    <PageShell>
      <h1
        className="font-display text-3xl font-bold text-tinta sm:text-4xl"
        style={{ fontStretch: "125%" }}
      >
        Syarat & Ketentuan
      </h1>
      <div className="mt-4 flex max-w-xl flex-col gap-3 text-sm text-tinta-redup">
        <p><span className="text-tinta">Pegangan & refund.</span> Peringkat ditentukan pegangan; tidak ada refund untuk pegangan berjalan, kecuali listing ditolak moderasi (dana kembali penuh). Lihat <a href="/aturan" className="text-merah-teks hover:underline">Aturan</a>.</p>
        <p><span className="text-tinta">Moderasi & konten.</span> Konten judi/slot, dewasa, pinjol ilegal, dan penipuan ditolak. Kami dapat menahan atau menurunkan listing yang melanggar.</p>
        <p><span className="text-tinta">Kepemilikan URL.</span> Pemilik sah sebuah URL berhak mengklaim atau meminta penurunan listing atas URL-nya (verifikasi diperlukan).</p>
        <p><span className="text-tinta">Tanggung jawab.</span> Panjat tidak bertanggung jawab atas konten atau produk pihak sponsor.</p>
        <p className="text-xs">Draf — menunggu tinjauan hukum sebelum peluncuran publik.</p>
      </div>
    </PageShell>
  );
}
