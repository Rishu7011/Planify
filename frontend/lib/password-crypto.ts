/**
 * Password hashing + signup token helpers.
 */

import { createHash, randomBytes } from "crypto";

import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;
const TOKEN_TTL_MS = 1000 * 60 * 60; // 1 hour
const OTP_TTL_MS = 1000 * 60 * 10; // 10 minutes
export const OTP_MAX_ATTEMPTS = 5;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function createSetupToken(): { rawToken: string; tokenHash: string; expires: Date } {
  const rawToken = randomBytes(32).toString("hex");
  return {
    rawToken,
    tokenHash: hashToken(rawToken),
    expires: new Date(Date.now() + TOKEN_TTL_MS),
  };
}

/** 6-digit numeric OTP for password change / reset. */
export function createPasswordOtp(): { otp: string; otpHash: string; expires: Date } {
  const otp = String(randomBytes(3).readUIntBE(0, 3) % 1_000_000).padStart(6, "0");
  return {
    otp,
    otpHash: hashToken(otp),
    expires: new Date(Date.now() + OTP_TTL_MS),
  };
}

export function isStrongPassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must include at least one letter and one number.";
  }
  return null;
}
