import { NextResponse } from "next/server";
import { db } from "@/db";
import { createLaporan } from "@/domain/laporan";
import { clientIp } from "@/lib/ip";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

/** POST /api/lapor (form: listingId, jenis, pesan, kontak) — R8 report / §18.6 claim. */
export async function POST(req: Request) {
  const rl = await rateLimit(`lapor:${clientIp(req.headers)}`, 5, 3600);
  if (!rl.ok) return NextResponse.redirect(new URL("/", req.url), { status: 303 });

  const form = await req.formData();
  const listingId = String(form.get("listingId") ?? "");
  const jenis = String(form.get("jenis") ?? "lapor") === "klaim" ? "klaim" : "lapor";
  if (!listingId) return NextResponse.redirect(new URL("/", req.url), { status: 303 });

  await createLaporan(db, {
    listingId,
    jenis,
    pesan: String(form.get("pesan") ?? "") || undefined,
    kontak: String(form.get("kontak") ?? "") || undefined,
  });
  return NextResponse.redirect(new URL(`/l/${listingId}?lapor=ok`, req.url), { status: 303 });
}
