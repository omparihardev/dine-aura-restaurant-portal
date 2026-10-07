"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@/lib/types/portal";
import { signOutAction } from "@/app/login/actions";
import { useLocation } from "./location-context";
import { LocationDropdown } from "./location-dropdown";
import { usePortalSearch } from "./search-context";

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
    const router = useRouter();
    const { locationError, clearLocationError } = useLocation();
    const portalSearch = usePortalSearch();

    const searchQuery = portalSearch?.searchQuery ?? "";
    const setSearchQuery = portalSearch?.setSearchQuery ?? (() => { });
    const clearSearch = portalSearch?.clearSearch ?? (() => { });

    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const desktopSearchInputRef = useRef<HTMLInputElement>(null);
    const mobileSearchInputRef = useRef<HTMLInputElement>(null);

    // Scroll to discovery section smoothly on home page
    function scrollToDiscovery() {
        if (typeof window === "undefined") return;
        const discoverEl = document.getElementById("discover");
        if (discoverEl) {
            discoverEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    // Handle real-time typing in Header Search
    function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value;
        setSearchQuery(value);

        // If on Home page and user starts typing, gently scroll to discovery section if needed
        if (pathname === "/" && value.trim().length > 0) {
            if (typeof window !== "undefined") {
                const discoverEl = document.getElementById("discover");
                if (discoverEl) {
                    const rect = discoverEl.getBoundingClientRect();
                    if (rect.top > window.innerHeight) {
                        discoverEl.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                }
            }
        }
    }

    // Handle form submit / Enter key press
    function handleSearchSubmit(e?: React.FormEvent) {
        if (e) e.preventDefault();

        if (pathname === "/") {
            scrollToDiscovery();
            if (isMobileSearchOpen) {
                setIsMobileSearchOpen(false);
            }
            // Update URL search param on Home page for shareability / persistence
            if (typeof window !== "undefined" && window.history.replaceState) {
                const url = new URL(window.location.href);
                if (searchQuery.trim()) {
                    url.searchParams.set("search", searchQuery.trim());
                } else {
                    url.searchParams.delete("search");
                }
                window.history.replaceState({}, "", url.pathname + url.search + url.hash);
            }
        } else {
            const query = searchQuery.trim();
            const target = query
                ? `/?search=${encodeURIComponent(query)}#discover`
                : "/#discover";
            router.push(target);
            if (isMobileSearchOpen) {
                setIsMobileSearchOpen(false);
            }
        }
    }

    // Keyboard shortcut '/' to quickly focus search; Escape to clear or close
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            const target = e.target as HTMLElement | null;
            const isTyping =
                target?.tagName === "INPUT" ||
                target?.tagName === "TEXTAREA" ||
                target?.tagName === "SELECT" ||
                target?.isContentEditable;

            if (e.key === "/" && !isTyping) {
                e.preventDefault();
                if (window.innerWidth < 768) {
                    setIsMobileSearchOpen(true);
                    setTimeout(() => mobileSearchInputRef.current?.focus(), 50);
                } else {
                    desktopSearchInputRef.current?.focus();
                    desktopSearchInputRef.current?.select();
                }
            } else if (e.key === "Escape") {
                if (isMobileSearchOpen) {
                    setIsMobileSearchOpen(false);
                }
            }
        }
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isMobileSearchOpen]);

    const displayName =
        profile?.full_name ||
        user?.user_metadata?.full_name ||
        user?.email?.split("@")[0] ||
        "Member";

    const userRole = profile?.role || "user";
    const initial = displayName.charAt(0).toUpperCase();

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 z-30 transition-all">
            <div className="h-full px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
                {/* Left section: Mobile menu toggle + DineAura Brand */}
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <button
                        type="button"
                        onClick={onMenuToggle}
                        aria-label="Toggle navigation drawer"
                        className="lg:hidden p-1.5 sm:p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
                        <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 flex items-center justify-center text-white text-base sm:text-lg shadow-sm shadow-amber-500/20 group-hover:scale-105 transition-transform flex-shrink-0">
                            🍽️
                        </span>
                        <div className="flex flex-col">
                            <span className="text-base sm:text-lg font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-1 sm:gap-1.5">
                                DineAura
                                <span className="text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/10 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-500/20 dark:border-amber-900/60">
                                    India
                                </span>
                            </span>
                        </div>
                    </Link>
                </div>

                {/* Center section: BRD Navbar Items */}
                <nav
                    aria-label="Main Navigation"
                    className="hidden xl:flex items-center gap-1 bg-zinc-100/70 dark:bg-zinc-800/50 p-1 rounded-xl border border-zinc-200/70 dark:border-zinc-700/50 backdrop-blur-xs"
                >
                    {NAVBAR_ITEMS.map((item) => {
                        const currentPath = pathname || "/";
                        const isActive =
                            item.href === "/"
                                ? currentPath === "/"
                                : currentPath === item.href || currentPath.startsWith(`${item.href}/`);

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${isActive
                                        ? "bg-white dark:bg-zinc-900 text-amber-700 dark:text-amber-400 shadow-xs border border-zinc-200/70 dark:border-zinc-700/60 font-bold"
                                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-white/60 dark:hover:bg-zinc-700/40"
                                    }`}
                            >
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Right section: Search + Global Location selector + User Profile / Auth State */}
                <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                    {/* Functional BRD Header Search Control */}
                    <div className="flex items-center">
                        {/* Real Desktop & Tablet Search Input */}
                        <form
                            onSubmit={handleSearchSubmit}
                            className="hidden md:flex relative items-center"
                            role="search"
                        >
                            <label htmlFor="portal-header-search" className="sr-only">
                                Search restaurants across India
                            </label>
                            <span className="absolute left-2.5 flex items-center pointer-events-none text-zinc-400">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                ref={desktopSearchInputRef}
                                id="portal-header-search"
                                type="text"
                                value={searchQuery}
                                onChange={handleSearchChange}
                                onKeyDown={(e) => {
                                    if (e.key === "Escape") {
                                        if (searchQuery) clearSearch();
                                        else desktopSearchInputRef.current?.blur();
                                    }
                                }}
                                placeholder="Search restaurants..."
                                aria-label="Search restaurants across India"
                                className="w-36 md:w-44 lg:w-48 xl:w-52 2xl:w-64 pl-8 pr-7 py-1.5 text-xs rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/60 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                            />
                            {searchQuery ? (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    title="Clear search"
                                    aria-label="Clear search"
                                    className="absolute right-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 cursor-pointer text-xs"
                                >
                                    <span className="font-bold">&times;</span>
                                </button>
                            ) : (
                                <kbd className="hidden lg:inline-flex items-center absolute right-2 px-1.5 py-0.5 text-[10px] font-mono rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-400 pointer-events-none shadow-2xs">
                                    /
                                </kbd>
                            )}
                        </form>

                        {/* Mobile Search Icon Button */}
                        <button
                            type="button"
                            onClick={() => {
                                setIsMobileSearchOpen(true);
                                setTimeout(() => mobileSearchInputRef.current?.focus(), 50);
                            }}
                            title="Search restaurants"
                            aria-label="Open mobile search"
                            className="md:hidden p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors cursor-pointer"
                        >
                            <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>
                    </div>

                    {/* Global Location selector (Desktop/Tablet in navbar; on mobile cleanly accessible in mobile sidebar drawer & discovery) */}
                    <div className="hidden sm:block">
                        <LocationDropdown variant="navbar" align="right" />
                    </div>

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
                                className="flex items-center gap-1.5 p-1 sm:pl-1.5 sm:pr-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors border border-zinc-200 dark:border-zinc-700"
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
                                    className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 border border-zinc-200 dark:border-zinc-700 hover:border-red-300 dark:hover:border-red-800 transition-all flex items-center gap-1.5"
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
                                className="px-3 sm:px-4 py-1.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-all"
                            >
                                Sign In
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Expandable Mobile Search Overlay Bar */}
            {isMobileSearchOpen && (
                <div className="md:hidden absolute inset-0 bg-white dark:bg-zinc-900 z-50 px-3 flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 shadow-md animate-in fade-in duration-150">
                    <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2" role="search">
                        <span className="text-zinc-400 pl-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            ref={mobileSearchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onKeyDown={(e) => {
                                if (e.key === "Escape") {
                                    setIsMobileSearchOpen(false);
                                }
                            }}
                            placeholder="Search restaurants, cuisines, cities..."
                            aria-label="Search restaurants on mobile"
                            className="flex-1 py-2 text-xs sm:text-sm bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
                            autoFocus
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                aria-label="Clear mobile search query"
                                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                            >
                                <span className="text-sm font-bold">&times;</span>
                            </button>
                        )}
                    </form>
                    <button
                        type="button"
                        onClick={() => setIsMobileSearchOpen(false)}
                        aria-label="Close mobile search"
                        className="px-2.5 py-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg cursor-pointer transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </header>
    );
}
