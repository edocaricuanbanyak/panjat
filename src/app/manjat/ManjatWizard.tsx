"use client";

import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Dropdown } from "@/components/Dropdown";
import { Input, textareaClasses } from "@/components/Input";
import { LogoTile } from "@/components/LogoTile";
import { copy } from "@/copy";
import type { Quote } from "@/domain/manjat";
import { formatRupiah } from "@/lib/format";

type Kategori = { slug: string; nama: string };

async function postManjat(payload: unknown) {
  const res = await fetch("/api/manjat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? copy.error.gagalProses);
  return data;
}

/** One board row in the live position preview. */
function BoardRow({
  rank,
  nama,
  rp,
  kamu,
}: {
  rank: number;
  nama: string;
  rp: number;
  kamu?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2 ${kamu ? "bg-merah/8" : ""}`}>
      <span
        className={`w-8 shrink-0 font-mono tabular text-sm font-semibold ${
          kamu ? "text-merah-teks" : "text-tinta-redup"
        }`}
      >
        #{rank}
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        <span
          className={`truncate ${kamu ? "font-display font-semibold text-tinta" : "text-sm text-tinta"}`}
        >
          {nama}
        </span>
        {kamu && (
          <span className="shrink-0 rounded bg-merah px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none text-kertas-1">
            {copy.manjat.kamuBadge}
          </span>
        )}
      </span>
      <span
        className={`shrink-0 font-mono tabular text-sm ${
          kamu ? "font-semibold text-tinta" : "text-tinta-redup"
        }`}
      >
        {formatRupiah(rp)}
      </span>
    </div>
  );
}

export function ManjatWizard({
  initialUrl,
  kategori,
  initialKategori = "",
  initialNominal = 0,
  express = false,
  inModal = false,
}: {
  initialUrl: string;
  kategori: Kategori[];
  initialKategori?: string;
  /** Salip flow: pre-select the "nominal" target at this amount (cost to overtake). */
  initialNominal?: number;
  /** Front-page flow: start at position+pay, auto-preview, pay in one step. */
  express?: boolean;
  /** Rendered inside the standard Modal (which owns the title + close). */
  inModal?: boolean;
}) {
  const [step, setStep] = useState(express ? 2 : 1);
  const [url, setUrl] = useState(initialUrl);
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [kategoriSlug, setKategoriSlug] = useState(initialKategori);
  const [deskripsi, setDeskripsi] = useState("");

  const [nominalInput, setNominalInput] = useState(initialNominal > 0 ? String(initialNominal) : "");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshQuote(payload: { nominal: number }) {
    setError(null);
    setLoadingQuote(true);
    try {
      setQuote(await postManjat(payload));
    } catch (e) {
      setError(e instanceof Error ? e.message : copy.error.gagalHitung);
    } finally {
      setLoadingQuote(false);
    }
  }

  // Open amount → auto-compute the resulting position (debounced as you type).
  useEffect(() => {
    const n = Number(nominalInput);
    if (!n) {
      setQuote(null);
      return;
    }
    const t = setTimeout(() => void refreshQuote({ nominal: n }), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nominalInput]);

  async function onPay() {
    if (!quote) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await postManjat({
        url,
        email: email || undefined,
        nominal: quote.nominal,
        nama: nama || undefined,
        kategoriSlug: kategoriSlug || undefined,
        deskripsi: deskripsi || undefined,
      });
      window.location.href = result.redirectUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : copy.error.gagalTagihan);
      setSubmitting(false);
    }
  }

  const [previewing, setPreviewing] = useState(false);
  async function prefillFromUrl() {
    if (!url.trim()) return;
    setPreviewing(true);
    try {
      const res = await fetch(`/api/preview?url=${encodeURIComponent(url)}`);
      if (!res.ok) return;
      const p = await res.json();
      // Auto-fill; never overwrite what the user already typed/picked.
      setNama((n) => n || p.nama || "");
      setDeskripsi((d) => d || p.deskripsi || "");
      if (p.kategoriSlug) setKategoriSlug((k) => k || p.kategoriSlug);
    } catch {
      /* preview is best-effort; the pay flow never waits on it */
    } finally {
      setPreviewing(false);
    }
  }

  // Auto-preview on open when a URL is already provided (Salip / express). The
  // Salip amount pre-fills nominalInput, so the debounced effect quotes it.
  useEffect(() => {
    if (initialUrl.trim()) void prefillFromUrl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only the URL is required; the rest is auto-filled and editable.
  const canStep1 = url.trim() !== "";
  const host = url.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");

  return (
    <div className="w-full">
      {/* On the /manjat page we render our own header; in the modal the shell
          owns the title + close, so we only show the step indicator. */}
      {!inModal && (
        <>
          <a href="/" className="text-sm text-tinta-redup hover:text-tinta">
            {copy.manjat.kembaliPapan}
          </a>
          <h1
            className="mt-2 font-display text-2xl font-bold text-tinta"
            style={{ fontStretch: "120%" }}
          >
            {copy.manjat.judul}
          </h1>
        </>
      )}

      {error && (
        <p className="mt-4 rounded-xl border border-galat/40 bg-galat/10 px-3 py-2 text-sm text-galat">
          {error}
        </p>
      )}

      {step === 1 && (
        <div className="mt-6 flex flex-col gap-4">
          {/* The one thing to do on this step: paste a link. Everything else is
              auto-filled and tucked away. */}
          <Input
            label={copy.manjat.urlLabel}
            placeholder={copy.manjat.urlPlaceholder}
            hint={previewing ? copy.manjat.urlHintMemuat : copy.manjat.urlHint}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={prefillFromUrl}
          />

          {/* Auto-filled from the URL — collapsed by default; open only to edit. */}
          <details className="rounded-xl border border-garis bg-kertas-1 p-3">
            <summary className="cursor-pointer select-none text-sm text-tinta-redup marker:text-tinta-redup">
              {copy.manjat.detailRingkas}
            </summary>
            <div className="mt-3 flex flex-col gap-3">
              <Input
                label={copy.manjat.judulListing}
                placeholder={copy.manjat.judulPlaceholder}
                value={nama}
                onChange={(e) => setNama(e.target.value)}
              />
              <Dropdown
                label={copy.manjat.kategori}
                placeholder="—"
                value={kategoriSlug}
                onChange={setKategoriSlug}
                options={kategori.map((k) => ({ value: k.slug, label: k.nama }))}
              />
              <label className="block">
                <span className="text-sm text-tinta-redup">{copy.manjat.deskripsi}</span>
                <textarea
                  value={deskripsi}
                  maxLength={160}
                  rows={2}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  className={`mt-1 ${textareaClasses}`}
                />
              </label>
            </div>
          </details>

          <Input
            label={copy.manjat.emailOpsional}
            type="email"
            placeholder={copy.manjat.emailPlaceholder}
            hint={copy.manjat.emailHint}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button disabled={!canStep1} onClick={() => setStep(2)} className="gap-1.5">
            {express && <ArrowLeft className="size-4" aria-hidden />}
            {express ? copy.manjat.kembaliPosisi : copy.manjat.lanjut}
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="mt-6 flex flex-col gap-4">
          {/* Site confirmation — logo + URL of the listing you're putting up,
              with a quick way back to the detail form. */}
          {url.trim() && (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex w-full items-center gap-3 rounded-xl border border-garis bg-kertas-1 p-2.5 text-left"
            >
              <LogoTile nama={nama || host} className="size-10 shrink-0 rounded-lg text-base" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-tinta">{nama || host}</p>
                <p className="truncate font-mono text-xs text-tinta-redup">{host}</p>
              </div>
              <span className="shrink-0 text-xs font-medium text-merah-teks">
                {copy.manjat.ubahDetail}
              </span>
            </button>
          )}

          {/* Open amount — you set what to pay; position is computed automatically. */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-tinta">
              {copy.manjat.nominalTanya}
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xl text-tinta-redup">
                Rp
              </span>
              <input
                inputMode="numeric"
                autoFocus
                placeholder={copy.manjat.nominalPlaceholder}
                value={nominalInput ? Number(nominalInput).toLocaleString("id-ID") : ""}
                onChange={(e) => setNominalInput(e.target.value.replace(/\D/g, ""))}
                className="h-14 w-full rounded-xl border border-garis bg-kertas-1 pl-12 pr-4 font-mono text-2xl font-bold text-tinta shadow-kartu focus-visible:border-merah focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-merah/25"
              />
            </div>
            <p className="mt-1.5 text-xs text-tinta-redup">{copy.manjat.nominalNaik}</p>
          </div>

          {/* Live board — you slot in among real competitors as you set the amount. */}
          {quote ? (
            <div className="flex flex-col gap-3">
              <div className="divide-y divide-garis/50 overflow-hidden rounded-xl border border-garis bg-kertas-1">
                <p className="px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-tinta-redup">
                  {copy.manjat.papanPratinjau}
                </p>
                {quote.atas.map((n) => (
                  <BoardRow key={`a${n.rank}`} rank={n.rank} nama={n.nama} rp={n.pegangan} />
                ))}
                {/* KAMU — re-keyed on rank so it re-animates when you move. */}
                <div key={quote.rank} className="manjat-slot">
                  <BoardRow rank={quote.rank} nama={nama || host} rp={quote.nominal} kamu />
                </div>
                {quote.bawah.map((n) => (
                  <BoardRow key={`b${n.rank}`} rank={n.rank} nama={n.nama} rp={n.pegangan} />
                ))}
              </div>

              {quote.salipAtas ? (
                <button
                  type="button"
                  onClick={() =>
                    setNominalInput(String(quote.nominal + (quote.salipAtas?.extra ?? 0)))
                  }
                  className="flex items-center justify-between gap-2 rounded-xl border border-merah/40 bg-merah/8 px-3 py-2 text-left text-sm text-merah-teks transition ease-panjat hover:bg-merah/12 active:scale-[0.99]"
                >
                  <span className="font-medium">
                    {copy.manjat.salipTambah(
                      formatRupiah(quote.salipAtas.extra),
                      quote.salipAtas.rank,
                    )}
                  </span>
                  <span className="shrink-0 truncate font-mono text-xs opacity-80">
                    {quote.salipAtas.nama}
                  </span>
                </button>
              ) : (
                <p className="rounded-xl border border-emas/40 bg-emas/10 px-3 py-2 text-sm font-medium text-tinta">
                  {copy.manjat.jadiPuncak}
                </p>
              )}

              <p className="text-center font-mono tabular text-xs text-tinta-redup">
                {copy.manjat.posisiRingkas(
                  formatRupiah(quote.nominal),
                  formatRupiah(quote.rosotPerHari),
                  quote.estimasiHari,
                )}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-garis bg-kertas-1 px-4 py-6 text-center text-sm text-tinta-redup">
              {loadingQuote ? copy.manjat.menghitung : copy.manjat.ketikNominal}
            </div>
          )}

          {/* Single CTA — pay goes straight to the payment gateway. */}
          <Button className="w-full" disabled={!quote || submitting} onClick={onPay}>
            {submitting
              ? copy.manjat.memproses
              : copy.manjat.bayar(quote ? formatRupiah(quote.nominal) : undefined)}
          </Button>
        </div>
      )}
    </div>
  );
}
