"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ManjatWizard } from "@/app/manjat/ManjatWizard";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "./Button";

type Kategori = { slug: string; nama: string };

interface OpenOpts {
  url?: string;
  kategoriSlug?: string;
  /** Jump straight to the position+pay step (front-page express flow). */
  express?: boolean;
}
interface ManjatCtx {
  open: (opts?: OpenOpts) => void;
}
const Ctx = createContext<ManjatCtx>({
  // Fallback (no provider, e.g. kitchen-sink): navigate to the full page.
  open: (opts) => {
    if (typeof window !== "undefined") {
      window.location.href = opts?.url ? `/manjat?url=${encodeURIComponent(opts.url)}` : "/manjat";
    }
  },
});

export function useManjat() {
  return useContext(Ctx);
}

/**
 * Manjat/Salip as a modal (no page navigation). Wraps the board; triggers call
 * useManjat().open({url, kategoriSlug, express}) to prefill and show the wizard.
 */
export function ManjatProvider({
  kategori,
  children,
}: {
  kategori: Kategori[];
  children: React.ReactNode;
}) {
  const [state, setState] = useState<Required<OpenOpts> | null>(null);
  const openModal = state !== null;

  useEffect(() => {
    if (!openModal) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setState(null);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [openModal]);

  return (
    <Ctx.Provider
      value={{
        open: (o) =>
          setState({ url: o?.url ?? "", kategoriSlug: o?.kategoriSlug ?? "", express: o?.express ?? false }),
      }}
    >
      {children}
      {state && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 kaca-overlay sm:items-center"
          onClick={() => setState(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-garis/80 bg-kertas p-5 shadow-naik"
            onClick={(e) => e.stopPropagation()}
          >
            <ManjatWizard
              initialUrl={state.url}
              initialKategori={state.kategoriSlug}
              express={state.express}
              kategori={kategori}
              onClose={() => setState(null)}
            />
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
    <button onClick={() => open({ url })} className={`${buttonClasses(variant, size)} ${className ?? ""}`}>
      {children}
    </button>
  );
}
