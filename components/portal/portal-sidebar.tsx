"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@/lib/types/portal";
import { signOutAction } from "@/app/login/actions";

interface PortalSidebarProps {
    user?: User | null;
    profile?: UserProfile | null;
    isOpen: boolean;
    onClose: () => void;
}

// Confirmed BRD Sidebar Items:
// - Dashboard
// - Home
// - Profile
// - Categories
// - Services
// - Settings
// - Help & Support
// - Logout
const SIDEBAR_ITEMS = [
    {
        name: "Dashboard",
        href: "/dashboard",
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
        ),
    },
    {
        name: "Home",
        href: "/",
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
    {
        name: "Profile",
        href: "/profile",
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        ),
    },
    {
        name: "Categories",
        href: "/categories",
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
        ),
    },
    {
        name: "Services",
        href: "/services",
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
    },
    {
        name: "Settings",
        href: "/settings",
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
    },
    {
        name: "Help & Support",
        href: "/help",
        icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
];

export function PortalSidebar({ user, isOpen, onClose }: PortalSidebarProps) {
    const pathname = usePathname();

    const sidebarContent = (
        <div className="h-full flex flex-col justify-between py-6 px-4 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800">
            <div className="space-y-6">
                {/* Section Title */}
                <div className="px-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        Menu &bull; Navigation
                    </p>
                </div>

                {/* Primary Sidebar Items */}
                <nav aria-label="Sidebar Menu" className="space-y-1">
                    {SIDEBAR_ITEMS.map((item) => {
                        const isActive =
                            item.href === "/"
                                ? pathname === "/"
                                : pathname === item.href || pathname.startsWith(`${item.href}/`);

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={onClose}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                                    isActive
                                        ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/80 shadow-sm"
                                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                                }`}
                            >
                                <span className={isActive ? "text-amber-600 dark:text-amber-400" : "text-zinc-400"}>
                                    {item.icon}
                                </span>
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom Actions: India Info + Logout (Sidebar Item 8) */}
            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60">
                    <div className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200 font-semibold text-xs">
                        <span>🇮🇳</span>
                        <span>DineAura India</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                        India&apos;s restaurant directory &bull; INR (₹)
                    </p>
                </div>

                {/* Secure Logout capability */}
                {user ? (
                    <form action={signOutAction}>
                        <button
                            type="submit"
                            title="Sign out of your account"
                            aria-label="Logout"
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/70 border border-red-200/80 dark:border-red-900/60 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Logout</span>
                        </button>
                    </form>
                ) : (
                    <Link
                        href="/login"
                        onClick={onClose}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition-colors"
                    >
                        <span>Sign In</span>
                    </Link>
                )}
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Fixed Left Sidebar */}
            <aside className="hidden lg:block fixed top-16 left-0 bottom-0 w-64 z-20 overflow-y-auto">
                {sidebarContent}
            </aside>

            {/* Mobile / Tablet Drawer */}
            {isOpen && (
                <div className="lg:hidden fixed inset-0 z-40 flex">
                    {/* Backdrop Overlay */}
                    <div
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                        aria-hidden="true"
                    />

                    {/* Drawer Panel */}
                    <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-zinc-900 shadow-2xl pt-16 z-50">
                        <div className="absolute top-4 right-4 z-50">
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Close navigation"
                                className="p-2 rounded-xl text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {sidebarContent}
                    </div>
                </div>
            )}
        </>
    );
}
