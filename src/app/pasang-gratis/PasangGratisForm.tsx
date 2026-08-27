"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
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
        <p className="rounded-md border border-merah/40 bg-merah/10 px-3 py-2 text-sm text-merah">{error}</p>
      )}

      <Input
        label="URL atau @username"
        placeholder="produkku.id"
        hint={previewing ? "Mengambil detail…" : "Cukup tempel URL — sisanya kami isi otomatis."}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onBlur={prefill}
      />

      <details className="rounded-md border border-garis bg-kertas-1 p-3" open>
        <summary className="cursor-pointer text-sm text-tinta-redup">Detail (terisi otomatis)</summary>
        <div className="mt-3 flex flex-col gap-3">
          <Input label="Judul" placeholder="Produkku" value={nama} onChange={(e) => setNama(e.target.value)} />
          <label className="block">
            <span className="text-sm text-tinta-redup">Kategori</span>
            <select
              className="mt-1 h-11 w-full rounded-md border border-garis bg-kertas-1 px-3 text-base text-tinta"
              value={kategoriSlug}
              onChange={(e) => setKategoriSlug(e.target.value)}
            >
              <option value="">—</option>
              {kategori.map((k) => (
                <option key={k.slug} value={k.slug}>{k.nama}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm text-tinta-redup">Deskripsi (160 kar.)</span>
            <textarea
              value={deskripsi}
              maxLength={160}
              rows={2}
              onChange={(e) => setDeskripsi(e.target.value)}
              className="mt-1 w-full rounded-md border border-garis bg-kertas-1 p-2 text-base text-tinta"
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
