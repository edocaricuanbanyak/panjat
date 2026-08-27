"use client";

import { useState } from "react";
import { AmountSelector, type TargetChoice } from "@/components/AmountSelector";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { MiniTiang } from "@/components/MiniTiang";
import { Steps } from "@/components/Steps";
import type { Quote } from "@/domain/manjat";
import { formatRupiah } from "@/lib/format";

type Kategori = { slug: string; nama: string };

const STEP_LABELS = ["Detail", "Posisi", "Bayar"];

async function postManjat(payload: unknown) {
  const res = await fetch("/api/manjat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Gagal memproses");
  return data;
}

function markerHeight(rank: number): number {
  return Math.min(0.95, Math.max(0.05, 1 - (rank - 1) / 12));
}

export function ManjatWizard({
  initialUrl,
  kategori,
}: {
  initialUrl: string;
  kategori: Kategori[];
}) {
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState(initialUrl);
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [wa, setWa] = useState("");
  const [kategoriSlug, setKategoriSlug] = useState("");
  const [deskripsi, setDeskripsi] = useState("");

  const [target, setTarget] = useState<TargetChoice | null>(null);
  const [nominalInput, setNominalInput] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);

  const [confirmBig, setConfirmBig] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshQuote(payload: { target?: TargetChoice; nominal?: number }) {
    setError(null);
    setLoadingQuote(true);
    setQuote(null);
    try {
      setQuote(await postManjat(payload));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menghitung");
    } finally {
      setLoadingQuote(false);
    }
  }

  function onSelectTarget(choice: TargetChoice) {
    setTarget(choice);
    if (choice === "nominal") {
      setQuote(null);
    } else {
      void refreshQuote({ target: choice });
    }
  }

  async function onPay() {
    if (!quote) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await postManjat({
        url,
        email,
        nominal: quote.nominal,
        nama: nama || undefined,
        wa: wa || undefined,
        kategoriSlug: kategoriSlug || undefined,
        deskripsi: deskripsi || undefined,
      });
      window.location.href = result.redirectUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal membuat tagihan");
      setSubmitting(false);
    }
  }

  const [suggesting, setSuggesting] = useState(false);
  async function suggestDesc() {
    if (!url.trim()) return;
    setSuggesting(true);
    try {
      const res = await fetch("/api/saran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, nama }),
      });
      const data = await res.json();
      if (data.deskripsi) setDeskripsi(data.deskripsi);
    } catch {
      /* best-effort */
    } finally {
      setSuggesting(false);
    }
  }

  async function prefillFromUrl() {
    if (!url.trim()) return;
    try {
      const res = await fetch(`/api/preview?url=${encodeURIComponent(url)}`);
      if (!res.ok) return;
      const p = await res.json();
      // Never overwrite what the user already typed.
      setNama((n) => n || p.nama || "");
      setDeskripsi((d) => d || p.deskripsi || "");
    } catch {
      /* preview is best-effort; the pay flow never waits on it */
    }
  }

  const canStep1 = url.trim() !== "" && email.trim() !== "";
  const bigAmount = (quote?.nominal ?? 0) > 200_000;

  return (
    <main className="mx-auto w-full max-w-md px-4 py-8">
      <a href="/" className="text-sm text-tinta-redup hover:text-tinta">
        ← Papan
      </a>
      <h1
        className="mt-2 font-display text-2xl font-bold text-tinta"
        style={{ fontStretch: "120%" }}
      >
        Naik tiang
      </h1>

      <div className="mt-4">
        <Steps current={step} labels={STEP_LABELS} />
      </div>

      {error && (
        <p className="mt-4 rounded-md border border-merah/40 bg-merah/10 px-3 py-2 text-sm text-merah">
          {error}
        </p>
      )}

      {step === 1 && (
        <div className="mt-6 flex flex-col gap-4">
          <Input
            label="URL atau @username"
            placeholder="nyala.id"
            hint="Kami isi nama & deskripsi otomatis dari URL-mu."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={prefillFromUrl}
          />
          <Input
            label="Nama listing"
            placeholder="Nyala Analytics"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            placeholder="kamu@email.com"
            hint="Untuk dasbor dan notifikasi. Tanpa akun."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="WhatsApp (opsional)"
            placeholder="+62…"
            value={wa}
            onChange={(e) => setWa(e.target.value)}
          />
          <label className="block">
            <span className="text-sm text-tinta-redup">Kategori (opsional)</span>
            <select
              className="mt-1 h-11 w-full rounded-md border border-garis bg-kertas-1 px-3 text-base text-tinta"
              value={kategoriSlug}
              onChange={(e) => setKategoriSlug(e.target.value)}
            >
              <option value="">—</option>
              {kategori.map((k) => (
                <option key={k.slug} value={k.slug}>
                  {k.nama}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <div className="flex items-center justify-between">
              <span className="text-sm text-tinta-redup">Deskripsi (160 kar.)</span>
              <button
                type="button"
                onClick={suggestDesc}
                disabled={suggesting || !url.trim()}
                className="font-mono text-xs text-merah hover:underline disabled:opacity-50"
              >
                {suggesting ? "…" : "Saran AI"}
              </button>
            </div>
            <textarea
              value={deskripsi}
              maxLength={160}
              rows={2}
              onChange={(e) => setDeskripsi(e.target.value)}
              className="mt-1 w-full rounded-md border border-garis bg-kertas-1 p-2 text-base text-tinta"
            />
          </label>
          <Button disabled={!canStep1} onClick={() => setStep(2)}>
            Lanjut
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="mt-6 flex flex-col gap-4">
          <p className="text-sm text-tinta-redup">Mau di posisi berapa? Sistem yang menghitung.</p>
          <div className="flex gap-4">
            <div className="flex-1">
              <AmountSelector value={target} onSelect={onSelectTarget} />
              {target === "nominal" && (
                <div className="mt-2">
                  <Input
                    label="Nominal (Rp)"
                    inputMode="numeric"
                    placeholder="25000"
                    value={nominalInput}
                    onChange={(e) => setNominalInput(e.target.value.replace(/\D/g, ""))}
                    onBlur={() =>
                      nominalInput && refreshQuote({ nominal: Number(nominalInput) })
                    }
                  />
                </div>
              )}
            </div>
            <MiniTiang height={quote ? markerHeight(quote.rank) : 0.05} />
          </div>

          <div className="rounded-md border border-garis bg-kertas-1 p-3">
            {loadingQuote ? (
              <p className="text-sm text-tinta-redup">Menghitung…</p>
            ) : quote ? (
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-tinta-redup">Kamu akan bayar</span>
                  <span className="font-mono tabular text-lg font-semibold text-tinta">
                    {formatRupiah(quote.nominal)}
                  </span>
                </div>
                <p className="font-mono tabular text-xs text-tinta-redup">
                  Posisi #{quote.rank} · merosot ~{formatRupiah(quote.rosotPerHari)}/hari ·{" "}
                  {quote.estimasiHari === null
                    ? "stabil (kaki tiang)"
                    : `bertahan ~${quote.estimasiHari} hari`}
                </p>
              </div>
            ) : (
              <p className="text-sm text-tinta-redup">Pilih target posisi.</p>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(1)}>
              Kembali
            </Button>
            <Button className="flex-1" disabled={!quote} onClick={() => setStep(3)}>
              Lanjut
            </Button>
          </div>
        </div>
      )}

      {step === 3 && quote && (
        <div className="mt-6 flex flex-col gap-4">
          <dl className="rounded-md border border-garis bg-kertas-1 p-4 text-sm">
            <div className="flex justify-between py-1">
              <dt className="text-tinta-redup">Listing</dt>
              <dd className="text-tinta">{nama || url}</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-tinta-redup">Target posisi</dt>
              <dd className="font-mono tabular text-tinta">#{quote.rank}</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-tinta-redup">Estimasi bertahan</dt>
              <dd className="font-mono tabular text-tinta">
                {quote.estimasiHari === null ? "stabil" : `~${quote.estimasiHari} hari`}
              </dd>
            </div>
            <div className="mt-1 flex justify-between border-t border-garis pt-2">
              <dt className="text-tinta">Total</dt>
              <dd className="font-mono tabular text-lg font-semibold text-tinta">
                {formatRupiah(quote.nominal)}
              </dd>
            </div>
          </dl>

          {bigAmount && (
            <label className="flex items-start gap-2 text-sm text-tinta-redup">
              <input
                type="checkbox"
                checked={confirmBig}
                onChange={(e) => setConfirmBig(e.target.checked)}
                className="mt-0.5"
              />
              Saya yakin membayar {formatRupiah(quote.nominal)}.
            </label>
          )}

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep(2)}>
              Kembali
            </Button>
            <Button
              className="flex-1"
              disabled={submitting || (bigAmount && !confirmBig)}
              onClick={onPay}
            >
              {submitting ? "Memproses…" : `Bayar ${formatRupiah(quote.nominal)} lewat QRIS`}
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
