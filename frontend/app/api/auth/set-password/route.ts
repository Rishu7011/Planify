import { NextResponse } from "next/server";

import {
  normalizeEmail,
  passwordSetupTokensCollection,
  usersCollection,
} from "@/lib/password-auth";
import {
  hashPassword,
  hashToken,
  isStrongPassword,
} from "@/lib/password-crypto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawToken = String(body?.token || "");
    const password = String(body?.password || "");
    const confirm = String(body?.confirmPassword || "");

    if (!rawToken) {
      return NextResponse.json({ detail: "Missing token." }, { status: 400 });
    }
    if (password !== confirm) {
      return NextResponse.json(
        { detail: "Passwords do not match." },
        { status: 400 },
      );
    }
    const strengthError = isStrongPassword(password);
    if (strengthError) {
      return NextResponse.json({ detail: strengthError }, { status: 400 });
    }

    const tokens = await passwordSetupTokensCollection();
    const record = await tokens.findOne({ tokenHash: hashToken(rawToken) });
    if (!record || record.expires.getTime() < Date.now()) {
      return NextResponse.json(
        { detail: "This link is invalid or has expired. Please sign up again." },
        { status: 400 },
      );
    }

    const email = normalizeEmail(record.email);
    const users = await usersCollection();
    const user = await users.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { detail: "Account not found. Please sign up again." },
        { status: 404 },
      );
    }

    const passwordHash = await hashPassword(password);
    const now = new Date();
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          name: record.name || user.name,
          passwordHash,
          emailVerified: now,
          updatedAt: now,
        },
      },
    );

    await tokens.deleteMany({ email });

    return NextResponse.json({
      ok: true,
      message: "Password set. You can sign in now.",
    });
  } catch (err) {
    console.error("[set-password]", err);
    return NextResponse.json(
      { detail: "Could not set password. Please try again." },
      { status: 500 },
    );
  }
}
