import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/portal-shell";
import type { UserProfile } from "@/lib/types/portal";

export const metadata = {
    title: "DineAura Portal | Indian Restaurant Directory",
    description: "Discover the best dining destinations across India on DineAura.",
};

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    // Enforce server-side authentication protection
    if (error || !user) {
        redirect("/login");
    }

    // Retrieve user profile data
    const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, avatar_url, role, created_at, updated_at")
        .eq("id", user.id)
        .maybeSingle<UserProfile>();

    return (
        <PortalShell user={user} profile={profile}>
            {children}
        </PortalShell>
    );
}
