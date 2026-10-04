"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@/lib/types/portal";
import { signOutAction } from "@/app/login/actions";
import { useLocation } from "./location-context";
import { LocationDropdown } from "./location-dropdown";

interface PortalHeaderProps {
    user?: User | null;
    profile?: UserProfile | null;
    onMenuToggle: () => void;
}

// Confirmed BRD Navbar Items:
// - Home
// - About
// - Services
// - Categories
// - Contact
// - Profile
const NAVBAR_ITEMS = [
    { name: "Home", href: "/" },
    { name: "Favorites", href: "/favorites" },
    { name: "My Reservations", href: "/reservations" },
    { name: "About", href: "/about" },
    { name: "Services", href: "/services" },
    { name: "Categories", href: "/categories" },
    { name: "Contact", href: "/contact" },
    { name: "Profile", href: "/profile" },
];

export function PortalHeader({ user, profile, onMenuToggle }: PortalHeaderProps) {
    const pathname = usePathname();
    const { locationError, clearLocationError } = useLocation();

    const displayName =
        profile?.full_name ||
        user?.user_metadata?.full_name ||
        user?.email?.split("@")[0] ||
        "Member";

    const userRole = profile?.role || "user";
    const initial = displayName.charAt(0).toUpperCase();

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 z-30 transition-all">
            <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
                {/* Left section: Mobile menu toggle + DineAura Brand */}
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onMenuToggle}
                        aria-label="Toggle navigation drawer"
                        className="lg:hidden p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    <Link href="/" className="flex items-center gap-2.5 group">
                        <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-lg shadow-sm group-hover:scale-105 transition-transform">
                            🍽️
                        </span>
                        <div className="flex flex-col">
                            <span className="text-lg font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                                DineAura
                                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                                    India
                                </span>
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Center section: BRD Navbar Items */}
                <nav
                    aria-label="Main Navigation"
                    className="hidden xl:flex items-center gap-1.5 bg-zinc-100/80 dark:bg-zinc-800/60 p-1 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60"
                >
                    {NAVBAR_ITEMS.map((item) => {
                        const isActive =
                            item.href === "/"
                                ? pathname === "/"
                                : pathname === item.href || pathname.startsWith(`${item.href}/`);

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                    isActive
                                        ? "bg-white dark:bg-zinc-900 text-amber-700 dark:text-amber-400 shadow-sm border border-zinc-200/60 dark:border-zinc-700/60"
                                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60"
                                }`}
                            >
                                {item.name}
                            </Link>
                        );
                    })}

                    {profile?.role === "admin" && (
                        <div className="flex items-center gap-1 pl-1 border-l border-zinc-200 dark:border-zinc-700">
                            <Link
                                href="/admin/restaurants"
                                title="Manage Restaurants"
                                className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                                    pathname.startsWith("/admin/restaurants")
                                        ? "bg-amber-600 text-white shadow-sm"
                                        : "text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-900 hover:bg-amber-100"
                                }`}
                            >
                                <span>🛡️ Restaurants</span>
                            </Link>
                            <Link
                                href="/admin/reservations"
                                title="Manage Reservations"
                                className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
                                    pathname.startsWith("/admin/reservations")
                                        ? "bg-amber-600 text-white shadow-sm"
                                        : "text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-900 hover:bg-amber-100"
                                }`}
                            >
                                <span>📋 Reservations</span>
                            </Link>
                        </div>
                    )}
                </nav>

                {/* Right section: Global Location selector + User Profile / Auth State */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Global Location selector (Single source of truth) */}
                    <LocationDropdown variant="navbar" align="right" />

                    {/* Non-intrusive Geolocation Notification */}
                    {locationError && (
                        <div
                            role="status"
                            aria-live="polite"
                            className="fixed top-18 right-4 max-w-sm p-3 rounded-xl bg-amber-50 dark:bg-amber-950/90 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs shadow-lg flex items-center justify-between gap-3 z-50 animate-in fade-in slide-in-from-top-2"
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-sm">⚠️</span>
                                <span>{locationError}</span>
                            </div>
                            <button
                                type="button"
                                onClick={clearLocationError}
                                aria-label="Dismiss location message"
                                className="text-amber-700 dark:text-amber-400 hover:text-amber-950 dark:hover:text-amber-100 font-bold text-sm px-1 cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>
                    )}

                    {user ? (
                        <>
                            {/* Authenticated user capsule */}
                            <Link
                                href="/profile"
                                className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border border-zinc-200 dark:border-zinc-700"
                            >
                                <div className="w-7 h-7 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                                    {initial}
                                </div>
                                <div className="hidden sm:flex flex-col text-left">
                                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-none">
                                        {displayName}
                                    </span>
                                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 capitalize">
                                        {userRole}
                                    </span>
                                </div>
                            </Link>

                            {/* Secure Logout form */}
                            <form action={signOutAction}>
                                <button
                                    type="submit"
                                    title="Sign out of DineAura"
                                    aria-label="Sign out"
                                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 border border-zinc-200 dark:border-zinc-700 hover:border-red-300 dark:hover:border-red-800 transition-all flex items-center gap-1.5"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                                        />
                                    </svg>
                                    <span className="hidden sm:inline">Logout</span>
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                href="/login"
                                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-all"
                            >
                                Sign In
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
