import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/portal-shell";
import { AdminRestaurantManager } from "@/components/portal/admin-restaurant-manager";
import type { UserProfile, Restaurant, Category } from "@/lib/types/portal";

export const metadata = {
    title: "Admin: Restaurant Directory Management | DineAura",
    description: "Manage restaurants in DineAura directory.",
};

export default async function AdminRestaurantsPage() {
    const supabase = await createClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    // Enforce authentication
    if (authError || !user) {
        redirect("/login");
    }

    // Enforce admin role authorization server-side
    const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, avatar_url, role, created_at, updated_at")
        .eq("id", user.id)
        .maybeSingle<UserProfile>();

    if (profile?.role !== "admin") {
        // Normal users cannot access admin management
        redirect("/dashboard");
    }

    // Retrieve all restaurants (active and inactive, allowed under public.is_admin() RLS policy)
    let restaurants: Restaurant[] = [];
    const { data: rawRestaurants, error: restError } = await supabase
        .from("restaurants")
        .select("id, name, description, city, state, address, cuisine, image_url, phone, rating, latitude, longitude, is_active, created_at, updated_at")
        .order("created_at", { ascending: false });

    if (restError && (restError.code === "42703" || restError.message?.includes("latitude"))) {
        const fallback = await supabase
            .from("restaurants")
            .select("id, name, description, city, state, address, cuisine, image_url, phone, rating, is_active, created_at, updated_at")
            .order("created_at", { ascending: false });
        restaurants = (fallback.data || []).map((r) => ({ ...r, latitude: null, longitude: null })) as Restaurant[];
    } else {
        restaurants = (rawRestaurants as Restaurant[]) || [];
    }

    // Retrieve categories for cuisine selection
    const { data: categories } = await supabase
        .from("categories")
        .select("id, name, description, created_at")
        .order("name", { ascending: true });

    return (
        <PortalShell user={user} profile={profile}>
            <AdminRestaurantManager
                initialRestaurants={(restaurants as Restaurant[]) || []}
                categories={(categories as Category[]) || []}
            />
        </PortalShell>
    );
}
