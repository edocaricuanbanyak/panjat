import { NextResponse } from "next/server";
import { db } from "@/db";
import { EditLimitError, editDeskripsi } from "@/domain/dashboard";
import { currentKontak } from "@/lib/session";

export const runtime = "nodejs";

/** POST /api/dasbor/{listing}/deskripsi { deskripsi } — owner only, ≤2/24h. */
export async function POST(req: Request, ctx: { params: Promise<{ listing: string }> }) {
  const kontakId = await currentKontak();
  if (!kontakId) return NextResponse.json({ error: "Belum masuk" }, { status: 401 });

  const { listing: listingId } = await ctx.params;
  let body: { deskripsi?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }
  const deskripsi = typeof body.deskripsi === "string" ? body.deskripsi.trim() : "";
  if (!deskripsi) return NextResponse.json({ error: "Deskripsi kosong" }, { status: 400 });
  if (deskripsi.length > 160) {
    return NextResponse.json({ error: "Maksimal 160 karakter" }, { status: 400 });
  }

  try {
    await editDeskripsi(db, listingId, kontakId, deskripsi);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const status = err instanceof EditLimitError ? 429 : 400;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal" },
      { status },
    );
  }
}
