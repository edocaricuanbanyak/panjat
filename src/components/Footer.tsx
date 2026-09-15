import { copy } from "@/copy";
import { MARKET } from "@/lib/market";

/** Site footer — honesty & transparency links (R9, R22). */
export function Footer() {
  const alt = MARKET.altBoard;
  // Persistent board switcher: always available so a visitor can override the geo
  // auto-redirect. `?stay=1` pins the target board (its middleware won't bounce
  // them back). Only rendered when a sibling board is configured.
  const altHref = alt ? `${alt.url}${alt.url.includes("?") ? "&" : "?"}stay=1` : null;
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
      {alt && altHref && (
        <a href={altHref} className="ml-auto font-medium text-merah-teks hover:underline">
          {alt.label} →
        </a>
      )}
    </footer>
  );
}
