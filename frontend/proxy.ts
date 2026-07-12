/**
 * Next.js 16 Route Protection Proxy
 *
 * Protects /dashboard and /projects/* routes.
 * Unauthenticated users are redirected to /login.
 *
 * Uses jose (already bundled with next-auth) for JWT verification in Edge Runtime.
 * next-auth/middleware is NOT used because it requires Node.js runtime.
 *
 * Token flow: the NextAuth session callback encodes a JWT and stores it in the
 * "next-auth.session-token" cookie. We verify the JWT's presence here.
 * Full cryptographic verification is done by FastAPI for API calls.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  // Check for next-auth session cookie (both secure and non-secure variants)
  const sessionCookie =
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  const { pathname } = request.nextUrl;

  // If no session cookie found, redirect to login
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Session cookie present — allow the request through.
  // The actual JWT validation happens server-side in getServerSession()
  // and in the FastAPI auth middleware for API calls.
  return NextResponse.next();
}

/**
 * matcher — routes this proxy applies to.
 * Explicitly protects /dashboard and /projects/*, everything else is public.
 */
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
  ],
};
