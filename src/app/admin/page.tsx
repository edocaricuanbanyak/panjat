import { redirect } from "next/navigation";
import { LogoTile } from "@/components/LogoTile";
import { db } from "@/db";
import { getModerationQueue } from "@/domain/admin";
import { formatRupiah } from "@/lib/format";
import { currentAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

export default async function AdminPage() {
  if (!(await currentAdmin())) redirect("/admin/masuk");
  const queue = await getModerationQueue(db);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-tinta" style={{ fontStretch: "120%" }}>
          Antrean moderasi
        </h1>
        <form action="/api/admin/keluar" method="post">
          <button className="text-sm text-tinta-redup hover:text-tinta">Keluar</button>
        </form>
      </div>
      <p className="mt-1 text-sm text-tinta-redup">{queue.length} listing menunggu keputusan.</p>

      {queue.length === 0 ? (
        <p className="mt-6 text-sm text-tinta-redup">Antrean kosong. 🎉</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {queue.map((q) => (
            <li key={q.id} className="rounded-lg border border-garis bg-kertas-1 p-3">
              <div className="flex items-center gap-3">
                <LogoTile nama={q.nama} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display font-semibold text-tinta">{q.nama}</p>
                  <p className="font-mono text-xs text-tinta-redup">
                    {q.urlNormal} · {formatRupiah(q.pegangan)}
                  </p>
                </div>
              </div>
              {q.deskripsi && <p className="mt-2 text-sm text-tinta-redup">{q.deskripsi}</p>}
              {q.alasan && <p className="mt-1 text-xs text-merah">Alasan: {q.alasan}</p>}
              <div className="mt-3 flex gap-2">
                <form action={`/api/admin/${q.id}/moderasi`} method="post">
                  <input type="hidden" name="aksi" value="approve" />
                  <button className="h-9 rounded-md bg-tinta px-3 text-sm text-kertas-1">Loloskan</button>
                </form>
                <form action={`/api/admin/${q.id}/moderasi`} method="post">
                  <input type="hidden" name="aksi" value="reject" />
                  <button className="h-9 rounded-md border border-merah/40 px-3 text-sm text-merah">
                    Tolak + refund
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
