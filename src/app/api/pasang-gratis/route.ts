import { NextResponse } from "next/server";
import { db } from "@/db";
import { GratisError, createGratis } from "@/domain/gratis";
import { clientIp } from "@/lib/ip";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

/** POST /api/pasang-gratis { url, nama?, deskripsi?, kategoriSlug?, email? }. */
export async function POST(req: Request) {
  const rl = await rateLimit(`gratis:${clientIp(req.headers)}`, 5, 3600);
  if (!rl.ok) {
    return NextResponse.json({ error: "Terlalu banyak listing gratis. Coba lagi nanti." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }
  if (typeof body.url !== "string" || !body.url.trim()) {
    return NextResponse.json({ error: "URL wajib" }, { status: 400 });
  }

  try {
    const { listingId } = await createGratis(db, {
      url: body.url,
      nama: typeof body.nama === "string" ? body.nama : undefined,
      deskripsi: typeof body.deskripsi === "string" ? body.deskripsi : undefined,
      kategoriSlug: typeof body.kategoriSlug === "string" ? body.kategoriSlug : undefined,
      email: typeof body.email === "string" ? body.email : undefined,
    });
    return NextResponse.json({ listingId });
  } catch (err) {
    const message = err instanceof GratisError ? err.message : "Gagal memproses";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
