import { totpEnabled } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

export default async function AdminMasuk({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams;
  const twoFactor = totpEnabled();
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <h1 className="font-display text-2xl font-bold text-tinta" style={{ fontStretch: "120%" }}>
        Admin
      </h1>
      {e && (
        <p className="mt-3 rounded-md border border-merah/40 bg-merah/10 px-3 py-2 text-sm text-merah">
          {e === "limit" ? "Terlalu banyak percobaan." : "Password salah."}
        </p>
      )}
      <form action="/api/admin/masuk" method="post" className="mt-4 flex flex-col gap-3">
        <input
          name="password"
          type="password"
          required
          placeholder="Password admin"
          className="h-11 w-full rounded-md border border-garis bg-kertas-1 px-3 text-base text-tinta"
        />
        {twoFactor && (
          <input
            name="code"
            inputMode="numeric"
            required
            placeholder="Kode 2FA (6 digit)"
            className="h-11 w-full rounded-md border border-garis bg-kertas-1 px-3 text-base text-tinta"
          />
        )}
        <button className="h-11 rounded-md bg-merah px-4 text-sm font-medium text-kertas-1">Masuk</button>
      </form>
    </main>
  );
}
