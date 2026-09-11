"use client";

import { X } from "lucide-react";
import { useState } from "react";

/** Cookie the server reads to skip re-rendering the banner once handled. */
const DISMISS_COOKIE = "panjat_alt_dismiss";

/**
 * Dismissible banner suggesting the sibling board (the other currency/market on
 * its own domain). A *suggestion*, never a redirect — crawlers and users who
 * ignore it see the normal page. On dismiss OR click-through it drops a 90-day
 * cookie so the server (PageShell) won't render it again. Text (`note`/`label`)
 * comes from env in the target board's language; only the dismiss control uses
 * the current deck. `merah` stays reserved — the CTA is `merah-teks` (a link),
 * not a filled button.
 */
export function GeoSuggest({
  url,
  label,
  note,
  dismissLabel,
}: {
  url: string;
  label: string;
  note: string;
  dismissLabel: string;
}) {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  const remember = () => {
    document.cookie = `${DISMISS_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 90}; samesite=lax`;
  };

  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-garis bg-kertas-2 px-3.5 py-2.5 text-sm">
      {/* Always flex-1 (even when empty) so the CTA + close sit right-aligned. */}
      <span className="min-w-0 flex-1 text-tinta-redup">{note}</span>
      <a
        href={url}
        onClick={remember}
        className="shrink-0 font-medium text-merah-teks hover:underline"
      >
        {label} →
      </a>
      <button
        type="button"
        aria-label={dismissLabel}
        onClick={() => {
          remember();
          setOpen(false);
        }}
        className="shrink-0 rounded-full p-1 text-tinta-redup transition-colors hover:bg-kertas-1 hover:text-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-merah"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
