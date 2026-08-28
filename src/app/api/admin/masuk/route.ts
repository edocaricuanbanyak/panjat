import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminCookieOptions, adminHome, adminLogin, checkAdminLogin, signAdmin } from "@/lib/admin";
import { clientIp } from "@/lib/ip";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

/** POST /api/admin/masuk (form: password). Rate-limited to slow brute force. */
export async function POST(req: Request) {
  const login = adminLogin(req.headers.get("host"));
  const rl = await rateLimit(`admin:${clientIp(req.headers)}`, 5, 300);
  if (!rl.ok) return NextResponse.redirect(new URL(`${login}?e=limit`, req.url), { status: 303 });

  const form = await req.formData();
  if (!checkAdminLogin(String(form.get("password") ?? ""), String(form.get("code") ?? ""))) {
    return NextResponse.redirect(new URL(`${login}?e=salah`, req.url), { status: 303 });
  }
  const res = NextResponse.redirect(new URL(adminHome(req.headers.get("host")), req.url), { status: 303 });
  res.cookies.set(ADMIN_COOKIE, signAdmin(), adminCookieOptions);
  return res;
}
