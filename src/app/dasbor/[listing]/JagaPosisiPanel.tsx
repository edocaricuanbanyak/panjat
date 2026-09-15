"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Dropdown } from "@/components/Dropdown";
import { Input } from "@/components/Input";
import { copy } from "@/copy";
import { formatMoneyInput, formatRupiah } from "@/lib/format";
import { StatusText, useTransientStatus } from "@/lib/use-status";

type Jaga = { target: string; budgetSisa: number; aktif: boolean } | null;

/** Owner opt-in for Jaga Posisi (§13.1) — target tier + budget top-up + on/off. */
export function JagaPosisiPanel({ listingId, jaga }: { listingId: string; jaga: Jaga }) {
  const [target, setTarget] = useState(jaga?.target ?? "top3");
  const [tambah, setTambah] = useState("");
  const [aktif, setAktif] = useState(jaga?.aktif ?? true);
  const [saving, setSaving] = useState(false);
  const { status, show } = useTransientStatus();

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/dasbor/${listingId}/jaga`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, tambahBudget: Number(tambah) || 0, aktif }),
      });
      if (!res.ok) throw new Error();
      show("sukses", copy.dasbor.jagaTersimpan);
      setTambah("");
    } catch {
      show("galat", copy.dasbor.jagaGagal);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-garis bg-kertas-1 p-4 shadow-kartu">
      <p className="text-sm text-tinta-redup">{copy.dasbor.jagaKet}</p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <Dropdown
          className="sm:w-40"
          label={copy.dasbor.jagaTarget}
          value={target}
          onChange={setTarget}
          options={[
            { value: "top1", label: copy.dasbor.jagaTop1 },
            { value: "top3", label: copy.dasbor.jagaTop3 },
            { value: "top10", label: copy.dasbor.jagaTop10 },
          ]}
        />
        <Input
          className="sm:w-40"
          label={copy.dasbor.jagaBudget}
          inputMode="numeric"
          placeholder="100.000"
          value={formatMoneyInput(tambah)}
          onChange={(e) => setTambah(e.target.value.replace(/\D/g, ""))}
        />
        <label className="flex h-11 items-center gap-2 text-sm text-tinta">
          <input type="checkbox" checked={aktif} onChange={(e) => setAktif(e.target.checked)} />
          {copy.dasbor.jagaAktif}
        </label>
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? copy.dasbor.jagaMenyimpan : copy.dasbor.jagaSimpan}
          </Button>
          <StatusText status={status} />
        </div>
      </div>
      {jaga && (
        <p className="mt-2 tabular text-xs text-tinta-redup">
          {copy.dasbor.jagaSisa(formatRupiah(jaga.budgetSisa))}
        </p>
      )}
    </div>
  );
}
