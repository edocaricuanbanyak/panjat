/** Clear 3-step explanation (R20-b). The mechanic in ten seconds. */
export function CaraMain() {
  const steps: [string, string, string][] = [
    ["1", "Tempel link produkmu", "Judul, deskripsi, dan kategori terisi otomatis."],
    ["2", "Pilih posisi & bayar", "Sistem yang menghitung rupiahnya. Bayar lewat QRIS/e-wallet."],
    ["3", "Naik — lalu merosot", "Tiangnya licin, semua turun pelan. Manjat lagi kalau mau bertahan."],
  ];
  return (
    <ol className="mt-6 grid gap-3 sm:grid-cols-3">
      {steps.map(([n, judul, ket]) => (
        <li key={n} className="rounded-lg border border-garis bg-kertas-1 p-3">
          <span className="grid size-6 place-items-center rounded-full bg-merah font-mono text-xs text-kertas-1">
            {n}
          </span>
          <p className="mt-2 font-display font-semibold text-tinta">{judul}</p>
          <p className="mt-0.5 text-xs text-tinta-redup">{ket}</p>
        </li>
      ))}
    </ol>
  );
}
