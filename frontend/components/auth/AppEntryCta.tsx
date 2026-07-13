"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

import { appEntryHref, ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

type AppEntryCtaProps = {
  /** Label when the visitor is signed out. */
  guestLabel?: string;
  /** Label when the visitor is signed in. */
  authLabel?: string;
  className?: string;
  /** Prefer a plain dashboard link (no login fallback) when already auth. */
  preferDashboard?: boolean;
  onClick?: () => void;
};

/**
 * Primary marketing CTA:
 * - Guest → /login?callbackUrl=/dashboard
 * - Signed in → /dashboard
 */
export function AppEntryCta({
  guestLabel = "Get Started",
  authLabel = "Go to Dashboard",
  className,
  preferDashboard = true,
  onClick,
}: AppEntryCtaProps) {
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated" && Boolean(session);

  if (status === "loading") {
    return (
      <span
        className={cn(
          "inline-flex h-12 min-w-[10rem] items-center justify-center rounded-lg bg-white/10 animate-pulse",
          className,
        )}
        aria-hidden
      />
    );
  }

  const href =
    isAuthed && preferDashboard
      ? ROUTES.dashboard
      : appEntryHref(isAuthed);

  return (
    <Link href={href} className={className} onClick={onClick}>
      {isAuthed ? authLabel : guestLabel}
    </Link>
  );
}
