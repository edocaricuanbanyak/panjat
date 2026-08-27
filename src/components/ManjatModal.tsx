"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ManjatWizard } from "@/app/manjat/ManjatWizard";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "./Button";

type Kategori = { slug: string; nama: string };

interface ManjatCtx {
  open: (url?: string) => void;
}
const Ctx = createContext<ManjatCtx>({
  // Fallback (no provider, e.g. kitchen-sink): navigate to the full page.
  open: (url) => {
    if (typeof window !== "undefined") {
      window.location.href = url ? `/manjat?url=${encodeURIComponent(url)}` : "/manjat";
    }
  },
});

export function useManjat() {
  return useContext(Ctx);
}

/**
 * Manjat/Salip as a modal (no page navigation). Wraps the board; triggers call
 * useManjat().open(url) to prefill and show the wizard in a dialog.
 */
export function ManjatProvider({
  kategori,
  children,
}: {
  kategori: Kategori[];
  children: React.ReactNode;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const openModal = url !== null;

  useEffect(() => {
    if (!openModal) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setUrl(null);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [openModal]);

  return (
    <Ctx.Provider value={{ open: (u) => setUrl(u ?? "") }}>
      {children}
      {openModal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-tinta/40 p-4 sm:items-center"
          onClick={() => setUrl(null)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-garis bg-kertas p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <ManjatWizard initialUrl={url} kategori={kategori} onClose={() => setUrl(null)} />
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

/** Trigger that opens the manjat modal (optionally prefilled with a URL). */
export function ManjatButton({
  url,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  url?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}) {
  const { open } = useManjat();
  return (
    <button onClick={() => open(url)} className={`${buttonClasses(variant, size)} ${className ?? ""}`}>
      {children}
    </button>
  );
}
