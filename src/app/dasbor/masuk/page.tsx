import { MasukForm } from "./MasukForm";

export const dynamic = "force-dynamic";

export default async function MasukPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const { e } = await searchParams;
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <h1 className="font-display text-2xl font-bold text-tinta" style={{ fontStretch: "120%" }}>
        Masuk dasbor
      </h1>
      <p className="mt-1 mb-6 text-sm text-tinta-redup">
        Pantau pegangan, klik, dan CPC listing kamu.
      </p>
      {e === "kadaluarsa" && (
        <p className="mb-4 rounded-md border border-merah/40 bg-merah/10 px-3 py-2 text-sm text-merah">
          Tautan tidak valid atau kedaluwarsa. Minta tautan baru.
        </p>
      )}
      <MasukForm />
      <a href="/" className="mt-6 text-sm text-tinta-redup hover:text-tinta">
        ← Papan
      </a>
    </main>
  );
}
