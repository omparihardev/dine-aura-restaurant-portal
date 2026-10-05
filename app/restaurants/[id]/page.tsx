import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/portal/portal-shell";
import { RestaurantDetailsView } from "@/components/portal/restaurant-details-view";
import Link from "next/link";
import type { Metadata } from "next";
import type { UserProfile, Restaurant } from "@/lib/types/portal";
import type { RestaurantMenuItem } from "@/lib/types/menu";

interface RestaurantPageProps {
    params: Promise<{ id: string }>;
}

// UUID validation regex (RFC 4122) to prevent Postgres invalid syntax errors
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: RestaurantPageProps): Promise<Metadata> {
    const { id } = await params;

    if (!UUID_REGEX.test(id)) {
        return {
            title: "Restaurant Not Found | DineAura",
            description: "The requested restaurant could not be found on DineAura.",
        };
    }

    try {
        const supabase = await createClient();
        const { data: restaurant } = await supabase
            .from("restaurants")
            .select("name, cuisine, city, state, description")
            .eq("id", id)
            .maybeSingle();

        if (!restaurant) {
            return {
                title: "Restaurant Not Found | DineAura",
                description: "The requested restaurant could not be found on DineAura.",
            };
        }

        return {
            title: `${restaurant.name} | DineAura`,
            description:
                restaurant.description ||
                `Discover ${restaurant.name}, offering authentic ${restaurant.cuisine || "Indian"} cuisine in ${restaurant.city}, ${restaurant.state} on DineAura.`,
        };
    } catch {
        return {
            title: "Restaurant Details | DineAura",
            description: "Discover verified restaurants across India on DineAura.",
        };
    }
}

export default async function RestaurantPage({ params }: RestaurantPageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // Authenticated user session & profile for PortalShell consistency
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

    // Validate UUID before querying database
    const isValidUuid = UUID_REGEX.test(id);
    let restaurant: Restaurant | null = null;
    let fetchError: string | null = null;

    if (isValidUuid) {
        try {
            const { data, error } = await supabase
                .from("restaurants")
                .select("id, name, description, city, state, address, cuisine, image_url, phone, rating, latitude, longitude, is_active, created_at, updated_at")
                .eq("id", id)
                .maybeSingle<Restaurant>();

            if (error) {
                // If coordinates columns do not exist yet in cloud DB, fall back gracefully
                if (error.code === "42703" || error.message?.includes("latitude")) {
                    const fallback = await supabase
                        .from("restaurants")
                        .select("id, name, description, city, state, address, cuisine, image_url, phone, rating, is_active, created_at, updated_at")
                        .eq("id", id)
                        .maybeSingle<Restaurant>();

                    if (fallback.data) {
                        restaurant = {
                            ...fallback.data,
                            latitude: null,
                            longitude: null,
                        };
                    } else {
                        fetchError = fallback.error?.message || error.message;
                    }
                } else {
                    fetchError = error.message;
                }
            } else {
                restaurant = data;
            }
        } catch (err: unknown) {
            fetchError = err instanceof Error ? err.message : "Database connection issue";
        }
    }

    // Professional Not Found State
    if (!restaurant) {
        return (
            <PortalShell user={user} profile={profile}>
                <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 text-center space-y-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-4xl shadow-inner mx-auto mb-2">
                        🍽️
                    </div>

                    <div className="space-y-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900">
                            Restaurant Not Found
                        </span>
                        <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
                            We couldn&apos;t find this restaurant
                        </h1>
                        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
                            The restaurant you requested may have been removed, unlisted, or the link is invalid. Please explore our live directory of verified venues across India.
                        </p>
                    </div>

                    {fetchError && (
                        <p className="text-xs text-zinc-400 font-mono">
                            Reference status: <code>{fetchError}</code>
                        </p>
                    )}

                    <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                        <Link
                            href="/#discover"
                            className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
                        >
                            <span>&larr;</span>
                            <span>Back to Restaurants</span>
                        </Link>

                        <Link
                            href="/categories"
                            className="px-5 py-2.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 font-semibold text-xs sm:text-sm transition-all"
                        >
                            Browse Cuisines
                        </Link>

                        <Link
                            href="/"
                            className="px-5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs sm:text-sm transition-all"
                        >
                            Go Home
                        </Link>
                    </div>
                </div>
            </PortalShell>
        );
    }

    // Fetch customer-facing menu items (available only, ordered by category and name)
    let menuItems: RestaurantMenuItem[] = [];
    let menuError: string | null = null;

    try {
        const { data: menuData, error: menuQueryError } = await supabase
            .from("restaurant_menu_items")
            .select("id, restaurant_id, name, description, category, price, is_available, created_at, updated_at")
            .eq("restaurant_id", id)
            .eq("is_available", true)
            .order("category", { ascending: true })
            .order("name", { ascending: true });

        if (menuQueryError) {
            console.error("Menu query error for restaurant:", id, menuQueryError.message);
            menuError = menuQueryError.message;
        } else if (menuData) {
            menuItems = menuData as RestaurantMenuItem[];
        }
    } catch (err: unknown) {
        console.error("Unexpected error fetching restaurant menu:", err);
        menuError = err instanceof Error ? err.message : "Failed to load menu";
    }

    return (
        <PortalShell user={user} profile={profile}>
            <RestaurantDetailsView
                restaurant={restaurant}
                user={user}
                profile={profile}
                menuItems={menuItems}
                menuError={menuError}
            />
        </PortalShell>
    );
}
