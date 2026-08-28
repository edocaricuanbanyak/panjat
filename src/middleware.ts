import { NextResponse, type NextRequest } from "next/server";

/**
 * Security headers (§18.1, §18.5). Nonce-based CSP so third-party sponsor
 * content on public pages can never run scripts; Next propagates the nonce to
 * its own framework scripts automatically. Dev allows unsafe-eval for HMR.
 */
export function middleware(req: NextRequest) {
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
  const dev = process.env.NODE_ENV !== "production";
  const scriptExtra = dev ? " 'unsafe-eval' 'unsafe-inline'" : "";

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://cloud.umami.is${scriptExtra}`,
    "style-src 'self' 'unsafe-inline'", // Tailwind + inline style attributes
    "img-src 'self' data: https:", // OG cards + remote logos
    "font-src 'self' data:",
    "connect-src 'self' https://cloud.umami.is", // SSE board stream + Umami analytics
    "frame-src https://cloud.umami.is", // Umami share dashboard embed on /statistik
    "frame-ancestors 'none'", // no clickjacking (papan tak boleh di-iframe)
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");

  const reqHeaders = new Headers(req.headers);
  reqHeaders.set("x-nonce", nonce);
  reqHeaders.set("content-security-policy", csp);

  const res = NextResponse.next({ request: { headers: reqHeaders } });

  // Provision a visitor id for public presence counting (online + total). Not
  // security-sensitive and never touches money/ranking — just a stable counter id.
  if (!req.cookies.get("panjat_vid")) {
    res.cookies.set("panjat_vid", crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      secure: !dev,
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  res.headers.set("content-security-policy", csp);
  res.headers.set("x-content-type-options", "nosniff");
  res.headers.set("x-frame-options", "DENY");
  res.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  res.headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
  if (!dev) {
    res.headers.set("strict-transport-security", "max-age=31536000; includeSubDomains; preload");
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
