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
    <div className="relative min-h-[100svh] flex items-center justify-center bg-[#050816] text-white px-4 py-6 sm:py-8 overflow-hidden">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="bg-[#0b0e22]/65 backdrop-blur-2xl border border-white/10 rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 md:p-10 shadow-[0_0_80px_rgba(124,58,237,0.15)]">
          <div className="flex flex-col items-center mb-6 sm:mb-8">
            <Link
              href={ROUTES.home}
              className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-purple-500/30 mb-4"
            >
              <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-center">{title}</h1>
            <p className="text-gray-400 text-sm mt-2 text-center">{subtitle}</p>
          </div>
          {children}
          {footer && <div className="mt-8 text-center text-xs text-gray-500">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
