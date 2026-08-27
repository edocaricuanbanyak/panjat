/** The mechanic in ten seconds (R20-b) — editorial, three quiet steps. */
export function CaraMain() {
  const steps: [string, string, string][] = [
    ["1", "Tempel link produkmu", "Judul, deskripsi, dan kategori terisi otomatis."],
    ["2", "Pilih posisi & bayar", "Sistem yang menghitung rupiahnya. Bayar lewat QRIS/e-wallet."],
    ["3", "Naik — lalu merosot", "Tiangnya licin, semua turun pelan. Manjat lagi kalau mau bertahan."],
  ];
  return (
    <ol className="grid gap-6 sm:grid-cols-3">
      {steps.map(([n, judul, ket]) => (
        <li key={n}>
          <span
            className="font-display text-3xl font-bold text-tinta-redup/50"
            style={{ fontStretch: "125%" }}
          >
            {n}
          </span>
          <p className="mt-1 font-display font-semibold text-tinta">{judul}</p>
          <p className="mt-1 text-sm text-tinta-redup">{ket}</p>
        </li>
      ))}
    </ol>
  );
}
