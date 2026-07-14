"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowRight, Mail, User } from "lucide-react";

import { AuthShell } from "@/components/auth/AuthShell";
import { loginHref, ROUTES } from "@/lib/routes";

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
      <div className="min-h-screen flex items-center justify-center bg-[#050816] text-white">
        <div className="h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthShell
      title={
        <>
          Create your{" "}
          <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Planify
          </span>{" "}
          account
        </>
      }
      subtitle="Enter your name and email — we’ll send a link to set your password."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={loginHref()}
            className="text-purple-400 hover:text-purple-300 underline underline-offset-4"
          >
            Sign in
          </Link>
          {" · "}
          <Link
            href={ROUTES.home}
            className="hover:text-gray-300 underline underline-offset-4"
          >
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
          <p className="text-gray-400 text-sm px-2">
            We sent a set-password link to{" "}
            <span className="text-white font-medium">{email}</span>. Open it to
            create your password, then sign in.
          </p>
          <button
            type="button"
            onClick={() => setSent(false)}
            className="mt-6 text-sm text-purple-400 hover:text-purple-300 underline underline-offset-4"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2"
            >
              Full name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
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
                className="w-full bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2"
            >
              Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
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
                className="w-full bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 outline-none transition"
              />
            </div>
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
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-gray-500 pt-1">
            By continuing you agree to receive a one-time setup email.
          </p>
        </form>
      )}
    </AuthShell>
  );
}
