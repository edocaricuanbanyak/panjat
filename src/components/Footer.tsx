/** Site footer — honesty & transparency links (R9, R22). */
export function Footer() {
  const link = (href: string, label: string) => (
    <a href={href} className="text-tinta-redup hover:text-tinta">
      {label}
    </a>
  );
  return (
    <footer className="mt-10 flex flex-wrap gap-x-4 gap-y-2 border-t border-garis pt-4 text-xs">
      {link("/aturan", "Aturan")}
      {link("/arsip", "Arsip Juara")}
      {link("/statistik", "Statistik")}
      {link("/jelajah", "Jelajah")}
      {link("/privasi", "Privasi")}
      {link("/ketentuan", "Ketentuan")}
    </footer>
  );
}
