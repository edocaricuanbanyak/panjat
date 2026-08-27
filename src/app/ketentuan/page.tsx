import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = { title: "Syarat & Ketentuan — Panjat" };

// Draft (§18.7). Requires legal review before public launch.
export default function KetentuanPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <Nav active="papan" />
      <h1 className="font-display text-2xl font-bold text-tinta" style={{ fontStretch: "120%" }}>
        Syarat & Ketentuan
      </h1>
      <div className="mt-4 flex flex-col gap-3 text-sm text-tinta-redup">
        <p><span className="text-tinta">Pegangan & refund.</span> Peringkat ditentukan pegangan; tidak ada refund untuk pegangan berjalan, kecuali listing ditolak moderasi (dana kembali penuh). Lihat <a href="/aturan" className="text-merah hover:underline">Aturan</a>.</p>
        <p><span className="text-tinta">Moderasi & konten.</span> Konten judi/slot, dewasa, pinjol ilegal, dan penipuan ditolak. Kami dapat menahan atau menurunkan listing yang melanggar.</p>
        <p><span className="text-tinta">Kepemilikan URL.</span> Pemilik sah sebuah URL berhak mengklaim atau meminta penurunan listing atas URL-nya (verifikasi diperlukan).</p>
        <p><span className="text-tinta">Tanggung jawab.</span> Panjat tidak bertanggung jawab atas konten atau produk pihak sponsor.</p>
        <p className="text-xs">Draf — menunggu tinjauan hukum sebelum peluncuran publik.</p>
      </div>
      <Footer />
    </main>
  );
}
