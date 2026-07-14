'use client'
import React, { useEffect, useRef, useState } from 'react'
import {
    BookOpen,
    DollarSign,
    Menu,
    Sparkles,
    X,
    Zap,
} from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion'
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

import { AppEntryCta } from '@/components/auth/AppEntryCta';
import { loginHref, ROUTES } from '@/lib/routes';

const NAV_LINKS = [
    { label: "Product",  icon: Zap,        href: "#product"  },
    { label: "Features", icon: Sparkles,   href: "#features" },
    { label: "Pricing",  icon: DollarSign, href: "#pricing"  },
    { label: "Docs",     icon: BookOpen,   href: "#docs"     },
];

const Navbar = () => {
    const [scrolled, setScrolled]       = useState(false);
    const [navVisible, setNavVisible]   = useState(true);
    const [mobileOpen, setMobileOpen]   = useState(false);
    const { data: session, status }     = useSession();
    const lastScrollY                   = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            setScrolled(currentScrollY > 20);

            if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
                setNavVisible(false);
            } else if (currentScrollY < lastScrollY.current) {
                setNavVisible(true);
            }
            lastScrollY.current = currentScrollY;
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <>
            <nav
                className={`fixed z-50 mx-auto flex items-center transition-all duration-500 ease-in-out safe-top
                    left-4 right-4 md:left-8 md:right-8
                    ${scrolled
                        ? "h-[56px] sm:h-[60px] bg-[#191D20]/80 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
                        : "h-[60px] sm:h-[68px] bg-[#191D20]/70 backdrop-blur-xl"
                    }
                    ${navVisible
                        ? "top-4 sm:top-6 opacity-100 translate-y-0"
                        : "-translate-y-[150%] top-4 sm:top-6 opacity-0 pointer-events-none"
                    }
                    max-w-[1080px] border border-white/10 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.4)]`}
                aria-label="Main navigation"
            >
                <div className="flex items-center justify-between px-4 sm:px-5 md:px-6 w-full min-w-0">

                    {/* Brand Logo */}
                    <Link
                        href={ROUTES.home}
                        className="flex items-center gap-2 cursor-pointer group min-w-0 shrink-0"
                        aria-label="Planify home"
                    >
                        <span
                            className="w-8 h-8 rounded-xl flex justify-center items-center shrink-0
                                shadow-[0_0_20px_oklch(0.6_0.1_195/0.5)]
                                group-hover:shadow-[0_0_28px_oklch(0.6_0.1_195/0.7)]
                                transition-shadow duration-300"
                            style={{ background: "linear-gradient(135deg, oklch(0.55 0.09 195), oklch(0.75 0.12 190))" }}
                        >
                            <Sparkles className="w-4 h-4 text-[#0d1210]" />
                        </span>
                        <span className="font-semibold text-slate-50 text-[15px] tracking-tight truncate">
                            Planify
                        </span>
                    </Link>

                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex items-center gap-1" role="menubar">
                        {NAV_LINKS.map(({ label, icon: Icon, href }) => (
                            <a
                                key={label}
                                href={href}
                                role="menuitem"
                                className="flex items-center gap-2 rounded-full text-[#D7DBE2] px-4 py-2 text-sm font-medium
                                    hover:bg-white/10 hover:text-white transition-colors duration-200 cursor-pointer"
                            >
                                <Icon className="w-4 h-4 shrink-0 opacity-80" />
                                {label}
                            </a>
                        ))}
                    </div>

                    {/* Nav Actions */}
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        {status === "loading" ? (
                            <div
                                className="h-8 w-8 border-2 border-white/20 border-t-white rounded-full animate-spin"
                                aria-label="Loading"
                            />
                        ) : session ? (
                            <div className="hidden md:flex items-center gap-3">
                                <div className="hidden sm:flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                                    {session.user?.image ? (
                                        <img
                                            src={session.user.image}
                                            alt={session.user.name || "User Profile"}
                                            className="h-7 w-7 rounded-full border border-white/20"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full font-bold text-xs text-white"
                                            style={{ background: "linear-gradient(135deg, oklch(0.55 0.09 195), oklch(0.75 0.12 190))" }}
                                        >
                                            {session.user?.email?.[0].toUpperCase() || "U"}
                                        </div>
                                    )}
                                    <span className="text-sm font-medium text-[#D7DBE2] max-w-[8rem] truncate">
                                        {session.user?.name || session.user?.email?.split('@')[0]}
                                    </span>
                                </div>
                                <AppEntryCta
                                    authLabel="Dashboard"
                                    guestLabel="Get Started"
                                    className="hidden md:inline-flex font-medium rounded-full text-[#0d1210] px-5 py-2.5 text-sm
                                        shadow-[0_0_24px_oklch(0.6_0.1_195/0.4)] hover:shadow-[0_0_36px_oklch(0.6_0.1_195/0.6)]
                                        hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
                                    style={{ background: "linear-gradient(135deg, oklch(0.55 0.09 195), oklch(0.75 0.12 190))" } as React.CSSProperties}
                                />
                                <button
                                    onClick={() => signOut({ callbackUrl: ROUTES.home })}
                                    className="hidden lg:inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-white
                                        bg-white/5 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-colors cursor-pointer"
                                >
                                    Sign out
                                </button>
                            </div>
                        ) : (
                            <>
                                <Link
                                    className="hidden md:inline-block font-medium text-sm text-[#D7DBE2] hover:text-white
                                        hover:bg-white/8 transition-all duration-200 px-4 py-2 rounded-full"
                                    href={loginHref()}
                                >
                                    Sign In
                                </Link>
                                <AppEntryCta
                                    guestLabel="Get Started"
                                    authLabel="Dashboard"
                                    className="hidden sm:inline-flex font-medium rounded-full text-[#0d1210] px-5 py-2.5 text-sm
                                        shadow-[0_0_24px_oklch(0.6_0.1_195/0.4)] hover:shadow-[0_0_36px_oklch(0.6_0.1_195/0.6)]
                                        hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
                                    style={{ background: "linear-gradient(135deg, oklch(0.55 0.09 195), oklch(0.75 0.12 190))" } as React.CSSProperties}
                                />
                            </>
                        )}

                        {/* Mobile Toggle */}
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="md:hidden p-2 rounded-full text-[#D7DBE2] hover:text-white hover:bg-white/10 transition-colors"
                            aria-label={mobileOpen ? "Close menu" : "Open menu"}
                            aria-expanded={mobileOpen}
                        >
                            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -16, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -16, scale: 0.97 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="fixed top-[4.5rem] sm:top-24 left-4 right-4 z-40 bg-[#191D20]/95
                            backdrop-blur-2xl border border-white/10 p-5 rounded-2xl shadow-2xl
                            flex flex-col space-y-1 md:hidden max-h-[calc(100vh-6rem)] overflow-y-auto"
                        role="menu"
                    >
                        {NAV_LINKS.map(({ label, icon: Icon, href }) => (
                            <a
                                key={label}
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-3 font-medium text-base text-[#D7DBE2] hover:text-white
                                    py-3 px-3 rounded-xl hover:bg-white/8 transition-colors border-b border-white/5 last:border-0"
                                href={href}
                                role="menuitem"
                            >
                                <Icon className="w-4 h-4 opacity-70" />
                                {label}
                            </a>
                        ))}

                        <div className="pt-2 flex flex-col gap-2">
                            {status === "loading" ? (
                                <div className="h-9 w-9 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : session ? (
                                <>
                                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                                        {session.user?.image ? (
                                            <img
                                                src={session.user.image}
                                                alt={session.user.name || "User Profile"}
                                                className="h-8 w-8 rounded-full border border-white/20"
                                                referrerPolicy="no-referrer"
                                            />
                                        ) : (
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm text-white"
                                                style={{ background: "linear-gradient(135deg, oklch(0.55 0.09 195), oklch(0.75 0.12 190))" }}
                                            >
                                                {session.user?.email?.[0].toUpperCase() || "U"}
                                            </div>
                                        )}
                                        <span className="text-sm font-medium text-[#D7DBE2]">
                                            {session.user?.name || session.user?.email?.split('@')[0]}
                                        </span>
                                    </div>
                                    <AppEntryCta
                                        authLabel="Go to Dashboard"
                                        guestLabel="Get Started"
                                        className="font-medium text-sm text-[#0d1210] px-5 py-3 rounded-xl text-center"
                                        style={{ background: "linear-gradient(135deg, oklch(0.55 0.09 195), oklch(0.75 0.12 190))" } as React.CSSProperties}
                                        onClick={() => setMobileOpen(false)}
                                    />
                                    <button
                                        onClick={() => { setMobileOpen(false); signOut({ callbackUrl: ROUTES.home }); }}
                                        className="rounded-xl border border-white/10 px-6 py-3 text-sm text-white bg-white/5
                                            hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition cursor-pointer"
                                    >
                                        Sign out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        onClick={() => setMobileOpen(false)}
                                        className="font-medium text-sm text-[#F8FAFC] hover:bg-white/5 transition-all duration-200
                                            px-4 py-3 rounded-xl text-center border border-white/10"
                                        href={loginHref()}
                                    >
                                        Sign In
                                    </Link>
                                    <AppEntryCta
                                        guestLabel="Get Started"
                                        authLabel="Dashboard"
                                        className="font-medium text-sm text-[#0d1210] px-5 py-3 rounded-xl text-center"
                                        style={{ background: "linear-gradient(135deg, oklch(0.55 0.09 195), oklch(0.75 0.12 190))" } as React.CSSProperties}
                                    />
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

export default Navbar