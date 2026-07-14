"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { loginHref, ROUTES } from "@/lib/routes";

const fieldClass =
  "w-full bg-white/5 border border-white/10 focus:border-[oklch(0.75_0.12_190_/_0.5)] focus:ring-1 focus:ring-[oklch(0.75_0.12_190_/_0.3)] rounded-xl py-3 pl-12 pr-4 text-white placeholder-[#9BA3AF] outline-none transition";

const btnPrimary =
  "w-full flex items-center justify-center gap-2 font-semibold rounded-xl py-3.5 transition active:scale-[0.98] disabled:opacity-50 text-[#0d1210] shadow-[0_0_24px_oklch(0.6_0.1_195/0.3)] hover:shadow-[0_0_36px_oklch(0.6_0.1_195/0.5)]";

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#111315] text-white gap-3">
        <div className="h-8 w-8 border-2 border-white/20 rounded-full animate-spin"
          style={{ borderTopColor: "oklch(0.75 0.12 190)" }} />
        <p className="text-sm text-[#9BA3AF]">Verifying your link…</p>
      </div>
    );
  }

  if (tokenError) {
    return (
      <AuthShell
        title="Link expired"
        subtitle={tokenError}
        footer={
          <Link href={ROUTES.signup}
            className="underline underline-offset-4 hover:opacity-80 transition-opacity"
            style={{ color: "oklch(0.75 0.12 190)" }}>
            Sign up again
          </Link>
        }
      >
        <Link
          href={ROUTES.signup}
          className="w-full flex items-center justify-center gap-2 font-semibold rounded-xl py-3.5 text-[#0d1210]"
          style={{ background: "linear-gradient(135deg, oklch(0.55 0.09 195), oklch(0.75 0.12 190))" }}
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
          After this you'll sign in at{" "}
          <Link href={loginHref()}
            className="underline underline-offset-4 hover:opacity-80 transition-opacity"
            style={{ color: "oklch(0.75 0.12 190)" }}>
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
          <label htmlFor="password" className="block text-xs font-semibold text-[#9BA3AF] uppercase tracking-wider mb-2">
            Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[#9BA3AF]">
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
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="confirm" className="block text-xs font-semibold text-[#9BA3AF] uppercase tracking-wider mb-2">
            Confirm password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-[#9BA3AF]">
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
              className={fieldClass}
            />
          </div>
          <p className="mt-2 text-[11px] text-[#9BA3AF]">
            Use at least 8 characters with a letter and a number.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={btnPrimary}
          style={{ background: "linear-gradient(135deg, oklch(0.55 0.09 195), oklch(0.75 0.12 190))" }}
        >
          {loading ? (
            <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <span>Save password &amp; continue</span>
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
        <div className="min-h-screen flex items-center justify-center bg-[#111315] text-white">
          <div className="h-8 w-8 border-2 border-white/20 rounded-full animate-spin"
            style={{ borderTopColor: "oklch(0.75 0.12 190)" }} />
        </div>
      }
    >
      <SetPasswordForm />
    </Suspense>
  );
}
