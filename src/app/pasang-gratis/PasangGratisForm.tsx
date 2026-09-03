"use client";

import { Check, Globe, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Dropdown } from "@/components/Dropdown";
import { fieldClasses, Input, textareaClasses } from "@/components/Input";
import { KategoriIcon } from "@/components/KategoriIcon";
import { copy } from "@/copy";

type Kategori = { slug: string; nama: string };

/** Free listing: URL only required; judul/deskripsi/kategori auto-filled (R16).
 *  Same form + behavior as the paid Manjat wizard's detail step — the only
 *  difference is there's no payment step (grip stays Rp0). */
export function PasangGratisForm({ kategori }: { kategori: Kategori[] }) {
  const [url, setUrl] = useState("");
  const [nama, setNama] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [kategoriSlug, setKategoriSlug] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kuota, setKuota] = useState<{ sisa: number; total: number } | null>(null);

  const [previewing, setPreviewing] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);
  const urlRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

  // First-come-first-served: how many free slots are left this week.
  useEffect(() => {
    fetch("/api/pasang-gratis")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setKuota({ sisa: d.sisa, total: d.total }))
      .catch(() => {});
  }, []);
  const penuh = kuota?.sisa === 0;

  // Grow the description box to fit its content (≤160 chars) so it never scrolls.
  useEffect(() => {
    const el = descRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [deskripsi]);

  function clearUrl() {
    setUrl("");
    setPrefilled(false);
    setLogoUrl(null);
    setLogoFailed(false);
    // Wipe everything the URL auto-filled too, so it's a clean start.
    setNama("");
    setDeskripsi("");
    setKategoriSlug("");
    urlRef.current?.focus();
  }

  async function prefillFromUrl() {
    if (!url.trim() || previewing) return;
    setPreviewing(true);
    setPrefilled(false);
    try {
      const res = await fetch(`/api/preview?url=${encodeURIComponent(url)}`);
      if (!res.ok) return;
      const p = await res.json();
      // Auto-fill; never overwrite what the user already typed/picked.
      setNama((n) => n || p.nama || "");
      setDeskripsi((d) => d || p.deskripsi || "");
      if (p.kategoriSlug) setKategoriSlug((k) => k || p.kategoriSlug);
      setLogoUrl(p.logoUrl ?? null);
      setLogoFailed(false);
      setPrefilled(true);
    } catch {
      /* preview is best-effort */
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
          logoUrl: logoUrl || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? copy.error.gagalProses);
      // Keep the user on the board (with a confirmation + highlight) rather than
      // an unreachable listing page — free listers have no way back to /l/{id}.
      window.location.href = `/?baru=${data.listingId}#kaki-tiang`;
    } catch (e) {
      setError(e instanceof Error ? e.message : copy.error.gagalProses);
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-xl border border-galat/40 bg-galat/10 px-3 py-2 text-sm text-galat">{error}</p>
      )}

      {kuota &&
        (penuh ? (
          <p className="rounded-xl border border-galat/40 bg-galat/10 px-3 py-2 text-sm text-galat">
            {copy.pasangGratis.penuh}
          </p>
        ) : (
          <p className="rounded-xl border border-garis bg-kertas-2 px-3 py-2 text-xs text-tinta-redup">
            {copy.pasangGratis.sisaSlot(kuota.sisa, kuota.total)}
          </p>
        ))}

      {/* Paste a link. On Enter/blur we fetch the site: the site logo lands on
          the left, a spinner on the right while it loads. */}
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-tinta-redup">
          {copy.manjat.urlLabel}
        </span>
        <div className="relative">
          <span className="absolute left-3 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center">
            {logoUrl && !logoFailed ? (
              // biome-ignore lint/performance/noImgElement: remote site logo, not a static asset
              <img
                src={logoUrl}
                alt=""
                onError={() => setLogoFailed(true)}
                className="size-6 rounded-full border border-garis bg-kertas-1 object-contain p-0.5"
              />
            ) : (
              <Globe className="size-5 text-tinta-redup" aria-hidden />
            )}
          </span>
          <input
            ref={urlRef}
            inputMode="url"
            placeholder={copy.pasangGratis.urlPlaceholder}
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setPrefilled(false);
              setLogoFailed(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                (e.target as HTMLInputElement).blur();
              }
            }}
            onBlur={prefillFromUrl}
            className={`${fieldClasses} pl-11 pr-11`}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {previewing ? (
              <Loader2 className="size-5 animate-spin text-tinta-redup" aria-hidden />
            ) : url.trim() ? (
              <button
                type="button"
                onClick={clearUrl}
                aria-label={copy.manjat.hapusUrl}
                className="group/clr flex size-8 items-center justify-center rounded-full hover:bg-kertas-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-merah"
              >
                {prefilled ? (
                  <>
                    <Check className="size-5 text-hidup group-hover/clr:hidden" aria-hidden />
                    <X className="hidden size-5 text-tinta-redup group-hover/clr:block" aria-hidden />
                  </>
                ) : (
                  <X className="size-5 text-tinta-redup" aria-hidden />
                )}
              </button>
            ) : null}
          </span>
        </div>
        {previewing && (
          <span className="mt-1 block text-xs text-merah-teks">{copy.manjat.cekLink}</span>
        )}
      </label>

      <Input
        label={copy.manjat.gambarLabel}
        type="url"
        inputMode="url"
        placeholder={copy.manjat.gambarPlaceholder}
        hint={copy.manjat.gambarHint}
        value={logoUrl ?? ""}
        onChange={(e) => {
          setLogoUrl(e.target.value || null);
          setLogoFailed(false);
        }}
      />

      {/* Prefilled from the URL, but editable — tweak before you go up. */}
      <Input
        label={copy.manjat.judulListing}
        placeholder={copy.pasangGratis.judulPlaceholder}
        value={nama}
        onChange={(e) => setNama(e.target.value)}
      />
      <Dropdown
        label={copy.manjat.kategori}
        placeholder="—"
        value={kategoriSlug}
        onChange={setKategoriSlug}
        options={kategori.map((k) => ({
          value: k.slug,
          label: k.nama,
          icon: <KategoriIcon slug={k.slug} className="size-4 shrink-0 text-tinta-redup" />,
        }))}
      />
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-tinta-redup">
          {copy.manjat.deskripsi}
        </span>
        <textarea
          ref={descRef}
          value={deskripsi}
          maxLength={160}
          rows={2}
          onChange={(e) => setDeskripsi(e.target.value)}
          style={{ resize: "none", overflow: "hidden" }}
          className={textareaClasses}
        />
        <span className="mt-1 block text-right tabular text-xs text-tinta-redup">
          {deskripsi.length}/160
        </span>
      </label>

      <Input
        label={copy.manjat.emailOpsional}
        type="email"
        placeholder={copy.manjat.emailPlaceholder}
        hint={copy.pasangGratis.emailHint}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <Button disabled={!url.trim() || submitting || penuh} onClick={submit}>
        {submitting ? copy.manjat.memproses : copy.pasangGratis.tombol}
      </Button>
    </div>
  );
}
