import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/portal/portal-shell";
import { FavoritesManager } from "@/components/portal/favorites-manager";
import type { Metadata } from "next";
import type { UserProfile, Restaurant } from "@/lib/types/portal";

export const metadata: Metadata = {
    title: "Your Favorite Restaurants | DineAura",
    description: "Restaurants you've saved for later on DineAura.",
};

export default async function FavoritesPage() {
    const supabase = await createClient();

    // Authenticated user session & profile
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data: profile } = user
        ? await supabase
              .from("profiles")
              .select("id, full_name, email, phone, avatar_url, role, created_at, updated_at")
              .eq("id", user.id)
              .maybeSingle<UserProfile>()
        : { data: null };

    // Fetch live restaurants from Supabase (to resolve current restaurant info from saved IDs)
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

    return (
        <PortalShell user={user} profile={profile}>
            <FavoritesManager allRestaurants={(restaurants as Restaurant[]) || []} />
        </PortalShell>
    );
}
