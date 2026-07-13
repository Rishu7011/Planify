/**
 * Next.js 16 Route Proxy — auth gate for the marketing site + app.
 *
 * Rules (optimistic cookie/JWT check via next-auth getToken):
 * 1. Protected app routes  → require session, else /login?callbackUrl=…
 * 2. Auth pages (/login)   → if already signed in, go to dashboard
 * 3. Landing (/)           → always public (CTA buttons handle entry)
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import {
  DEFAULT_LOGIN_REDIRECT,
  isAuthPage,
  isProtectedPath,
  loginHref,
  ROUTES,
  safeCallbackUrl,
} from "@/lib/routes";

export default async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const isAuthenticated = Boolean(token);

  // ── Protected app surface ────────────────────────────────────────────────
  if (isProtectedPath(pathname)) {
    if (!isAuthenticated) {
      const url = new URL(loginHref(pathname), request.url);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // ── Login / auth pages ───────────────────────────────────────────────────
  if (isAuthPage(pathname) && isAuthenticated) {
    const dest = safeCallbackUrl(
      searchParams.get("callbackUrl"),
      DEFAULT_LOGIN_REDIRECT,
    );
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Landing and other public routes
  if (pathname === ROUTES.home) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/login/:path*",
    "/dashboard",
    "/dashboard/:path*",
    "/projects",
    "/projects/:path*",
  ],
};
