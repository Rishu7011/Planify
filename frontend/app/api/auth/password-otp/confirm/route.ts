import { NextResponse } from "next/server";

import {
  normalizeEmail,
  passwordOtpsCollection,
  usersCollection,
} from "@/lib/password-auth";
import {
  hashPassword,
  hashToken,
  isStrongPassword,
  OTP_MAX_ATTEMPTS,
} from "@/lib/password-crypto";

export const runtime = "nodejs";

/**
 * Verify email OTP and set a new password.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(String(body?.email || ""));
    const otp = String(body?.otp || "").replace(/\s+/g, "");
    const password = String(body?.password || "");
    const confirmPassword = String(body?.confirmPassword || "");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { detail: "Please enter a valid email address." },
        { status: 400 },
      );
    }
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { detail: "Enter the 6-digit code from your email." },
        { status: 400 },
      );
    }
    if (password !== confirmPassword) {
      return NextResponse.json(
        { detail: "Passwords do not match." },
        { status: 400 },
      );
    }
    const strengthError = isStrongPassword(password);
    if (strengthError) {
      return NextResponse.json({ detail: strengthError }, { status: 400 });
    }

    const users = await usersCollection();
    const user = await users.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { detail: "Invalid code or email." },
        { status: 400 },
      );
    }

    const otps = await passwordOtpsCollection();
    const record = await otps.findOne({ email, purpose: "change_password" });
    if (!record || record.expires.getTime() < Date.now()) {
      return NextResponse.json(
        { detail: "Code expired or missing. Request a new one." },
        { status: 400 },
      );
    }
    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      await otps.deleteMany({ email, purpose: "change_password" });
      return NextResponse.json(
        { detail: "Too many attempts. Request a new code." },
        { status: 429 },
      );
    }

    if (record.otpHash !== hashToken(otp)) {
      await otps.updateOne(
        { _id: record._id },
        { $inc: { attempts: 1 } },
      );
      return NextResponse.json(
        { detail: "Invalid code. Check your email and try again." },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(password);
    const now = new Date();
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordHash,
          emailVerified: user.emailVerified || now,
          updatedAt: now,
        },
      },
    );
    await otps.deleteMany({ email, purpose: "change_password" });

    return NextResponse.json({
      ok: true,
      message: "Password updated. You can sign in with your new password.",
    });
  } catch (err) {
    console.error("[password-otp/confirm]", err);
    return NextResponse.json(
      { detail: "Could not update password. Please try again." },
      { status: 500 },
    );
  }
}
