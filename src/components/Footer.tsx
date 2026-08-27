/** Site footer — honesty & transparency links (R9, R22). */
export function Footer() {
  const link = (href: string, label: string) => (
    <a href={href} className="text-tinta-redup hover:text-tinta">
      {label}
    </a>
  );
  return (
    <footer className="mt-14 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-garis pt-5 text-xs">
      <span className="font-display font-semibold text-tinta" style={{ fontStretch: "115%" }}>
        Panjat
      </span>
      {link("/aturan", "Aturan")}
      {link("/arsip", "Arsip Juara")}
      {link("/statistik", "Statistik")}
      {link("/pasang-gratis", "Pasang gratis")}
      {link("/privasi", "Privasi")}
      {link("/ketentuan", "Ketentuan")}
    </footer>
  );
}
