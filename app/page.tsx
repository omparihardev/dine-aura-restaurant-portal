import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PortalShell } from "@/components/portal/portal-shell";
import { HeroSection } from "@/components/portal/hero-section";
import { RestaurantDiscovery } from "@/components/portal/restaurant-discovery";
import type { UserProfile, Restaurant, Category } from "@/lib/types/portal";

export const metadata = {
    title: "DineAura | India's Premier Restaurant Portal",
    description: "Discover verified restaurants and authentic regional cuisines across India on DineAura.",
};

interface HomePageProps {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home({ searchParams }: HomePageProps) {
    const resolvedParams = searchParams ? await searchParams : undefined;
    const cuisineParam = resolvedParams?.cuisine;
    const initialCuisine = typeof cuisineParam === "string" ? cuisineParam : Array.isArray(cuisineParam) ? cuisineParam[0] : undefined;
    const cityParam = resolvedParams?.city;
    const initialCity = typeof cityParam === "string" ? cityParam : Array.isArray(cityParam) ? cityParam[0] : undefined;
    const searchParam = resolvedParams?.search;
    const initialSearch = typeof searchParam === "string" ? searchParam : Array.isArray(searchParam) ? searchParam[0] : undefined;
    const supabase = await createClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    // Guard route: redirect unauthenticated users to /login (BRD compliance)
    if (error || !user) {
        redirect("/login");
    }

    // Retrieve user profile if logged in
    const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, avatar_url, role, created_at, updated_at")
        .eq("id", user.id)
        .maybeSingle<UserProfile>();

    // Retrieve live restaurants from Supabase public.restaurants
    let restaurants: Restaurant[] = [];
    const { data: rawRestaurants, error: restaurantsError } = await supabase
        .from("restaurants")
        .select("id, name, description, city, state, address, cuisine, image_url, phone, rating, latitude, longitude, is_active, created_at, updated_at")
        .order("created_at", { ascending: false });

    if (restaurantsError && (restaurantsError.code === "42703" || restaurantsError.message?.includes("latitude"))) {
        const fallback = await supabase
            .from("restaurants")
            .select("id, name, description, city, state, address, cuisine, image_url, phone, rating, is_active, created_at, updated_at")
            .order("created_at", { ascending: false });
        restaurants = (fallback.data || []).map((r) => ({ ...r, latitude: null, longitude: null })) as Restaurant[];
    } else {
        restaurants = (rawRestaurants as Restaurant[]) || [];
    }

    // Retrieve live categories from Supabase public.categories
    const { data: categories } = await supabase
        .from("categories")
        .select("id, name, description, created_at")
        .order("name", { ascending: true });

    // Calculate genuine Supabase statistics for hero metrics (strictly real data)
    const restaurantList = (restaurants as Restaurant[]) || [];
    const activeRestaurants = restaurantList.filter((r) => r.is_active !== false);
    const uniqueCities = new Set(
        activeRestaurants.map((r) => r.city?.trim()).filter(Boolean)
    );
    const heroStats = {
        totalRestaurants: activeRestaurants.length,
        totalCities: uniqueCities.size,
        totalCategories: (categories as Category[] || []).length,
    };

    return (
        <PortalShell user={user} profile={profile} initialCity={initialCity} initialSearch={initialSearch}>
            <div className="space-y-12">
                {/* Premium BRD Hero Section */}
                <HeroSection isLoggedIn={Boolean(user)} stats={heroStats} />

                {/* Live Restaurant Discovery & Listings Section */}
                <Suspense fallback={
                    <div className="p-12 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mb-3 animate-spin">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            Loading restaurants...
                        </h3>
                    </div>
                }>
                    <RestaurantDiscovery
                        initialRestaurants={(restaurants as Restaurant[]) || []}
                        initialCategories={(categories as Category[]) || []}
                        initialError={restaurantsError?.message || null}
                        initialCuisine={initialCuisine}
                    />
                </Suspense>
            </div>
        </PortalShell>
    );
}
