import { NextResponse } from "next/server";
import { db } from "@/db";
import { createOrTopUp, quote, type Target } from "@/domain/manjat";
import { clientIp } from "@/lib/ip";
import { isMock, midtransSnapClient, mockSnapClient } from "@/lib/midtrans";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

const TARGETS: Target[] = ["#1", "top3", "top10"];

/**
 * POST /api/manjat
 *  - no `url`  -> quote: { target } or { nominal } => { nominal, rank, rosotPerHari, estimasiHari }
 *  - with `url` -> create/top-up + Snap invoice => { orderId, redirectUrl, ... }
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
    // Quote mode (no url).
    if (typeof body.url !== "string") {
      const target = body.target as Target | undefined;
      if (target !== undefined && !TARGETS.includes(target)) {
        return NextResponse.json({ error: "Target tidak dikenal" }, { status: 400 });
      }
      if (target === undefined && typeof body.nominal !== "number") {
        return NextResponse.json({ error: "target atau nominal wajib" }, { status: 400 });
      }
      const q = await quote(db, { target, nominal: body.nominal as number | undefined });
      return NextResponse.json(q);
    }

    // Create/top-up mode — rate-limit invoice creation per IP (§18.4).
    const rl = await rateLimit(`manjat:${clientIp(req.headers)}`, 10, 60);
    if (!rl.ok) {
      return NextResponse.json({ error: "Terlalu banyak permintaan. Coba lagi sebentar." }, { status: 429 });
    }
    if (typeof body.nominal !== "number") {
      return NextResponse.json({ error: "nominal wajib berupa angka" }, { status: 400 });
    }

    const snap = isMock() ? mockSnapClient : midtransSnapClient;
    const result = await createOrTopUp(db, snap, {
      url: body.url,
      email: typeof body.email === "string" ? body.email : undefined,
      nominal: body.nominal,
      nama: typeof body.nama === "string" ? body.nama : undefined,
      deskripsi: typeof body.deskripsi === "string" ? body.deskripsi : undefined,
      kategoriSlug: typeof body.kategoriSlug === "string" ? body.kategoriSlug : undefined,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal memproses manjat";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
