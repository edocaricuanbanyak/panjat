import { NextResponse } from "next/server";
import { copy } from "@/copy";
import { db } from "@/db";
import { createOrTopUp, quote, type Target } from "@/domain/manjat";
import { clientIp } from "@/lib/ip";
import { getCheckoutClient } from "@/lib/gateways";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

const TARGETS: Target[] = ["#1", "top3", "top10"];

/**
 * POST /api/manjat
 *  - `bayar` falsy -> quote: { target|nominal, url? } => projection incl. accumulation
 *      when `url` matches a paid listing (top-up); Kaki Tiang (grip 0) is a fresh climb.
 *  - `bayar: true` -> create/top-up + Snap invoice => { orderId, redirectUrl, ... }
 * Grip is granted only later, by the verified webhook.
 */
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: copy.error.bodyTidakValid }, { status: 400 });
  }

  try {
    // Quote mode — the projection may include the url to accumulate a top-up.
    if (body.bayar !== true) {
      const target = body.target as Target | undefined;
      if (target !== undefined && !TARGETS.includes(target)) {
        return NextResponse.json({ error: copy.error.targetTidakDikenal }, { status: 400 });
      }
      if (target === undefined && typeof body.nominal !== "number") {
        return NextResponse.json({ error: copy.error.targetWajib }, { status: 400 });
      }
      const q = await quote(db, {
        target,
        nominal: body.nominal as number | undefined,
        url: typeof body.url === "string" ? body.url : undefined,
      });
      return NextResponse.json(q);
    }

    // Create/top-up mode — rate-limit invoice creation per IP (§18.4).
    if (typeof body.url !== "string") {
      return NextResponse.json({ error: copy.error.bodyTidakValid }, { status: 400 });
    }
    const rl = await rateLimit(`manjat:${clientIp(req.headers)}`, 10, 60);
    if (!rl.ok) {
      return NextResponse.json({ error: copy.error.terlaluBanyakPermintaan }, { status: 429 });
    }
    if (typeof body.nominal !== "number") {
      return NextResponse.json({ error: copy.error.nominalWajib }, { status: 400 });
    }

    const snap = getCheckoutClient();
    const result = await createOrTopUp(db, snap, {
      url: body.url,
      email: typeof body.email === "string" ? body.email : undefined,
      nominal: body.nominal,
      nama: typeof body.nama === "string" ? body.nama : undefined,
      deskripsi: typeof body.deskripsi === "string" ? body.deskripsi : undefined,
      kategoriSlug: typeof body.kategoriSlug === "string" ? body.kategoriSlug : undefined,
      logoUrl: typeof body.logoUrl === "string" ? body.logoUrl : undefined,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal memproses manjat";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
