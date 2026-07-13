/**
 * Next.js 16 Route Protection Proxy
 *
 * Protects /dashboard and /projects/* routes.
 * Unauthenticated users are redirected to /login.
 *
 * Uses next-auth/jwt getToken() — the official edge-compatible way to verify
 * NextAuth JWE-encrypted session tokens without needing Node.js runtime.
 */

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // getToken decrypts the JWE session cookie using NEXTAUTH_SECRET
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // No valid session → redirect to login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Valid session — pass through
  return NextResponse.next();
}

/**
 * matcher — routes this proxy applies to.
 * Explicitly protects /dashboard and /projects/* — everything else is public.
 */
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
  ],
};

