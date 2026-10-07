import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/portal-shell";
import { ProfileForm } from "@/components/portal/profile-form";
import type { UserProfile } from "@/lib/types/portal";

export const metadata = {
    title: "User Profile | DineAura",
    description: "View and manage your authenticated DineAura user profile.",
};

export default async function ProfilePage() {
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
            <div className="space-y-12 max-w-4xl mx-auto py-2 sm:py-4">
                <div className="space-y-3.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-500/20 dark:border-amber-900/60 w-fit shadow-2xs">
                        <span>👤</span>
                        <span>DineAura Account &bull; Profile Management</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                        My Profile &amp; Account
                    </h1>
                    <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed text-balance">
                        View and update your personal details stored securely in Supabase.
                    </p>
                </div>

                {/* Profile Form (View & Edit with Live Supabase Sync) */}
                <ProfileForm profile={profile} email={user.email} />
            </div>
        </PortalShell>
    );
}
