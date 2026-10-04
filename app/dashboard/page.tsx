import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { RestaurantDiscovery } from "@/components/portal/restaurant-discovery";
import type { UserProfile, Restaurant, Category } from "@/lib/types/portal";

export const metadata = {
    title: "Dining Dashboard | DineAura",
    description: "Explore India's premier restaurants and manage your DineAura profile.",
};

interface DashboardPageProps {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
    const resolvedParams = searchParams ? await searchParams : undefined;
    const cuisineParam = resolvedParams?.cuisine;
    const initialCuisine = typeof cuisineParam === "string" ? cuisineParam : Array.isArray(cuisineParam) ? cuisineParam[0] : undefined;
    const supabase = await createClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    // Guard route
    if (error || !user) {
        redirect("/login");
    }

    // Retrieve user profile data from public.profiles
    const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, avatar_url, role, created_at, updated_at")
        .eq("id", user.id)
        .maybeSingle<UserProfile>();

    // Retrieve real restaurants from public.restaurants (governed by Supabase RLS)
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

    // Retrieve real categories from public.categories
    const { data: categories } = await supabase
        .from("categories")
        .select("id, name, description, created_at")
        .order("name", { ascending: true });

    const displayName =
        profile?.full_name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Valued Foodie";

    const userRole = profile?.role || "user";

    return (
        <div className="space-y-10">
            {/* Top Welcome Banner */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 via-amber-700 to-orange-600 p-8 sm:p-10 text-white shadow-xl">
                <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm mb-4">
                        <span>🇮🇳</span>
                        <span>India&apos;s Culinary Portal &bull; Verified Member</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                        Namaste, {displayName}!
                    </h1>

                    <p className="mt-3 text-white/90 text-sm sm:text-base leading-relaxed">
                        Discover authentic flavours across India — from fragrant Lucknowi Biryani and buttery Punjabi Kulchas to crisp Bengaluru Dosas.
                    </p>
                </div>

                {/* Decorative background element */}
                <div
                    className="absolute -right-10 -bottom-10 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none"
                    aria-hidden="true"
                />
            </section>

            {/* Live Restaurant Discovery & Listings Section (Connected to Supabase) */}
            <Suspense fallback={<div className="p-8 text-center text-zinc-500">Loading restaurants...</div>}>
                <RestaurantDiscovery
                    initialRestaurants={(restaurants as Restaurant[]) || []}
                    initialCategories={(categories as Category[]) || []}
                    initialError={restaurantsError?.message || null}
                    initialCuisine={initialCuisine}
                />
            </Suspense>

            {/* User Profile & Security Details (Preserving existing dashboard functionality) */}
            <section id="profile" className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <span>👤 My Profile &amp; Account</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                        Your authenticated credentials and membership details on DineAura.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* User Profile Card */}
                    <div className="md:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                Personal Information
                            </h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 uppercase tracking-wide border border-amber-200 dark:border-amber-900">
                                Role: {userRole}
                            </span>
                        </div>

                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800">
                                <dt className="text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400">
                                    Full Name
                                </dt>
                                <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                                    {displayName}
                                </dd>
                            </div>

                            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800">
                                <dt className="text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400">
                                    Email Address
                                </dt>
                                <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-100 truncate">
                                    {user.email}
                                </dd>
                            </div>

                            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800">
                                <dt className="text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400">
                                    Account UID
                                </dt>
                                <dd className="mt-1 font-mono text-xs text-zinc-600 dark:text-zinc-400 truncate">
                                    {user.id}
                                </dd>
                            </div>

                            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800">
                                <dt className="text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400">
                                    Member Since
                                </dt>
                                <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                                    {profile?.created_at
                                        ? new Date(profile.created_at).toLocaleDateString("en-IN", {
                                              year: "numeric",
                                              month: "short",
                                              day: "numeric",
                                          })
                                        : "Recent"}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* Security & System Info */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                                Session Integrity
                            </h3>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-4">
                                Server-side authenticated session via Supabase SSR &amp; Row Level Security (RLS).
                            </p>

                            <div className="space-y-2 text-xs">
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    <span>Auth Token Verified</span>
                                </div>
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                    <span>PostgreSQL RLS Active</span>
                                </div>
                                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                    <span>Live Supabase Data</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400 text-center">
                            DineAura Security Engine &bull; Protected
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
