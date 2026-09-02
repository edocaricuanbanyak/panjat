"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

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
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = () =>
      panel
        ? Array.from(
            panel.querySelectorAll<HTMLElement>(
              'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])',
            ),
          ).filter((el) => el.offsetParent !== null)
        : [];

    // Focus the first control on open (content may re-focus its own field later).
    (focusables()[0] ?? panel)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      // Keep Tab within the dialog so focus can't escape to the page behind.
      const els = focusables();
      if (els.length === 0) {
        e.preventDefault();
        panel?.focus();
        return;
      }
      const first = els[0];
      const last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      // Return focus to whatever opened the modal.
      opener?.focus?.();
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
        ref={panelRef}
        tabIndex={-1}
        className="sheet-in flex max-h-[92vh] w-full flex-col overflow-y-auto rounded-t-2xl border border-garis/80 bg-kertas p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-naik outline-none sm:max-h-[86vh] sm:max-w-md sm:rounded-2xl sm:pb-5"
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
