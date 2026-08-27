import { NextResponse } from "next/server";
import { db } from "@/db";
import { approveListing, rejectListing, turunkanListing } from "@/domain/moderasi";
import { currentAdmin } from "@/lib/admin";

export const runtime = "nodejs";

/** POST /api/admin/{listing}/moderasi (form: aksi=approve|reject) — human decision. */
export async function POST(req: Request, ctx: { params: Promise<{ listing: string }> }) {
  if (!(await currentAdmin())) {
    return NextResponse.redirect(new URL("/admin/masuk", req.url), { status: 303 });
  }
  const { listing: listingId } = await ctx.params;
  const form = await req.formData();
  const aksi = String(form.get("aksi") ?? "");

  if (aksi === "approve") await approveListing(db, listingId);
  else if (aksi === "reject") await rejectListing(db, listingId);
  else if (aksi === "turunkan") await turunkanListing(db, listingId);

  return NextResponse.redirect(new URL("/admin", req.url), { status: 303 });
}
