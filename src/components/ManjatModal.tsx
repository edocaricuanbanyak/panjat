"use client";

import { createContext, useContext, useState } from "react";
import { ManjatWizard } from "@/app/manjat/ManjatWizard";
import { track } from "@/lib/analytics";
import { copy } from "@/copy";
import { buttonClasses, type ButtonSize, type ButtonVariant } from "./Button";
import { Modal } from "./Modal";

type Kategori = { slug: string; nama: string };

interface OpenOpts {
  url?: string;
  kategoriSlug?: string;
  /** Jump straight to the position+pay step (front-page express flow). */
  express?: boolean;
  /** Salip: pre-fill the nominal target with the cost to overtake. */
  nominal?: number;
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

  return (
    <Ctx.Provider
      value={{
        open: (o) => {
          track("manjat_dimulai", { express: o?.express ?? false });
          setState({
            url: o?.url ?? "",
            kategoriSlug: o?.kategoriSlug ?? "",
            express: o?.express ?? false,
            nominal: o?.nominal ?? 0,
          });
        },
      }}
    >
      {children}
      <Modal open={state !== null} onClose={() => setState(null)} title={copy.manjat.judul}>
        {state && (
          <ManjatWizard
            initialUrl={state.url}
            initialKategori={state.kategoriSlug}
            initialNominal={state.nominal}
            express={state.express}
            kategori={kategori}
            inModal
          />
        )}
      </Modal>
    </Ctx.Provider>
  );
}

/** Trigger that opens the manjat modal (optionally prefilled with a URL). */
export function ManjatButton({
  url,
  nominal,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  url?: string;
  /** Salip: pre-fill the position step with this nominal (cost to overtake). */
  nominal?: number;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}) {
  const { open } = useManjat();
  // A known URL (hero) jumps straight to the position+pay step. Salip passes only
  // a nominal (no URL) so it starts at step 1 — you enter YOUR listing, then land
  // above the picked rank at that nominal.
  return (
    <button
      onClick={() => open({ url, nominal, express: Boolean(url) })}
      className={`${buttonClasses(variant, size)} ${className ?? ""}`}
    >
      {children}
    </button>
  );
}
