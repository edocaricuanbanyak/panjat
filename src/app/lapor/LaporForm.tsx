"use client";

import { useState } from "react";
import { buttonClasses } from "@/components/Button";
import { Dropdown } from "@/components/Dropdown";
import { Input, textareaClasses } from "@/components/Input";
import { copy } from "@/copy";

/**
 * Report / claim form. A native POST to /api/lapor (keeps the 303 → /l/[id]?lapor=ok
 * success flow), with the standard field primitives. The Dropdown is controlled, so a
 * hidden input carries "jenis" into the native submit.
 */
export function LaporForm({ listingId }: { listingId: string }) {
  const [jenis, setJenis] = useState("lapor");

  return (
    <form action="/api/lapor" method="post" className="flex flex-col gap-3">
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name="jenis" value={jenis} />

      <Dropdown
        label={copy.lapor.jenis}
        value={jenis}
        onChange={setJenis}
        options={[
          { value: "lapor", label: copy.lapor.jenisLapor },
          { value: "klaim", label: copy.lapor.jenisKlaim },
        ]}
      />

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-tinta-redup">{copy.lapor.pesan}</span>
        <textarea
          name="pesan"
          rows={4}
          placeholder={copy.lapor.pesanPlaceholder}
          className={textareaClasses}
        />
      </label>

      <Input label={copy.lapor.kontak} name="kontak" placeholder={copy.lapor.kontakPlaceholder} />

      <button className={buttonClasses("primary", "md")}>{copy.lapor.kirim}</button>
    </form>
  );
}
