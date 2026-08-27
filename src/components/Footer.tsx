import { copy } from "@/copy";

/** Site footer — honesty & transparency links (R9, R22). */
export function Footer() {
  return (
    <footer className="mt-14 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-garis pt-5 text-xs">
      <span className="font-display font-semibold text-tinta" style={{ fontStretch: "115%" }}>
        {copy.merek.nama}
      </span>
      {copy.footer.map(([href, label]) => (
        <a key={href} href={href} className="text-tinta-redup hover:text-tinta">
          {label}
        </a>
      ))}
    </footer>
  );
}
