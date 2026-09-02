"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { formatRupiah } from "@/lib/format";

/** Dev-only stand-in for the Midtrans payment page (MIDTRANS_MOCK=true). */
export function MockPay({ orderId, nominal }: { orderId: string; nominal: number }) {
  const [status, setStatus] = useState<"idle" | "paying" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function pay() {
    setStatus("paying");
    try {
      const res = await fetch("/api/dev/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "gagal");
      if (data.status !== "settled") throw new Error(`status: ${data.status}`);
      setStatus("done");
      window.location.href = `/manjat/selesai?order=${encodeURIComponent(orderId)}`;
    } catch (e) {
      setStatus("error");
      setMsg(e instanceof Error ? e.message : "gagal");
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <p className="mb-3 inline-flex w-fit rounded-full bg-kertas-2 px-2 py-0.5 tabular text-xs text-tinta-redup">
        MODE UJI
      </p>

      {status === "done" ? (
        <>
          <h1 className="font-display text-2xl font-bold text-tinta" style={{ fontStretch: "120%" }}>
            Berhasil manjat!
          </h1>
          <p className="mt-2 text-sm text-tinta-redup">
            Pembayaran {formatRupiah(nominal)} dikonfirmasi. Listing kamu sudah tayang di papan.
          </p>
          <a href="/" className="mt-6 inline-block font-medium text-merah-teks hover:underline">
            Lihat posisinya di papan →
          </a>
        </>
      ) : (
        <>
          <h1 className="font-display text-2xl font-bold text-tinta" style={{ fontStretch: "120%" }}>
            Pembayaran simulasi
          </h1>
          <p className="mt-1 tabular text-xs text-tinta-redup">{orderId}</p>
          <div className="mt-4 flex items-baseline justify-between rounded-xl border border-garis bg-kertas-1 px-4 py-3 shadow-kartu">
            <span className="text-sm text-tinta-redup">Total</span>
            <span className="font-sans tabular text-lg font-semibold text-tinta">
              {formatRupiah(nominal)}
            </span>
          </div>
          {status === "error" && (
            <p className="mt-3 text-sm text-galat">Gagal: {msg}</p>
          )}
          <Button className="mt-6 w-full" disabled={status === "paying"} onClick={pay}>
            {status === "paying" ? "Memproses…" : "Bayar sekarang (simulasi)"}
          </Button>
          <a href="/" className="mt-3 block text-center text-sm text-tinta-redup hover:text-tinta">
            Batalkan
          </a>
        </>
      )}
    </main>
  );
}
