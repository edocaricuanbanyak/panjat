"use client";

import { Check, Globe, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Dropdown } from "@/components/Dropdown";
import { fieldClasses, Input, textareaClasses } from "@/components/Input";
import { KategoriIcon } from "@/components/KategoriIcon";
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
        className={`w-8 shrink-0 font-sans tabular text-sm font-semibold ${
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
        className={`shrink-0 font-sans tabular text-sm ${
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
  const nominalRef = useRef<HTMLInputElement>(null);

  // Focus the Rp field only AFTER the sheet finishes opening, so it doesn't fight
  // the entrance animation (300ms sheet-up / 260ms manjat-slot). Reduced-motion
  // collapses the animation, so focus immediately.
  useEffect(() => {
    if (step !== 2) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(() => nominalRef.current?.focus(), reduce ? 0 : 360);
    return () => clearTimeout(t);
  }, [step]);

  const [submitting, setSubmitting] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshQuote(payload: { nominal: number; url?: string }) {
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
  // The url is sent so a top-up onto a paid listing accumulates (§6.2).
  useEffect(() => {
    const n = Number(nominalInput);
    if (!n) {
      setQuote(null);
      return;
    }
    const t = setTimeout(() => void refreshQuote({ nominal: n, url: url.trim() || undefined }), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nominalInput, url]);

  async function onPay() {
    if (!quote) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await postManjat({
        bayar: true,
        url,
        email: email || undefined,
        nominal: quote.nominal,
        nama: nama || undefined,
        kategoriSlug: kategoriSlug || undefined,
        deskripsi: deskripsi || undefined,
        logoUrl: logoUrl || undefined,
      });
      window.location.href = result.redirectUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : copy.error.gagalTagihan);
      setSubmitting(false);
    }
  }

  const [previewing, setPreviewing] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);
  const urlRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  // Grow the description box to fit its content (≤160 chars) so it never scrolls.
  useEffect(() => {
    const el = descRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [deskripsi, step]);
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
  // The server clamps below-minimum amounts up; surface that instead of silently
  // showing a different position than the number you typed.
  const typedNominal = Number(nominalInput) || 0;
  const nominalDinaikkan = quote != null && typedNominal > 0 && quote.nominal > typedNominal;

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
                placeholder={copy.manjat.urlPlaceholder}
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

          {/* Prefilled from the URL, but editable — tweak before you go up. */}
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
            hint={copy.manjat.emailHint}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

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

          <Button disabled={!canStep1} onClick={() => setStep(2)}>
            {copy.manjat.lanjut}
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
              {logoUrl && !logoFailed ? (
                // biome-ignore lint/performance/noImgElement: remote site logo, not a static asset
                <img
                  src={logoUrl}
                  alt=""
                  onError={() => setLogoFailed(true)}
                  className="size-10 shrink-0 rounded-full border border-garis bg-kertas-1 object-contain p-1"
                />
              ) : (
                <LogoTile nama={nama || host} className="size-10 shrink-0 rounded-full text-base" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-tinta">{nama || host}</p>
                <p className="truncate tabular text-xs text-tinta-redup">{host}</p>
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
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 tabular text-xl text-tinta-redup">
                Rp
              </span>
              <input
                ref={nominalRef}
                inputMode="numeric"
                placeholder={copy.manjat.nominalPlaceholder}
                value={nominalInput ? Number(nominalInput).toLocaleString("id-ID") : ""}
                onChange={(e) => setNominalInput(e.target.value.replace(/\D/g, ""))}
                className={`h-14 w-full rounded-xl border bg-kertas-1 pl-12 pr-4 tabular text-2xl font-bold text-tinta shadow-kartu focus-visible:outline-none focus-visible:ring-2 ${
                  nominalDinaikkan
                    ? "border-galat focus-visible:border-galat focus-visible:ring-galat/25"
                    : "border-garis focus-visible:border-merah focus-visible:ring-merah/25"
                }`}
              />
            </div>
            {nominalDinaikkan && quote ? (
              <p className="mt-1.5 text-xs font-medium text-galat">
                {copy.manjat.nominalDinaikkan(formatRupiah(quote.nominal))}
              </p>
            ) : quote?.mode === "manjat_lagi" ? (
              <p className="mt-1.5 text-xs text-tinta-redup">
                {copy.manjat.manjatLagiHint(
                  formatRupiah(quote.peganganSaatIni),
                  formatRupiah(quote.peganganProyeksi),
                )}
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-tinta-redup">{copy.manjat.nominalNaik}</p>
            )}
          </div>

          {/* Live board — you slot in among real competitors as you set the amount.
              The board is the single result surface: standings + decay footer, with
              a light salip hint below. */}
          {quote ? (
            <div className="flex flex-col gap-2.5">
              <div className="divide-y divide-garis/50 overflow-hidden rounded-xl border border-garis bg-kertas-1">
                <p className="px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-tinta-redup">
                  {copy.manjat.papanPratinjau}
                </p>
                {quote.atas.map((n) => (
                  <BoardRow key={`a${n.rank}`} rank={n.rank} nama={n.nama} rp={n.pegangan} />
                ))}
                {/* KAMU — re-keyed on rank so it re-animates when you move. A
                    top-up shows the accumulated grip, not just what you pay now. */}
                <div key={quote.rank} className="manjat-slot">
                  <BoardRow rank={quote.rank} nama={nama || host} rp={quote.peganganProyeksi} kamu />
                </div>
                {quote.bawah.map((n) => (
                  <BoardRow key={`b${n.rank}`} rank={n.rank} nama={n.nama} rp={n.pegangan} />
                ))}
                {/* Decay/estimate folded into the board footer, muted. */}
                <p className="bg-kertas px-3 py-1.5 font-sans tabular text-[11px] text-tinta-redup">
                  {copy.manjat.posisiRingkas(
                    formatRupiah(quote.rosotPerHari),
                    quote.estimasiHari,
                  )}
                </p>
              </div>

              {/* Salip — a light, centred hint (tap to bump), not a heavy box. */}
              {quote.salipAtas ? (
                <button
                  type="button"
                  onClick={() =>
                    setNominalInput(String(quote.nominal + (quote.salipAtas?.extra ?? 0)))
                  }
                  className="mx-auto inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-sm font-medium text-merah-teks transition hover:underline"
                >
                  {copy.manjat.salipTambah(formatRupiah(quote.salipAtas.extra), quote.salipAtas.rank)}
                  <span className="max-w-[9rem] truncate text-xs text-tinta-redup">
                    · {quote.salipAtas.nama}
                  </span>
                </button>
              ) : (
                <p className="text-center text-sm font-medium text-tinta">{copy.manjat.jadiPuncak}</p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-garis bg-kertas-1 px-4 py-6 text-center text-sm text-tinta-redup">
              {loadingQuote ? copy.manjat.menghitung : copy.manjat.ketikNominal}
            </div>
          )}

          {/* Consent — required before the payment can be started. */}
          <label className="flex items-start gap-2 text-xs text-tinta-redup">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              aria-describedby="consent-teks"
              className="mt-0.5 size-4 shrink-0 accent-merah"
            />
            <span id="consent-teks">
              {copy.manjat.consentSetuju}{" "}
              <a
                href="/ketentuan"
                target="_blank"
                rel="noopener noreferrer"
                className="text-merah-teks hover:underline"
              >
                {copy.manjat.consentKetentuan}
              </a>{" "}
              &amp;{" "}
              <a
                href="/aturan"
                target="_blank"
                rel="noopener noreferrer"
                className="text-merah-teks hover:underline"
              >
                {copy.manjat.consentAturan}
              </a>
              {copy.manjat.consentRosot}
            </span>
          </label>

          {/* Single CTA — pay goes straight to the payment gateway. */}
          <Button className="w-full" disabled={!quote || submitting || !consent} onClick={onPay}>
            {submitting
              ? copy.manjat.memproses
              : nominalDinaikkan && quote
                ? copy.manjat.bayarMinimal(formatRupiah(quote.nominal))
                : copy.manjat.bayar(quote ? formatRupiah(quote.nominal) : undefined)}
          </Button>
        </div>
      )}
    </div>
  );
}
