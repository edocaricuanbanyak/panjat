import { buttonClasses } from "@/components/Button";

// Placeholder — the full manjat flow UI (URL preview, target slider, Snap) is a
// later slice. The money-in API already exists at POST /api/manjat.
export default function ManjatPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16 text-center">
      <h1 className="font-display text-2xl font-bold text-tinta" style={{ fontStretch: "120%" }}>
        Alur manjat segera hadir
      </h1>
      <p className="mt-2 text-sm text-tinta-redup">
        Tempel URL, pilih posisi, bayar lewat QRIS. Sementara ini alur pembayaran tersedia lewat
        API.
      </p>
      <a href="/" className={`${buttonClasses("secondary", "md")} mt-6 self-center`}>
        Kembali ke papan
      </a>
    </main>
  );
}
