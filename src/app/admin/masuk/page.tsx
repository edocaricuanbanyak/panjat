import { PageShell } from "@/components/PageShell";
import { copy } from "@/copy";
import { totpEnabled } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

const field =
  "h-11 w-full rounded-lg border border-garis bg-kertas-1 px-3.5 text-base text-tinta shadow-kartu focus-visible:border-merah focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-merah/25";

export default async function AdminMasuk({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const { e } = await searchParams;
  const twoFactor = totpEnabled();
  return (
    <PageShell>
      <div className="mx-auto max-w-sm py-10">
        <h1
          className="font-display text-3xl font-bold text-tinta sm:text-4xl"
          style={{ fontStretch: "125%" }}
        >
          {copy.admin.masukJudul}
        </h1>
        {e && (
          <p className="mt-3 rounded-lg border border-galat/40 bg-galat/10 px-3 py-2 text-sm text-galat">
            {e === "limit" ? copy.error.terlaluBanyak : copy.error.passwordSalah}
          </p>
        )}
        <form action="/api/admin/masuk" method="post" className="mt-4 flex flex-col gap-3">
          <input name="password" type="password" required placeholder={copy.admin.passwordPlaceholder} className={field} />
          {twoFactor && (
            <input name="code" inputMode="numeric" required placeholder={copy.admin.kode2fa} className={field} />
          )}
          <button className="h-11 rounded-lg bg-merah px-4 text-sm font-medium text-kertas-1 shadow-kartu transition-all ease-panjat hover:-translate-y-px hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-merah">
            {copy.admin.masuk}
          </button>
        </form>
      </div>
    </PageShell>
  );
}
