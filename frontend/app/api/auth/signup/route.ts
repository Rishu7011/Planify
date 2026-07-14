import { NextResponse } from "next/server";

import { sendSetPasswordEmail } from "@/lib/mail";
import {
  normalizeEmail,
  passwordSetupTokensCollection,
  usersCollection,
} from "@/lib/password-auth";
import { createSetupToken } from "@/lib/password-crypto";

export const runtime = "nodejs";

function appBaseUrl(request: Request): string {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    new URL(request.url).origin
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body?.name || "").trim();
    const email = normalizeEmail(String(body?.email || ""));

    if (!name || name.length < 2) {
      return NextResponse.json(
        { detail: "Please enter your full name (at least 2 characters)." },
        { status: 400 },
      );
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { detail: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    const users = await usersCollection();
    const existing = await users.findOne({ email });

    if (existing?.passwordHash) {
      return NextResponse.json(
        { detail: "An account with this email already exists. Please sign in." },
        { status: 409 },
      );
    }

    if (!existing) {
      const now = new Date();
      await users.insertOne({
        name,
        email,
        emailVerified: null,
        image: null,
        passwordHash: null,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      await users.updateOne(
        { _id: existing._id },
        { $set: { name, updatedAt: new Date() } },
      );
    }

    const { rawToken, tokenHash, expires } = createSetupToken();
    const tokens = await passwordSetupTokensCollection();
    await tokens.deleteMany({ email });
    await tokens.insertOne({
      email,
      name,
      tokenHash,
      expires,
      createdAt: new Date(),
    });

    const setPasswordUrl = `${appBaseUrl(request)}/set-password?token=${encodeURIComponent(rawToken)}`;
    await sendSetPasswordEmail({ to: email, name, setPasswordUrl });

    return NextResponse.json({
      ok: true,
      message: "Check your email for a link to set your password.",
    });
  } catch (err: any) {
    console.error("[signup]", err);
    const message =
      typeof err?.message === "string" && err.message.includes("Email server")
        ? "Email is not configured on the server. Please contact support."
        : "Could not create your account. Please try again.";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
