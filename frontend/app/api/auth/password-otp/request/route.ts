import { NextResponse } from "next/server";

import { sendPasswordOtpEmail } from "@/lib/mail";
import {
  normalizeEmail,
  passwordOtpsCollection,
  usersCollection,
} from "@/lib/password-auth";
import { createPasswordOtp } from "@/lib/password-crypto";

export const runtime = "nodejs";

/**
 * Request a 6-digit OTP to change/reset password.
 * Always returns a generic success message (no account enumeration).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(String(body?.email || ""));

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { detail: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    const users = await usersCollection();
    const user = await users.findOne({ email });

    // Only send when an account exists — still reply generically either way.
    if (user) {
      const { otp, otpHash, expires } = createPasswordOtp();
      const otps = await passwordOtpsCollection();
      await otps.deleteMany({ email, purpose: "change_password" });
      await otps.insertOne({
        email,
        otpHash,
        purpose: "change_password",
        attempts: 0,
        expires,
        createdAt: new Date(),
      });

      await sendPasswordOtpEmail({
        to: email,
        name: user.name || undefined,
        otp,
      });
    }

    return NextResponse.json({
      ok: true,
      message:
        "If an account exists for that email, we sent a 6-digit code. It expires in 10 minutes.",
    });
  } catch (err: any) {
    console.error("[password-otp/request]", err);
    const message =
      typeof err?.message === "string" && err.message.includes("Email server")
        ? "Email is not configured on the server. Please contact support."
        : "Could not send code. Please try again.";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
