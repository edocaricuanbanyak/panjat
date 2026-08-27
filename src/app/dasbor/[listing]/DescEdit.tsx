"use client";

import { useState } from "react";
import { Button } from "@/components/Button";

export function DescEdit({ listingId, initial }: { listingId: string; initial: string }) {
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function save() {
    setStatus("saving");
    setMsg("");
    try {
      const res = await fetch(`/api/dasbor/${listingId}/deskripsi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deskripsi: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal");
      setStatus("saved");
    } catch (e) {
      setStatus("error");
      setMsg(e instanceof Error ? e.message : "Gagal");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={value}
        maxLength={160}
        rows={2}
        onChange={(e) => {
          setValue(e.target.value);
          setStatus("idle");
        }}
        className="w-full rounded-md border border-garis bg-kertas-1 p-2 text-base text-tinta focus-visible:outline-2 focus-visible:outline-merah"
      />
      <div className="flex items-center gap-3">
        <Button size="sm" disabled={status === "saving"} onClick={save}>
          {status === "saving" ? "Menyimpan…" : "Simpan deskripsi"}
        </Button>
        <span className="font-mono text-xs text-tinta-redup">{value.length}/160</span>
        {status === "saved" && <span className="text-xs text-tinta-redup">Tersimpan ✓</span>}
        {status === "error" && <span className="text-xs text-galat">{msg}</span>}
      </div>
      <p className="text-xs text-tinta-redup">URL tidak bisa diubah. Maks 2× ubah / 24 jam.</p>
    </div>
  );
}
