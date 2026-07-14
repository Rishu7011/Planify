"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import React from "react";

import { appEntryHref, ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

type AppEntryCtaProps = {
  /** Label when the visitor is signed out. */
  guestLabel?: string;
  /** Label when the visitor is signed in. */
  authLabel?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Prefer a plain dashboard link (no login fallback) when already auth. */
  preferDashboard?: boolean;
  onClick?: () => void;
  /** Optional icon rendered to the right of the label. */
  iconRight?: React.ReactNode;
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
  style,
  preferDashboard = true,
  onClick,
  iconRight,
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
    <Link href={href} className={cn("inline-flex items-center gap-2", className)} style={style} onClick={onClick}>
      {isAuthed ? authLabel : guestLabel}
      {iconRight}
    </Link>
  );
}
