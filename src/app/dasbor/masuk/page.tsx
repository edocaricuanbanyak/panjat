import { PageShell } from "@/components/PageShell";
import { MasukForm } from "./MasukForm";

export const dynamic = "force-dynamic";

export default async function MasukPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const { e } = await searchParams;
  return (
    <PageShell>
      <div className="mx-auto max-w-sm py-10">
        <h1
          className="font-display text-3xl font-bold text-tinta sm:text-4xl"
          style={{ fontStretch: "125%" }}
        >
          Masuk dasbor
        </h1>
        <p className="mt-2 mb-6 text-tinta-redup">Pantau pegangan, klik, dan CPC listing kamu.</p>
        {e === "kadaluarsa" && (
          <p className="mb-4 rounded-lg border border-galat/40 bg-galat/10 px-3 py-2 text-sm text-galat">
            Tautan tidak valid atau kedaluwarsa. Minta tautan baru.
          </p>
        )}
        <MasukForm />
        <a href="/" className="mt-6 inline-block text-sm text-tinta-redup hover:text-tinta">
          ← Papan
        </a>
      </div>
    </PageShell>
  );
}
