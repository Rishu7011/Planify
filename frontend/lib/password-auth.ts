/**
 * Shared Mongo helpers for custom auth flows (signup / set-password).
 */

import type { Db, Collection, ObjectId } from "mongodb";

import clientPromise from "@/lib/mongodb";

export type AuthUserDoc = {
  _id?: ObjectId;
  name?: string | null;
  email: string;
  emailVerified?: Date | null;
  image?: string | null;
  passwordHash?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type PasswordSetupTokenDoc = {
  _id?: ObjectId;
  email: string;
  name: string;
  tokenHash: string;
  expires: Date;
  createdAt: Date;
};

export type PasswordOtpDoc = {
  _id?: ObjectId;
  email: string;
  otpHash: string;
  purpose: "change_password";
  attempts: number;
  expires: Date;
  createdAt: Date;
};

export async function getAuthDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db();
}

export async function usersCollection(): Promise<Collection<AuthUserDoc>> {
  const db = await getAuthDb();
  return db.collection<AuthUserDoc>("users");
}

export async function passwordSetupTokensCollection(): Promise<
  Collection<PasswordSetupTokenDoc>
> {
  const db = await getAuthDb();
  return db.collection<PasswordSetupTokenDoc>("password_setup_tokens");
}

export async function passwordOtpsCollection(): Promise<Collection<PasswordOtpDoc>> {
  const db = await getAuthDb();
  return db.collection<PasswordOtpDoc>("password_otps");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
