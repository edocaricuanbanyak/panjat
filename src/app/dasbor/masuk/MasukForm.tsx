"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

export function MasukForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [devLink, setDevLink] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/dasbor/masuk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal");
      setDevLink(data.devLink ?? null);
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Gagal");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-lg border border-garis bg-kertas-1 p-4">
        <p className="text-sm text-tinta">
          Kalau email itu terdaftar, tautan masuk sudah dikirim. Cek kotak masukmu.
        </p>
        {devLink && (
          <a href={devLink} className="mt-3 block break-all text-sm text-merah-teks hover:underline">
            [dev] buka tautan masuk →
          </a>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <Input
        label="Email"
        type="email"
        required
        placeholder="kamu@email.com"
        hint="Kami kirim tautan masuk. Tanpa password."
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {error && <p className="text-sm text-galat">{error}</p>}
      <Button type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Mengirim…" : "Kirim tautan masuk"}
      </Button>
    </form>
  );
}
