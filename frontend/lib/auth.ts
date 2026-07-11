import { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
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
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
        // Mark as brand new user for the signIn callback below
        token.isNewUser = true;
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        // We expose the raw JWT sub so backend can validate; in production use a separate access token
        // For now, store a simple Bearer identifier derived from token
        session.user.accessToken = token.sub as string;
      }
      return session;
    },

    async signIn({ user, account, profile }) {
      // After DB adapter writes the user, auto-create personal workspace
      // We call the backend fire-and-forget style (don't fail sign-in if this errors)
      try {
        const { encode } = await import("next-auth/jwt");
        const secret = process.env.NEXTAUTH_SECRET || "";
        const token = await encode({
          token: { sub: user.id, email: user.email },
          secret,
        });
        await fetch(`${API_URL}/auth/signup/complete`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Non-blocking — workspace created lazily on first project creation too
      }
      return true;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
