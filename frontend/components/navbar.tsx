'use client'
import React from 'react'
import { Sparkles, Grid2X2, Tag, ShieldCheck, BookOpen } from "lucide-react";
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';


const Navbar = () => {
    const { data: session, status } = useSession();
    const links = [
        {
            name: "Features",
            icon: Sparkles,
        },
        {
            name: "Solutions",
            icon: Grid2X2,
        },
        {
            name: "Pricing",
            icon: Tag,
        },
        {
            name: "Enterprise",
            icon: ShieldCheck,
        },
        {
            name: "Resources",
            icon: BookOpen,
        },
    ];
    return (
        <>
            <header className="fixed top-8 left-0 right-0 z-50 flex justify-center px-6">
                <nav
                    className="w-full max-w-7xl rounded-[28px] border border-white/10 bg-[#050816]/70 backdrop-blur-2xl shadow-[0_0_80px_rgba(124,58,237,0.25)]">
                    <div className="flex h-24 items-center justify-between px-8">

                        {/* Logo */}
                        <div className="flex items-center gap-4">
                            <div
                                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-purple-500/30
              "
                            >
                                <Sparkles className="h-7 w-7 text-white" />
                            </div>

                            <h1 className="text-2xl font-bold text-white">
                                PlanGenie{" "}
                                <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                                    AI
                                </span>
                            </h1>
                        </div>


                        {/* Links */}
                        <div className="hidden lg:flex items-center gap-10">
                            {links.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <button
                                        key={item.name}
                                        className="
                                        text-gray-300 flex items-center gap-2 transition hover:text-white">
                                        <Icon size={20} />

                                        <span className="text-base">
                                            {item.name}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>


                        {/* Buttons */}
                        <div className="flex items-center gap-4">
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
                                    <Link href="/login">
                                        <button
                                            className="
                                            rounded-xl
                                            border border-white/10
                                            px-6 py-3
                                            text-white
                                            bg-white/5
                                            hover:bg-white/10
                                            transition cursor-pointer
                                            "
                                        >
                                            Log in
                                        </button>
                                    </Link>

                                    <Link href="/login">
                                        <button
                                            className="
                                            rounded-xl
                                            px-7 py-3
                                            font-medium
                                            text-white
                                            bg-gradient-to-r
                                            from-blue-500
                                            to-purple-600
                                            shadow-lg
                                            shadow-purple-500/30
                                            hover:scale-105
                                            transition cursor-pointer
                                            "
                                        >
                                            Get Started →
                                        </button>
                                    </Link>
                                </>
                            )}
                        </div>

                    </div>
                </nav>
            </header>
        </>
    )
}

export default Navbar