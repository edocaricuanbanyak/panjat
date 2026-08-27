/** The mechanic in ten seconds (R20-b) — editorial, three quiet steps. */
export function CaraMain() {
  const steps: [string, string, string][] = [
    ["1", "Tempel link produkmu", "Judul, deskripsi, dan kategori terisi otomatis."],
    ["2", "Pilih posisi & bayar", "Sistem yang menghitung rupiahnya. Bayar lewat QRIS/e-wallet."],
    ["3", "Naik — lalu merosot", "Tiangnya licin, semua turun pelan. Manjat lagi kalau mau bertahan."],
  ];
  return (
    <ol className="grid gap-3 sm:grid-cols-3">
      {steps.map(([n, judul, ket]) => (
        <li
          key={n}
          className="rounded-xl border border-garis bg-kertas-1 p-4 shadow-kartu transition-transform ease-panjat hover:-translate-y-0.5"
        >
          <span
            className="grid size-9 place-items-center rounded-full bg-merah/10 font-display text-lg font-bold text-merah"
            style={{ fontStretch: "120%" }}
          >
            {n}
          </span>
          <p className="mt-3 font-display font-semibold text-tinta">{judul}</p>
          <p className="mt-1 text-sm text-tinta-redup">{ket}</p>
        </li>
      ))}
    </ol>
  );
}
