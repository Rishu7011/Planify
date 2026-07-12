/**
 * Auth.js (NextAuth) configuration.
 *
 * Auth strategy:
 * - MongoDB adapter stores users/sessions in the planify DB.
 * - JWT session strategy (no DB session lookup on every request).
 * - Each session includes a signed HS256 access token that the FastAPI
 *   backend can verify using the shared NEXTAUTH_SECRET.
 *
 * Token flow:
 *   1. User signs in (Google OAuth or Magic Link).
 *   2. NextAuth JWT callback stores user.id in token.sub.
 *   3. NextAuth session callback encodes a signed HS256 JWT containing
 *      { sub, email, name } and stores it as session.user.accessToken.
 *   4. Frontend sends Authorization: Bearer <accessToken> to FastAPI.
 *   5. FastAPI middleware verifies the HS256 signature using JWT_SECRET
 *      (must match NEXTAUTH_SECRET) and extracts user claims.
 */

import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import EmailProvider from "next-auth/providers/email";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "./mongodb";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const authOptions: AuthOptions = {
  adapter: MongoDBAdapter(clientPromise),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),

    // GitHub OAuth — credentials added when ready
    ...(process.env.GITHUB_CLIENT_ID
      ? [
          GithubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
          }),
        ]
      : []),

    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT || 587),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM || "noreply@planify.com",
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    /**
     * jwt — runs on every token creation/refresh.
     * Stores user id, email, and name in the token so they survive across requests.
     */
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email ?? token.email;
        token.name = user.name ?? token.name;
      }
      return token;
    },

    /**
     * session — runs on every getSession() / useSession() call.
     * Encodes a signed HS256 JWT that the FastAPI backend can verify.
     * This accessToken is what gets sent as Authorization: Bearer <token>.
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;

        // Encode a proper HS256 JWT so FastAPI can cryptographically verify it.
        // This token contains: sub (userId), email, name, iat, exp.
        try {
          const { SignJWT } = await import("jose");
          const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "");
          const accessToken = await new SignJWT({
            sub: token.sub,
            email: token.email,
            name: token.name,
          })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("24h")
            .sign(secret);
          session.user.accessToken = accessToken;
        } catch (err) {
          // Fallback: pass token.sub directly (FastAPI middleware has a workaround)
          console.error("[auth] Failed to encode access token:", err);
          session.user.accessToken = token.sub as string;
        }
      }
      return session;
    },

    /**
     * signIn — called after successful authentication.
     * Auto-creates the user's personal workspace on first sign-in.
     * Non-blocking: if this fails, the user still gets signed in.
     */
    async signIn({ user }) {
      try {
        const { SignJWT } = await import("jose");
        const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "");
        const token = await new SignJWT({
          sub: user.id,
          email: user.email,
        })
          .setProtectedHeader({ alg: "HS256" })
          .setIssuedAt()
          .setExpirationTime("5m")
          .sign(secret);
        await fetch(`${API_URL}/auth/signup/complete`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("[auth] Failed to complete signup:", err);
        // Non-blocking — workspace created lazily on first project creation too
      }
      return true;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
