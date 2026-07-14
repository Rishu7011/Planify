"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { loginHref, ROUTES } from "@/lib/routes";

function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function verify() {
      if (!token) {
        setTokenError("Missing setup token. Please sign up again.");
        setChecking(false);
        return;
      }
      try {
        const res = await fetch(
          `/api/auth/verify-setup-token?token=${encodeURIComponent(token)}`,
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) {
            setTokenError(data.detail || "Invalid or expired link.");
          }
          return;
        }
        if (!cancelled) {
          setEmail(data.email);
          setName(data.name);
        }
      } catch {
        if (!cancelled) setTokenError("Could not verify this link.");
      } finally {
        if (!cancelled) setChecking(false);
      }
    }
    verify();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail || "Could not set password.");
        return;
      }
          router.replace(`/login?registered=1`);
    } catch {
      setError("Could not set password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050816] text-white gap-3">
        <div className="h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Verifying your link…</p>
      </div>
    );
  }

  if (tokenError) {
    return (
      <AuthShell
        title="Link expired"
        subtitle={tokenError}
        footer={
          <Link href={ROUTES.signup} className="text-purple-400 hover:text-purple-300 underline underline-offset-4">
            Sign up again
          </Link>
        }
      >
        <Link
          href={ROUTES.signup}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl py-3.5"
        >
          Back to signup
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your password"
      subtitle={
        email
          ? `Almost done${name ? `, ${name.split(" ")[0]}` : ""}. Set a password for ${email}.`
          : "Choose a strong password for your account."
      }
      footer={
        <>
          After this you’ll sign in at{" "}
          <Link href={loginHref()} className="text-purple-400 hover:text-purple-300 underline underline-offset-4">
            Login
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
              <Lock className="h-5 w-5" />
            </span>
            <input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="At least 8 characters"
              className="w-full bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 outline-none transition"
            />
          </div>
        </div>

        <div>
          <label htmlFor="confirm" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Confirm password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
              <Lock className="h-5 w-5" />
            </span>
            <input
              id="confirm"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              placeholder="Repeat password"
              className="w-full bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 outline-none transition"
            />
          </div>
          <p className="mt-2 text-[11px] text-gray-500">
            Use at least 8 characters with a letter and a number.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 active:scale-[0.98] disabled:opacity-50 text-white font-semibold rounded-xl py-3.5 transition shadow-lg shadow-purple-500/20"
        >
          {loading ? (
            <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Save password & continue</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#050816] text-white">
          <div className="h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SetPasswordForm />
    </Suspense>
  );
}
