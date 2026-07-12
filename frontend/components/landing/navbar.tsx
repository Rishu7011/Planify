'use client'
import React, { useEffect, useRef, useState } from 'react'
import {
    Hexagon,
    Home as HomeIcon,
    BarChart2,
    GitBranch,
    Brain,
    Play,
    Search,
    Grid,
    Cloud,
    FileText,
    CreditCard,
    Shield,
    RefreshCw,
    Code,
    Globe,
    MessageSquare,
    Share2,
    Menu,
    X,
    ArrowRight,
    Sparkles,
    ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion'
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';


const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [navVisible, setNavVisible] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { data: session, status } = useSession();

    const lastScrollY = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY > 20) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }

            // Hide or show navbar based on scroll direction
            if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
                // Scrolling down & past 100px -> Hide navbar
                setNavVisible(false);
            } else if (currentScrollY < lastScrollY.current) {
                // Scrolling up -> Show navbar
                setNavVisible(true);
            }

            lastScrollY.current = currentScrollY;
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);
    return (
        <><nav
            className={`fixed left-4 right-4 md:left-8 md:right-8 z-50 mx-auto max-w-[1200px] flex items-center transition-all duration-500 ease-in-out border border-white/10 rounded-[24px] shadow-[0_10px_40px_rgba(0,0,0,0.35)] ${scrolled
                ? "h-[64px] bg-[#0F1220]/85 backdrop-blur-2xl"
                : "h-[72px] bg-[#0F1220]/60 backdrop-blur-xl"
                } ${navVisible
                    ? "top-6 opacity-100 translate-y-0"
                    : "-translate-y-[150%] top-6 opacity-0 pointer-events-none"
                }`}
        >
            <div className="flex items-center justify-between px-6 md:px-8 w-full">
                {/* Brand Logo */}
                <div className="flex items-center gap-3 cursor-pointer group">
                    <span className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#4F8DFF] to-[#8E6BFF] grid place-items-center shadow-[0_0_20px_rgba(79,141,255,0.3)] transition-transform duration-300 group-hover:scale-105">
                        <Hexagon className="w-4.5 h-4.5 text-white fill-white" />
                    </span>
                    <span className="font-sans text-lg font-bold text-[#F7F8FC] tracking-tight">
                        Planify
                    </span>
                </div>

                {/* Desktop Nav Links */}
                <div className="hidden md:flex items-center space-x-8">
                    {["Product", "Solutions", "Resources", "Pricing"].map((link) => (
                        <a
                            key={link}
                            className="font-sans text-sm text-[#B4BCCB] hover:text-[#F7F8FC] transition-colors relative group font-medium"
                            href={`#${link.toLowerCase()}`}
                        >
                            {link}
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#4F8DFF] transition-all duration-300 group-hover:w-full"></span>
                        </a>
                    ))}
                </div>

                {/* Nav Actions */}
                <div className="flex items-center space-x-4">
                    {status === "loading" ? (
                        <div className="h-9 w-9 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : session ? (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                                {session.user?.image ? (
                                    <img
                                        src={session.user.image}
                                        alt={session.user.name || "User Profile"}
                                        className="h-8 w-8 rounded-full border border-white/20"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 font-bold text-sm text-white">
                                        {session.user?.email?.[0].toUpperCase() || "U"}
                                    </div>
                                )}
                                <span className="hidden sm:inline text-sm font-medium text-gray-200">
                                    {session.user?.name || session.user?.email?.split('@')[0]}
                                </span>
                            </div>
                            <button
                                onClick={() => signOut()}
                                className="
                                                            rounded-xl
                                                            border border-white/10
                                                            px-6 py-3
                                                            text-white
                                                            bg-white/5
                                                            hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400
                                                            transition cursor-pointer
                                                            "
                            >
                                Sign out
                            </button>
                        </div>
                    ) : (
                        <>
                            <Link
                                className="hidden sm:inline-block font-sans text-sm text-[#F7F8FC] hover:bg-white/5 transition-all duration-200 px-4 py-2 rounded-lg"
                                href='/login'
                            >
                                Sign In
                            </Link>
                            <Link
                                className="bg-gradient-to-r from-[#4F8DFF] to-[#8E6BFF] font-sans text-sm text-white px-5 py-2.5 rounded-full font-semibold shadow-lg shadow-[#4F8DFF]/20 hover:shadow-[#4F8DFF]/40 hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
                                href="#cta"
                            >
                                Get Started
                            </Link>
                        </>
                    )}

                    {/* Mobile Toggle Button */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="md:hidden p-2 text-[#B4BCCB] hover:text-[#F7F8FC] transition-colors"
                        aria-label="Toggle Menu"
                    >
                        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>
        </nav>
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="fixed top-24 left-4 right-4 z-40 bg-[#0F1220] border border-white/10 p-6 rounded-[20px] shadow-2xl flex flex-col space-y-4 md:hidden"
                    >
                        {["Product", "Solutions", "Resources", "Pricing"].map((link) => (
                            <a
                                key={link}
                                onClick={() => setMobileOpen(false)}
                                className="font-sans text-base text-[#B4BCCB] hover:text-[#F7F8FC] py-2 transition-colors border-b border-white/5"
                                href={`#${link.toLowerCase()}`}
                            >
                                {link}
                            </a>
                        ))}
                        {status === "loading" ? (
                            <div className="h-9 w-9 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : session ? (
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                                    {session.user?.image ? (
                                        <img
                                            src={session.user.image}
                                            alt={session.user.name || "User Profile"}
                                            className="h-8 w-8 rounded-full border border-white/20"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 font-bold text-sm text-white">
                                            {session.user?.email?.[0].toUpperCase() || "U"}
                                        </div>
                                    )}
                                    <span className="hidden sm:inline text-sm font-medium text-gray-200">
                                        {session.user?.name || session.user?.email?.split('@')[0]}
                                    </span>
                                </div>
                                <button
                                    onClick={() => signOut()}
                                    className="
                                                            rounded-xl
                                                            border border-white/10
                                                            px-6 py-3
                                                            text-white
                                                            bg-white/5
                                                            hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400
                                                            transition cursor-pointer
                                                            "
                                >
                                    Sign out
                                </button>
                            </div>
                        ) : (
                            <>
                                <Link
                                    className="hidden sm:inline-block font-sans text-sm text-[#F7F8FC] hover:bg-white/5 transition-all duration-200 px-4 py-2 rounded-lg"
                                    href='/login'
                                >
                                    Sign In
                                </Link>
                                <Link
                                    className="bg-gradient-to-r from-[#4F8DFF] to-[#8E6BFF] font-sans text-sm text-white px-5 py-2.5 rounded-full font-semibold shadow-lg shadow-[#4F8DFF]/20 hover:shadow-[#4F8DFF]/40 hover:-translate-y-0.5 transition-all duration-300 active:scale-95"
                                    href="#cta"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

export default Navbar