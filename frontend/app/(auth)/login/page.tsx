'use client';

import React, { useEffect, useState, Suspense, FormEvent } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { Mail, ArrowRight, Lock } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { AuthShell } from '@/components/auth/AuthShell';
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
  const registered = searchParams.get('registered') === '1';
  const passwordUpdated = searchParams.get('passwordUpdated') === '1';
  const callbackUrl = safeCallbackUrl(
    searchParams.get('callbackUrl'),
    DEFAULT_LOGIN_REDIRECT,
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam === 'CredentialsSignin'
      ? 'Invalid email or password.'
      : errorParam
        ? 'An error occurred during authentication. Please try again.'
        : null
  );

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(callbackUrl);
    }
  }, [status, callbackUrl, router]);

  const handlePasswordLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      });
      if (res?.error) {
        setError('Invalid email or password.');
        return;
      }
      router.replace(callbackUrl);
      router.refresh();
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
    <AuthShell
      title={
        <>
          Planify{' '}
          <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            AI
          </span>
        </>
      }
      subtitle="Sign in with your email and password"
      footer={
        <>
          New here?{' '}
          <Link href={ROUTES.signup} className="text-purple-400 hover:text-purple-300 underline underline-offset-4">
            Create an account
          </Link>
          {' · '}
          <Link href={ROUTES.home} className="hover:text-gray-300 underline underline-offset-4">
            Home
          </Link>
        </>
      }
    >
      {registered && !error && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm text-center">
          Password saved. Sign in with your email and password.
        </div>
      )}

      {passwordUpdated && !error && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm text-center">
          Password updated. Sign in with your new password.
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

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

      <form onSubmit={handlePasswordLogin} className="space-y-4">
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
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="w-full bg-white/5 border border-white/10 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 outline-none transition duration-200"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Password
            </label>
            <Link
              href={ROUTES.forgotPassword}
              className="text-[11px] text-purple-400 hover:text-purple-300 underline underline-offset-2"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
              <Lock className="h-5 w-5" />
            </span>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete="current-password"
              required
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              <span>Sign in</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
    </AuthShell>
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
