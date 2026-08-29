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
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://cloud.umami.is https://www.googletagmanager.com${scriptExtra}`,
    "style-src 'self' 'unsafe-inline'", // Tailwind + inline style attributes
    "img-src 'self' data: https:", // OG cards + remote logos
    "font-src 'self' data:",
    // SSE board stream + Umami + Google Analytics 4 (beacons hit www. + regional *.google-analytics.com)
    "connect-src 'self' https://cloud.umami.is https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com",
    "frame-src https://cloud.umami.is https://www.googletagmanager.com", // Umami embed + GTM <noscript>
    "frame-ancestors 'none'", // no clickjacking (papan tak boleh di-iframe)
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join("; ");

  const reqHeaders = new Headers(req.headers);
  reqHeaders.set("x-nonce", nonce);
  reqHeaders.set("content-security-policy", csp);
  const nextOpts = { request: { headers: reqHeaders } };

  // Host routing: admin is served from the adm.* subdomain (clean root), and the
  // old /admin path is hidden (404) on the public production domain.
  const host = req.headers.get("host") ?? "";
  const { pathname } = req.nextUrl;
  let res: NextResponse;

  if (host.startsWith("adm.")) {
    // adm.panjat.id → /admin, /masuk → /admin/masuk. /api and /_next pass through
    // (so /api/admin actions + framework assets work); everything else 404s under
    // /admin, which also keeps the public app off the admin host.
    if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
      res = NextResponse.next(nextOpts);
    } else {
      const url = req.nextUrl.clone();
      url.pathname = pathname === "/" ? "/admin" : `/admin${pathname}`;
      res = NextResponse.rewrite(url, nextOpts);
    }
  } else if (
    (host === "www.panjat.id" || host === "panjat.id") &&
    (pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin"))
  ) {
    // Admin lives only on adm.panjat.id — hide it on the public domain.
    const url = req.nextUrl.clone();
    url.pathname = "/_admin-hidden-404";
    res = NextResponse.rewrite(url, nextOpts);
  } else {
    res = NextResponse.next(nextOpts);
  }

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
