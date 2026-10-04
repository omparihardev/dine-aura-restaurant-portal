"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { UserProfile } from "@/lib/types/portal";
import { PortalHeader } from "./portal-header";
import { PortalSidebar } from "./portal-sidebar";

interface PortalShellProps {
    user?: User | null;
    profile?: UserProfile | null;
    initialCity?: string;
    children: React.ReactNode;
}

export function PortalShell({ user, profile, children }: PortalShellProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
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
                <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-6 px-4 sm:px-6 lg:pl-8 text-center text-xs text-zinc-500">
                    <p>
                        &copy; {new Date().getFullYear()} DineAura Portal. India&apos;s culinary guide. All prices in INR (₹).
                    </p>
                </footer>
            </div>
        </div>
    );
}
