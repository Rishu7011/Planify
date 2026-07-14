import { NextResponse } from "next/server";

import {
  passwordSetupTokensCollection,
} from "@/lib/password-auth";
import { hashToken } from "@/lib/password-crypto";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawToken = searchParams.get("token") || "";

  if (!rawToken) {
    return NextResponse.json({ detail: "Missing token." }, { status: 400 });
  }

  const tokens = await passwordSetupTokensCollection();
  const record = await tokens.findOne({ tokenHash: hashToken(rawToken) });

  if (!record || record.expires.getTime() < Date.now()) {
    return NextResponse.json(
      { detail: "This link is invalid or has expired. Please sign up again." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    email: record.email,
    name: record.name,
  });
}
