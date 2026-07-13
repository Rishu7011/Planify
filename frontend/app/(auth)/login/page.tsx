'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { Sparkles, Mail, ArrowRight } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import {
  DEFAULT_LOGIN_REDIRECT,
  ROUTES,
  safeCallbackUrl,
} from '@/lib/routes';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const errorParam = searchParams.get('error');
  const callbackUrl = safeCallbackUrl(
    searchParams.get('callbackUrl'),
    DEFAULT_LOGIN_REDIRECT,
  );

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam ? "An error occurred during authentication. Please try again." : null
  );

  // Proxy also handles this; client redirect covers race after soft nav.
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(callbackUrl);
    }
  }, [status, callbackUrl, router]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);
    setIsSent(false);

    try {
      const res = await signIn('email', {
        email,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        setError(res.error === 'Configuration' ? 'Email provider is not configured properly.' : res.error);
      } else {
        setIsSent(true);
      }
    } catch {
      setError('An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl });
  };

  if (status === 'authenticated' || status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050816] text-white gap-3">
        <div className="h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">
          {status === 'authenticated' ? 'Taking you to your dashboard…' : 'Checking session…'}
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#050816] text-white px-4 overflow-hidden">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="bg-[#0b0e22]/65 backdrop-blur-2xl border border-white/10 rounded-[32px] p-8 shadow-[0_0_80px_rgba(124,58,237,0.15)] md:p-10">
          <div className="flex flex-col items-center mb-8">
            <Link href={ROUTES.home} className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-purple-500/30 mb-4">
              <Sparkles className="h-7 w-7 text-white" />
            </Link>
            <h1 className="text-3xl font-bold text-center">
              Planify{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                AI
              </span>
            </h1>
            <p className="text-gray-400 text-sm mt-2 text-center">
              Sign in to open your dashboard and continue building
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {isSent ? (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4">
                <Mail className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Check your email</h3>
              <p className="text-gray-400 text-sm px-4">
                A sign-in link has been sent to <span className="text-white font-medium">{email}</span>. After you click it, you&apos;ll land on your dashboard.
              </p>
              <button
                onClick={() => setIsSent(false)}
                className="mt-6 text-sm text-purple-400 hover:text-purple-300 underline underline-offset-4"
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
                    fill="#EA4335"
                    d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.34 0-6.05-2.71-6.05-6.05s2.71-6.05 6.05-6.05c1.493 0 2.858.543 3.918 1.437l3.107-3.107C18.89 2.766 15.8 1.5 12.24 1.5 6.27 1.5 1.5 6.27 1.5 12.24s4.77 10.74 10.74 10.74c5.96 0 10.4-4.184 10.4-10.4 0-.712-.064-1.403-.18-2.072H12.24Z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="relative flex py-5 items-center">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink mx-4 text-gray-500 text-xs uppercase tracking-wider font-semibold">Or</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                      <Mail className="h-5 w-5" />
                    </span>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      autoComplete="email"
                      inputMode="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="w-full bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 outline-none transition duration-200"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 active:scale-[0.98] disabled:opacity-50 text-white font-semibold rounded-xl py-3.5 transition duration-200 cursor-pointer shadow-lg shadow-purple-500/20"
                >
                  {isLoading ? (
                    <div className="h-5 w-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Send Magic Link</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          <p className="mt-8 text-center text-xs text-gray-500">
            <Link href={ROUTES.home} className="hover:text-gray-300 underline underline-offset-4">
              Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#050816] text-white">
        <div className="h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
