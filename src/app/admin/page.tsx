import { CheckCircle2 } from "lucide-react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LogoTile } from "@/components/LogoTile";
import { PageShell } from "@/components/PageShell";
import { copy } from "@/copy";
import { db } from "@/db";
import { getModerationQueue } from "@/domain/admin";
import { getLaporanTerbuka } from "@/domain/laporan";
import { formatRupiah } from "@/lib/format";
import { adminLogin, currentAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-merah";
const approveBtn =
  `h-9 rounded-lg bg-tinta px-3.5 text-sm font-medium text-kertas-1 shadow-kartu transition hover:brightness-110 ${focusRing}`;
const dangerBtn =
  `h-9 rounded-lg border border-galat/50 px-3.5 text-sm font-medium text-galat transition hover:bg-galat/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-galat`;
const neutralBtn =
  `h-9 rounded-lg border border-garis px-3.5 text-sm text-tinta-redup transition hover:bg-kertas-2 ${focusRing}`;

export default async function AdminPage() {
  if (!(await currentAdmin())) redirect(adminLogin((await headers()).get("host")));
  const [queue, laporan] = await Promise.all([getModerationQueue(db), getLaporanTerbuka(db)]);

  return (
    <PageShell>
      <div className="flex items-end justify-between">
        <h1
          className="font-display text-3xl font-bold text-tinta sm:text-4xl"
          style={{ fontStretch: "125%" }}
        >
          {copy.admin.judulAntrean}
        </h1>
        <form action="/api/admin/keluar" method="post">
          <button className="text-sm text-tinta-redup hover:text-tinta">{copy.admin.keluar}</button>
        </form>
      </div>
      <p className="mt-2 text-tinta-redup">{copy.admin.menunggu(queue.length)}</p>

      {queue.length === 0 ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-tinta-redup">
          <CheckCircle2 className="size-4 text-hidup" aria-hidden /> {copy.admin.kosong}
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {queue.map((q) => (
            <li key={q.id} className="rounded-xl border border-garis bg-kertas-1 p-4 shadow-kartu">
              <div className="flex items-center gap-3">
                <LogoTile nama={q.nama} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display font-semibold text-tinta">{q.nama}</p>
                  <p className="tabular text-xs text-tinta-redup">
                    {q.urlNormal} · {formatRupiah(q.pegangan)}
                  </p>
                </div>
              </div>
              {q.deskripsi && <p className="mt-2 text-sm text-tinta-redup">{q.deskripsi}</p>}
              {q.alasan && <p className="mt-1 text-xs text-galat">{copy.admin.alasan(q.alasan)}</p>}
              <div className="mt-3 flex gap-2">
                <form action={`/api/admin/${q.id}/moderasi`} method="post">
                  <input type="hidden" name="aksi" value="approve" />
                  <button className={approveBtn}>{copy.admin.loloskan}</button>
                </form>
                <form action={`/api/admin/${q.id}/moderasi`} method="post">
                  <input type="hidden" name="aksi" value="reject" />
                  <button className={dangerBtn}>{copy.admin.tolak}</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-10 font-display text-lg font-semibold text-tinta">
        {copy.admin.laporanJudul(laporan.length)}
      </h2>
      {laporan.length === 0 ? (
        <p className="mt-2 text-sm text-tinta-redup">{copy.admin.tidakAdaLaporan}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {laporan.map((r) => (
            <li key={r.id} className="rounded-xl border border-garis bg-kertas-1 p-4 shadow-kartu">
              <p className="tabular text-xs text-tinta-redup">
                {r.jenis === "klaim" ? copy.admin.klaimUrl : copy.admin.laporan} ·{" "}
                <a href={`/l/${r.listingId}`} className="hover:text-tinta">{r.nama}</a> ({r.urlNormal})
              </p>
              {r.pesan && <p className="mt-1 text-sm text-tinta">{r.pesan}</p>}
              {r.kontak && <p className="text-xs text-tinta-redup">Kontak: {r.kontak}</p>}
              <div className="mt-3 flex gap-2">
                <form action={`/api/admin/${r.listingId}/moderasi`} method="post">
                  <input type="hidden" name="aksi" value="turunkan" />
                  <button className={dangerBtn}>{copy.admin.turunkan}</button>
                </form>
                <form action={`/api/admin/laporan/${r.id}`} method="post">
                  <button className={neutralBtn}>{copy.admin.tutupLaporan}</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}

