"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

/**
 * The one modal shell for the whole app — glass overlay, centered paper panel,
 * Escape + backdrop close, scroll lock. Pass `title` to get the standard header
 * with a Tutup button; omit it (bare) when the content renders its own chrome
 * (e.g. the Manjat wizard).
 */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center kaca-overlay sm:items-center sm:p-4"
      onClick={onClose}
    >
      {/* Native-style bottom sheet on mobile (slides up, rounded top, drag
          handle); a centered card on sm+. */}
      <div
        className="sheet-in flex max-h-[92vh] w-full flex-col overflow-y-auto rounded-t-2xl border border-garis/80 bg-kertas p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-naik sm:max-h-[86vh] sm:max-w-md sm:rounded-2xl sm:pb-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 shrink-0 rounded-full bg-garis sm:hidden" aria-hidden />
        {title && (
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-tinta" style={{ fontStretch: "120%" }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-md text-sm text-tinta-redup hover:text-tinta focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-merah"
            >
              <X className="size-4" aria-hidden /> Tutup
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
