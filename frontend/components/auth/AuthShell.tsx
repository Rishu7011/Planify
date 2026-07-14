"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { ROUTES } from "@/lib/routes";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: ReactNode;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative min-h-[100svh] flex items-center justify-center bg-[#111315] text-white px-4 py-6 sm:py-8 overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none"
        style={{ background: "oklch(0.55 0.09 195 / 0.12)" }} />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none"
        style={{ background: "oklch(0.75 0.12 190 / 0.08)" }} />
      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="bg-[#191D20]/70 backdrop-blur-2xl border border-white/10 rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 md:p-10 shadow-[0_0_80px_oklch(0.55_0.09_195_/_0.15)]">
          <div className="flex flex-col items-center mb-6 sm:mb-8">
            <Link
              href={ROUTES.home}
              className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl shadow-[0_0_24px_oklch(0.6_0.1_195/0.5)] mb-4 transition-shadow hover:shadow-[0_0_36px_oklch(0.6_0.1_195/0.7)]"
              style={{ background: "linear-gradient(135deg, oklch(0.55 0.09 195), oklch(0.75 0.12 190))" }}
            >
              <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-[#0d1210]" />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-center">{title}</h1>
            <p className="text-[#9BA3AF] text-sm mt-2 text-center">{subtitle}</p>
          </div>
          {children}
          {footer && <div className="mt-8 text-center text-xs text-[#9BA3AF]">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
