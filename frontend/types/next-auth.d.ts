/**
 * Extends next-auth types to include custom fields on the Session user object.
 *
 * session.user.id          — MongoDB ObjectId of the user
 * session.user.accessToken — signed HS256 JWT for FastAPI authorization
 */
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      /** Signed HS256 JWT — send as Authorization: Bearer <accessToken> to FastAPI */
      accessToken: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string;
    email?: string | null;
    name?: string | null;
  }
}
