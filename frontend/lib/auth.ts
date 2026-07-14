/**
 * Auth.js (NextAuth) configuration.
 *
 * Providers:
 * - Google OAuth
 * - Email/password (Credentials) after signup + set-password flow
 * - Optional GitHub when env is present
 *
 * Sessions use JWT strategy. Each session includes a signed HS256 accessToken
 * for the FastAPI backend (must share NEXTAUTH_SECRET / JWT_SECRET).
 */

import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";

import clientPromise from "./mongodb";
import { normalizeEmail, usersCollection } from "./password-auth";
import { verifyPassword } from "./password-crypto";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const authOptions: AuthOptions = {
  adapter: MongoDBAdapter(clientPromise),

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),

    ...(process.env.GITHUB_CLIENT_ID
      ? [
          GithubProvider({
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
          }),
        ]
      : []),

    CredentialsProvider({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = normalizeEmail(String(credentials?.email || ""));
        const password = String(credentials?.password || "");
        if (!email || !password) return null;

        const users = await usersCollection();
        const user = await users.findOne({ email });
        if (!user?.passwordHash) return null;

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name || user.email,
          image: user.image || null,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  pages: {
    signIn: "/login",
    error: "/login",
    newUser: "/dashboard",
  },

  callbacks: {
    async redirect({ url, baseUrl }) {
      const { DEFAULT_LOGIN_REDIRECT, safeCallbackUrl } = await import("./routes");
      if (url.startsWith("/")) {
        return `${baseUrl}${safeCallbackUrl(url)}`;
      }
      if (url.startsWith(baseUrl)) {
        const path = url.slice(baseUrl.length) || DEFAULT_LOGIN_REDIRECT;
        return `${baseUrl}${safeCallbackUrl(path)}`;
      }
      return `${baseUrl}${DEFAULT_LOGIN_REDIRECT}`;
    },

    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email ?? token.email;
        token.name = user.name ?? token.name;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;

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
          console.error("[auth] Failed to encode access token:", err);
          session.user.accessToken = token.sub as string;
        }
      }
      return session;
    },

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
      }
      return true;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};
