"use client";

import { useState } from "react";
import { PasangGratisForm } from "@/app/pasang-gratis/PasangGratisForm";
import { Modal } from "./Modal";

type Kategori = { slug: string; nama: string };

/**
 * "Pasang gratis" as a modal (no page navigation), on the standard Modal shell.
 * The /pasang-gratis page stays as a shareable fallback.
 */
export function PasangGratisModal({
  kategori,
  className,
}: {
  kategori: Kategori[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className ?? "text-merah-teks hover:underline"}
      >
        Pasang gratis di Kaki Tiang
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Pasang gratis">
        <p className="mb-4 text-sm text-tinta-redup">
          Listing gratis di Kaki Tiang, diurut dukungan pengunjung.
        </p>
        <PasangGratisForm kategori={kategori} />
      </Modal>
    </>
  );
}
