"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { ArrowRight, Mail, User } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { loginHref, ROUTES } from "@/lib/routes";

const fieldClass =
  "w-full bg-white/5 border border-white/10 focus:border-[oklch(0.75_0.12_190_/_0.5)] focus:ring-1 focus:ring-[oklch(0.75_0.12_190_/_0.3)] rounded-xl py-3 pl-12 pr-4 text-white placeholder-[#9BA3AF] outline-none transition";

export default function SignupPage() {
  const router = useRouter();
  const { status } = useSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(ROUTES.dashboard);
    }
  }, [status, router]);

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: ROUTES.dashboard });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail || "Could not sign up. Please try again.");
        return;
      }
      setSent(true);
    } catch {
      setError("Could not sign up. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#111315] text-white">
        <div className="h-8 w-8 border-2 border-white/20 rounded-full animate-spin"
          style={{ borderTopColor: "oklch(0.75 0.12 190)" }} />
      </div>
    );
  }

  return (
    <AuthShell
      title={
        <>
          Create your{" "}
          <span style={{
            backgroundImage: "linear-gradient(135deg, oklch(0.55 0.09 195), oklch(0.75 0.12 190))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Planify
          </span>{" "}
          account
        </>
      }
      subtitle="Enter your name and email — we'll send a link to set your password."
      footer={
        <>
          Already have an account?{" "}
          <Link href={loginHref()}
            className="underline underline-offset-4 hover:opacity-80 transition-opacity"
            style={{ color: "oklch(0.75 0.12 190)" }}>
            Sign in
          </Link>
          {" · "}
          <Link href={ROUTES.home} className="hover:text-[#D7DBE2] underline underline-offset-4">
            Home
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {sent ? (
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
            <Mail className="h-6 w-6" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Check your email</h3>
          <p className="text-[#9BA3AF] text-sm px-2">
            We sent a set-password link to{" "}
            <span className="text-white font-medium">{email}</span>. Open it to
            create your password, then sign in.
          </p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="mt-6 text-sm underline underline-offset-4 hover:opacity-80 transition-opacity"
            style={{ color: "oklch(0.75 0.12 190)" }}
          >
            Use a different email
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 active:scale-[0.98] rounded-xl py-3 px-4 font-medium transition duration-200 cursor-pointer"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" width="24" height="24">
              <path
                fill="oklch(0.75 0.12 190)"
                d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.34 0-6.05-2.71-6.05-6.05s2.71-6.05 6.05-6.05c1.493 0 2.858.543 3.918 1.437l3.107-3.107C18.89 2.766 15.8 1.5 12.24 1.5 6.27 1.5 1.5 6.27 1.5 12.24s4.77 10.74 10.74 10.74c5.96 0 10.4-4.184 10.4-10.4 0-.712-.064-1.403-.18-2.072H12.24Z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-4 text-[#9BA3AF] text-xs uppercase tracking-wider font-semibold">Or</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-xs font-semibold text-[#9BA3AF] uppercase tracking-wider mb-2"
            >
              Full name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[#9BA3AF]">
                <User className="h-5 w-5" />
              </span>
              <input
                id="name"
                name="name"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                placeholder="Rishab Negi"
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-[#9BA3AF] uppercase tracking-wider mb-2"
            >
              Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[#9BA3AF]">
                <Mail className="h-5 w-5" />
              </span>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="you@example.com"
                className={fieldClass}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 font-semibold rounded-xl py-3.5 transition active:scale-[0.98] disabled:opacity-50 text-[#0d1210] shadow-[0_0_24px_oklch(0.6_0.1_195/0.3)] hover:shadow-[0_0_36px_oklch(0.6_0.1_195/0.5)]"
            style={{ background: "linear-gradient(135deg, oklch(0.55 0.09 195), oklch(0.75 0.12 190))" }}
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-[#9BA3AF] pt-1">
            By continuing you agree to receive a one-time setup email.
          </p>
          </form>
        </>
      )}
    </AuthShell>
  );
}
