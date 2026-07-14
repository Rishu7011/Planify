"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

import { AuthShell } from "@/components/auth/AuthShell";
import { ChangePasswordOtpForm } from "@/components/auth/ChangePasswordOtpForm";
import { loginHref, ROUTES } from "@/lib/routes";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      // Logged-in users change password from Settings.
      router.replace(ROUTES.dashboard);
    }
  }, [status, router]);

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050816] text-white">
        <div className="h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthShell
      title="Change password"
      subtitle="We'll email a one-time code to verify it's you, then you can set a new password."
      footer={
        <>
          Remembered it?{" "}
          <Link
            href={loginHref()}
            className="text-purple-400 hover:text-purple-300 underline underline-offset-4"
          >
            Sign in
          </Link>
          {" · "}
          <Link
            href={ROUTES.signup}
            className="hover:text-gray-300 underline underline-offset-4"
          >
            Sign up
          </Link>
        </>
      }
    >
      <ChangePasswordOtpForm
        successRedirectHint="You can now sign in with your new password."
        onSuccess={() => {
          window.setTimeout(() => {
            router.push("/login?passwordUpdated=1");
          }, 1200);
        }}
      />
    </AuthShell>
  );
}
