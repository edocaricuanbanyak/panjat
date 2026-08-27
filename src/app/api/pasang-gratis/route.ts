import { NextResponse } from "next/server";
import { db } from "@/db";
import { GratisError, createGratis } from "@/domain/gratis";
import { clientIp } from "@/lib/ip";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

/** POST /api/pasang-gratis (form) — create a free Rp0 Kaki Tiang listing (R16). */
export async function POST(req: Request) {
  const rl = await rateLimit(`gratis:${clientIp(req.headers)}`, 5, 3600);
  if (!rl.ok) {
    return NextResponse.redirect(new URL("/pasang-gratis?e=limit", req.url), { status: 303 });
  }

  const form = await req.formData();
  const url = String(form.get("url") ?? "");
  const email = String(form.get("email") ?? "");
  if (!url.trim() || !email.trim()) {
    return NextResponse.redirect(new URL("/pasang-gratis?e=wajib", req.url), { status: 303 });
  }

  try {
    const { listingId } = await createGratis(db, {
      url,
      email,
      nama: String(form.get("nama") ?? "") || undefined,
      deskripsi: String(form.get("deskripsi") ?? "") || undefined,
      kategoriSlug: String(form.get("kategoriSlug") ?? "") || undefined,
    });
    return NextResponse.redirect(new URL(`/l/${listingId}`, req.url), { status: 303 });
  } catch (err) {
    const e = err instanceof GratisError ? "ada" : "gagal";
    return NextResponse.redirect(new URL(`/pasang-gratis?e=${e}`, req.url), { status: 303 });
  }
}
