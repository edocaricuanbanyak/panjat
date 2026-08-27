import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sponsorKontak } from "@/db/schema";
import { RateLimitedError, issueToken } from "@/lib/magiclink";

export const runtime = "nodejs";

/**
 * POST /api/dasbor/masuk { email } — sends a magic link. Always reports success
 * (no account enumeration). In dev, returns the link so the flow works without
 * an email provider.
 */
export async function POST(req: Request) {
  let body: { email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) return NextResponse.json({ error: "Email wajib" }, { status: 400 });

  const [kontak] = await db
    .select({ id: sponsorKontak.id })
    .from(sponsorKontak)
    .where(eq(sponsorKontak.email, email))
    .limit(1);

  let devLink: string | undefined;
  if (kontak) {
    try {
      const token = await issueToken(db, kontak.id);
      const link = `/api/dasbor/verifikasi?token=${token}`;
      // TODO: send via email/WA. Until then, expose only in dev.
      if (process.env.NODE_ENV !== "production") devLink = link;
    } catch (err) {
      if (err instanceof RateLimitedError) {
        return NextResponse.json({ error: err.message }, { status: 429 });
      }
      throw err;
    }
  }

  return NextResponse.json({ sent: true, ...(devLink ? { devLink } : {}) });
}
