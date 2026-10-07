"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@/lib/types/portal";
import { PortalHeader } from "./portal-header";
import { PortalSidebar } from "./portal-sidebar";

import { SearchProvider } from "./search-context";

interface PortalShellProps {
    user?: User | null;
    profile?: UserProfile | null;
    initialCity?: string;
    initialSearch?: string;
    children: React.ReactNode;
}

export function PortalShell({ user, profile, initialSearch, children }: PortalShellProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <SearchProvider initialSearch={initialSearch}>
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col selection:bg-amber-500/20 selection:text-amber-900 dark:selection:text-amber-200">
                {/* Top Navigation Bar */}
                <PortalHeader
                    user={user}
                    profile={profile}
                    onMenuToggle={() => setIsSidebarOpen((prev) => !prev)}
                />

                {/* Sidebar (Desktop sticky + Mobile slide-out drawer) */}
                <PortalSidebar
                    user={user}
                    profile={profile}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />

                {/* Main Content Area */}
                <div className="flex-1 lg:pl-64 pt-16 flex flex-col">
                    <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {children}
                    </main>

                    {/* Footer */}
                    <footer className="border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm py-6 px-4 sm:px-6 lg:pl-8 text-center text-xs text-zinc-500 dark:text-zinc-400">
                        <p>
                            &copy; {new Date().getFullYear()} DineAura Portal &bull; India&apos;s Culinary Heritage Guide &bull; All prices in INR (₹)
                        </p>
                    </footer>
                </div>
            </div>
        </SearchProvider>
    );
}
