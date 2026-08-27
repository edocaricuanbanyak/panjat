"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Dropdown } from "@/components/Dropdown";
import { Input } from "@/components/Input";

type Kategori = { slug: string; nama: string };

/** Free listing: URL only required; judul/deskripsi/kategori auto-filled (R16). */
export function PasangGratisForm({ kategori }: { kategori: Kategori[] }) {
  const [url, setUrl] = useState("");
  const [nama, setNama] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [kategoriSlug, setKategoriSlug] = useState("");
  const [email, setEmail] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function prefill() {
    if (!url.trim()) return;
    setPreviewing(true);
    try {
      const res = await fetch(`/api/preview?url=${encodeURIComponent(url)}`);
      if (!res.ok) return;
      const p = await res.json();
      setNama((n) => n || p.nama || "");
      setDeskripsi((d) => d || p.deskripsi || "");
      if (p.kategoriSlug) setKategoriSlug((k) => k || p.kategoriSlug);
    } catch {
      /* best-effort */
    } finally {
      setPreviewing(false);
    }
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/pasang-gratis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          nama: nama || undefined,
          deskripsi: deskripsi || undefined,
          kategoriSlug: kategoriSlug || undefined,
          email: email || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal");
      window.location.href = `/l/${data.listingId}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-md border border-galat/40 bg-galat/10 px-3 py-2 text-sm text-galat">{error}</p>
      )}

      <Input
        label="URL atau @username"
        placeholder="produkku.id"
        hint={previewing ? "Mengambil detail…" : "Cukup tempel URL — sisanya kami isi otomatis."}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onBlur={prefill}
      />

      <details className="rounded-xl border border-garis bg-kertas-1 p-4 shadow-kartu" open>
        <summary className="cursor-pointer text-sm font-medium text-tinta-redup">
          Detail (terisi otomatis)
        </summary>
        <div className="mt-3 flex flex-col gap-3">
          <Input label="Judul" placeholder="Produkku" value={nama} onChange={(e) => setNama(e.target.value)} />
          <Dropdown
            label="Kategori"
            placeholder="—"
            value={kategoriSlug}
            onChange={setKategoriSlug}
            options={kategori.map((k) => ({ value: k.slug, label: k.nama }))}
          />
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-tinta-redup">Deskripsi (160 kar.)</span>
            <textarea
              value={deskripsi}
              maxLength={160}
              rows={2}
              onChange={(e) => setDeskripsi(e.target.value)}
              className="w-full rounded-lg border border-garis bg-kertas-1 p-2.5 text-base text-tinta shadow-kartu focus-visible:border-merah focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-merah/25"
            />
          </label>
        </div>
      </details>

      <Input
        label="Email (opsional)"
        type="email"
        placeholder="kamu@email.com"
        hint="Isi kalau mau kelola listing nanti."
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <Button disabled={!url.trim() || submitting} onClick={submit}>
        {submitting ? "Memproses…" : "Pasang di Kaki Tiang"}
      </Button>
    </div>
  );
}
