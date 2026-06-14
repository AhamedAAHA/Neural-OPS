import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ORGANIZATION_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/lib/auth/constants";

const PROTECTED_PREFIXES = [
  "/command-center",
  "/investigation",
  "/decision-war-room",
  "/evidence",
  "/voice",
  "/intelligence",
  "/knowledge",
  "/risk-simulation",
  "/executive-report",
  "/executive-intelligence",
  "/compliance",
  "/agents",
  "/ai-ops",
  "/audit",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith("/api/");
  const isAuthApi = pathname.startsWith("/api/auth/");
  const isHealthApi =
    pathname === "/api/health" ||
    pathname === "/api/readiness" ||
    pathname === "/api/liveness";

  const withSecurityHeaders = (response: NextResponse) => {
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Permissions-Policy", "camera=(), microphone=(self), geolocation=()");
    response.headers.set(
      "Content-Security-Policy",
      "default-src 'self'; img-src 'self' data: https:; media-src 'self' blob: data:; script-src 'self' blob: 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; script-src-elem 'self' blob: 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:; child-src 'self' blob:; connect-src 'self' https: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    );
    return response;
  };

  if (isApiRoute && !isAuthApi && !isHealthApi) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return withSecurityHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }));

    const orgCookie = request.cookies.get(ORGANIZATION_COOKIE_NAME)?.value;
    const orgHeader = request.headers.get("x-organization-id");
    if (!orgCookie && !orgHeader) {
      return withSecurityHeaders(
        NextResponse.json(
          { error: "Missing tenant context. Select an organization before calling this API." },
          { status: 400 }
        )
      );
    }

    const requestHeaders = new Headers(request.headers);
    if (!orgHeader && orgCookie) {
      requestHeaders.set("x-organization-id", orgCookie);
    }
    return withSecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }));
  }

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  if (!isProtected) return withSecurityHeaders(NextResponse.next());

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    const orgCookie = request.cookies.get(ORGANIZATION_COOKIE_NAME)?.value;
    if (!orgCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      loginUrl.searchParams.set("reason", "organization_required");
      return withSecurityHeaders(NextResponse.redirect(loginUrl));
    }
    return withSecurityHeaders(NextResponse.next());
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return withSecurityHeaders(NextResponse.redirect(loginUrl));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
