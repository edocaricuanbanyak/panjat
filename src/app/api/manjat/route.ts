import { NextResponse } from "next/server";
import { db } from "@/db";
import { createOrTopUp, quoteForTarget, type Target } from "@/domain/manjat";
import { midtransSnapClient } from "@/lib/midtrans";

export const runtime = "nodejs";

const TARGETS: Target[] = ["#1", "top3", "top10"];

/**
 * POST /api/manjat
 *  - { target } (one of #1|top3|top10)      -> returns a rupiah quote
 *  - { url, email, nominal, ... }           -> creates/tops up + Snap invoice
 * Grip is granted only later, by the verified webhook.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  try {
    if (typeof body.target === "string") {
      if (!TARGETS.includes(body.target as Target)) {
        return NextResponse.json({ error: "Target tidak dikenal" }, { status: 400 });
      }
      const nominal = await quoteForTarget(db, body.target as Target);
      return NextResponse.json({ target: body.target, nominal });
    }

    if (typeof body.url !== "string" || typeof body.email !== "string") {
      return NextResponse.json({ error: "url dan email wajib" }, { status: 400 });
    }
    if (typeof body.nominal !== "number") {
      return NextResponse.json({ error: "nominal wajib berupa angka" }, { status: 400 });
    }

    const result = await createOrTopUp(db, midtransSnapClient, {
      url: body.url,
      email: body.email,
      nominal: body.nominal,
      nama: typeof body.nama === "string" ? body.nama : undefined,
      deskripsi: typeof body.deskripsi === "string" ? body.deskripsi : undefined,
      kategoriSlug: typeof body.kategoriSlug === "string" ? body.kategoriSlug : undefined,
      wa: typeof body.wa === "string" ? body.wa : undefined,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal memproses manjat";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
