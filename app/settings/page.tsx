import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/portal-shell";
import type { UserProfile } from "@/lib/types/portal";

export const metadata = {
    title: "Account Settings | DineAura",
    description: "Manage your DineAura portal preferences and settings.",
};

export default async function SettingsPage() {
    const supabase = await createClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    // Guard route: must be authenticated
    if (error || !user) {
        redirect("/login");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, avatar_url, role, created_at, updated_at")
        .eq("id", user.id)
        .maybeSingle<UserProfile>();

    return (
        <PortalShell user={user} profile={profile}>
            <div className="space-y-10 max-w-4xl mx-auto">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                        <span>⚙️</span>
                        <span>DineAura Settings &bull; Preferences</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                        Platform Settings
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                        Regional, currency, and portal preferences for your account.
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Localization settings */}
                    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                            Regional &amp; Currency Settings
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800 space-y-1">
                                <span className="text-zinc-400 text-xs uppercase font-semibold">Active Currency</span>
                                <p className="font-bold text-zinc-900 dark:text-zinc-100">
                                    Indian Rupee (₹ INR)
                                </p>
                                <p className="text-[11px] text-zinc-500">Locked for India restaurant operations</p>
                            </div>

                            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800 space-y-1">
                                <span className="text-zinc-400 text-xs uppercase font-semibold">Region / Locale</span>
                                <p className="font-bold text-zinc-900 dark:text-zinc-100">
                                    India (en-IN)
                                </p>
                                <p className="text-[11px] text-zinc-500">Standard Indian time (IST) and metrics</p>
                            </div>
                        </div>
                    </div>

                    {/* Notification preferences */}
                    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                            Portal Communication
                        </h2>
                        <div className="space-y-3 text-xs sm:text-sm">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    className="rounded border-zinc-300 text-amber-600 focus:ring-amber-500"
                                />
                                <span className="text-zinc-700 dark:text-zinc-300">
                                    Receive email updates on new restaurant additions in your city
                                </span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    className="rounded border-zinc-300 text-amber-600 focus:ring-amber-500"
                                />
                                <span className="text-zinc-700 dark:text-zinc-300">
                                    Security alerts and session login notices
                                </span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </PortalShell>
    );
}
