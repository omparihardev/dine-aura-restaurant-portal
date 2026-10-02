import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/portal/portal-shell";
import { HeroSection } from "@/components/portal/hero-section";
import { RestaurantDiscovery } from "@/components/portal/restaurant-discovery";
import type { UserProfile, Restaurant, Category } from "@/lib/types/portal";

export const metadata = {
    title: "DineAura | India's Premier Restaurant Portal",
    description: "Discover verified restaurants and authentic regional cuisines across India on DineAura.",
};

export default async function Home() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Retrieve user profile if logged in
    const { data: profile } = user
        ? await supabase
              .from("profiles")
              .select("id, full_name, email, phone, avatar_url, role, created_at, updated_at")
              .eq("id", user.id)
              .maybeSingle<UserProfile>()
        : { data: null };

    // Retrieve live restaurants from Supabase public.restaurants
    const { data: restaurants, error: restaurantsError } = await supabase
        .from("restaurants")
        .select("id, name, description, city, state, address, cuisine, image_url, phone, rating, is_active, created_at, updated_at")
        .order("created_at", { ascending: false });

    // Retrieve live categories from Supabase public.categories
    const { data: categories } = await supabase
        .from("categories")
        .select("id, name, description, created_at")
        .order("name", { ascending: true });

    return (
        <PortalShell user={user} profile={profile}>
            <div className="space-y-12">
                {/* Premium BRD Hero Section */}
                <HeroSection isLoggedIn={Boolean(user)} />

                {/* Live Restaurant Discovery & Listings Section */}
                <RestaurantDiscovery
                    initialRestaurants={(restaurants as Restaurant[]) || []}
                    initialCategories={(categories as Category[]) || []}
                    initialError={restaurantsError?.message || null}
                />
            </div>
        </PortalShell>
    );
}
