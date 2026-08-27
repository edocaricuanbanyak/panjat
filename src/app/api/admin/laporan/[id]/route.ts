import { NextResponse } from "next/server";
import { db } from "@/db";
import { tutupLaporan } from "@/domain/laporan";
import { currentAdmin } from "@/lib/admin";

export const runtime = "nodejs";

/** POST /api/admin/laporan/{id} — close a report (§18.6, R8). */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!(await currentAdmin())) {
    return NextResponse.redirect(new URL("/admin/masuk", req.url), { status: 303 });
  }
  const { id } = await ctx.params;
  await tutupLaporan(db, id);
  return NextResponse.redirect(new URL("/admin", req.url), { status: 303 });
}
