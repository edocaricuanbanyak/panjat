import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminLogin } from "@/lib/admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL(adminLogin(req.headers.get("host")), req.url), { status: 303 });
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}
