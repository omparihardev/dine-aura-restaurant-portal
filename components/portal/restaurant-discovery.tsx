"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant, Category } from "@/lib/types/portal";

interface RestaurantDiscoveryProps {
    initialRestaurants?: Restaurant[];
    initialCategories?: Category[];
    initialError?: string | null;
}

const DEFAULT_CUISINES = [
    "North Indian",
    "South Indian",
    "Mughlai",
    "Punjabi",
    "Gujarati",
    "Rajasthani",
    "Bengali",
    "Street Food",
    "Cafe",
    "Fast Food",
];

export function RestaurantDiscovery({
    initialRestaurants = [],
    initialCategories = [],
    initialError = null,
}: RestaurantDiscoveryProps) {
    const [restaurants, setRestaurants] = useState<Restaurant[]>(initialRestaurants);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(initialError);

    const [selectedCuisine, setSelectedCuisine] = useState<string>("All Cuisines");
    const [cityFilter, setCityFilter] = useState<string>("All Cities");
    const [searchFilter, setSearchFilter] = useState<string>("");

    // Dynamic cuisine list combining database categories and default seeded categories
    const cuisineOptions = [
        "All Cuisines",
        ...Array.from(
            new Set([
                ...initialCategories.map((c) => c.name),
                ...restaurants.map((r) => r.cuisine).filter((c): c is string => Boolean(c)),
                ...DEFAULT_CUISINES,
            ])
        ),
    ];

    // Dynamic cities list derived from real restaurant records
    const cityOptions = [
        "All Cities",
        ...Array.from(
            new Set([
                ...restaurants.map((r) => r.city).filter((c): c is string => Boolean(c)),
                "Bengaluru",
                "Mumbai",
                "Delhi NCR",
                "Hyderabad",
                "Pune",
                "Kolkata",
                "Jaipur",
                "Ahmedabad",
                "Chennai",
            ])
        ),
    ];

    async function handleRefresh() {
        setIsLoading(true);
        setErrorMessage(null);

        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("restaurants")
                .select("id, name, description, city, state, address, cuisine, image_url, phone, rating, is_active, created_at, updated_at")
                .order("created_at", { ascending: false });

            if (error) {
                setErrorMessage(error.message);
            } else {
                setRestaurants(data || []);
            }
        } catch (err: unknown) {
            setErrorMessage(err instanceof Error ? err.message : "Failed to load restaurants from database.");
        } finally {
            setIsLoading(false);
        }
    }

    function handleResetFilters() {
        setSelectedCuisine("All Cuisines");
        setCityFilter("All Cities");
        setSearchFilter("");
    }

    const filteredRestaurants = restaurants.filter((res) => {
        const matchesCuisine =
            selectedCuisine === "All Cuisines" ||
            Boolean(res.cuisine && res.cuisine.toLowerCase().includes(selectedCuisine.toLowerCase()));

        const matchesCity =
            cityFilter === "All Cities" ||
            res.city.toLowerCase() === cityFilter.toLowerCase();

        const searchLower = searchFilter.toLowerCase();
        const matchesSearch =
            searchFilter === "" ||
            res.name.toLowerCase().includes(searchLower) ||
            Boolean(res.cuisine && res.cuisine.toLowerCase().includes(searchLower)) ||
            res.city.toLowerCase().includes(searchLower) ||
            res.state.toLowerCase().includes(searchLower) ||
            Boolean(res.description && res.description.toLowerCase().includes(searchLower)) ||
            Boolean(res.address && res.address.toLowerCase().includes(searchLower));

        return matchesCuisine && matchesCity && matchesSearch;
    });

    return (
        <section className="space-y-6" id="discover">
            {/* Discovery Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <span>🍛 Discover Indian Restaurants</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                        Real-time listings from DineAura&apos;s Supabase restaurant directory.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleRefresh}
                        disabled={isLoading}
                        title="Reload restaurants from Supabase database"
                        aria-label="Reload restaurants"
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                        <svg
                            className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                        <span>{isLoading ? "Refreshing..." : "Refresh"}</span>
                    </button>

                    <span className="px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold text-xs border border-amber-200 dark:border-amber-900">
                        {filteredRestaurants.length} Restaurants
                    </span>
                </div>
            </div>

            {/* Database Error State */}
            {errorMessage && (
                <div
                    role="alert"
                    className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 text-xs sm:text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm"
                >
                    <div className="flex items-center gap-2.5">
                        <svg className="w-5 h-5 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                            <strong>Database Error:</strong> {errorMessage}
                        </span>
                    </div>

                    <button
                        type="button"
                        onClick={handleRefresh}
                        className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors whitespace-nowrap"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* Filter and Search Bar */}
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search text input */}
                    <div className="relative flex-1">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                            placeholder="Filter by name, cuisine, city, address..."
                            aria-label="Filter restaurants by name or location"
                            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                    </div>

                    {/* City selector dropdown */}
                    <div className="sm:w-56">
                        <select
                            value={cityFilter}
                            onChange={(e) => setCityFilter(e.target.value)}
                            aria-label="Filter by City"
                            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                        >
                            {cityOptions.map((city) => (
                                <option key={city} value={city}>
                                    {city === "All Cities" ? "📍 All Metros & Cities" : city}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Cuisine Category Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none" id="cuisines">
                    {cuisineOptions.map((cuisine) => {
                        const isSelected = selectedCuisine === cuisine;
                        return (
                            <button
                                key={cuisine}
                                type="button"
                                onClick={() => setSelectedCuisine(cuisine)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                                    isSelected
                                        ? "bg-amber-600 text-white shadow-sm"
                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                }`}
                            >
                                {cuisine}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="p-12 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mb-3 animate-spin">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Querying Supabase restaurants...
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        Fetching live records under Row Level Security.
                    </p>
                </div>
            )}

            {/* Successful Restaurant List */}
            {!isLoading && filteredRestaurants.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRestaurants.map((res) => (
                        <article
                            key={res.id}
                            className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-amber-300 dark:hover:border-amber-900/50 transition-all flex flex-col justify-between"
                        >
                            <div>
                                {/* Top Image Banner */}
                                <div className="relative w-full h-44 sm:h-48 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-zinc-800 dark:to-zinc-800/60 overflow-hidden">
                                    {res.image_url ? (
                                        <img
                                            src={res.image_url}
                                            alt={res.name}
                                            loading="lazy"
                                            onError={(e) => {
                                                const target = e.currentTarget;
                                                target.style.display = "none";
                                                const fallback = target.nextElementSibling as HTMLElement;
                                                if (fallback) fallback.style.display = "flex";
                                            }}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                        />
                                    ) : null}

                                    {/* Fallback pattern / badge if image_url is missing or broken */}
                                    <div
                                        className={`w-full h-full items-center justify-center bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-orange-500/10 dark:from-amber-950/30 dark:via-zinc-900 dark:to-orange-950/20 ${
                                            res.image_url ? "hidden" : "flex"
                                        }`}
                                    >
                                        <div className="flex flex-col items-center justify-center text-center p-4">
                                            <span className="text-3xl sm:text-4xl mb-1">🍽️</span>
                                            <span className="text-[11px] font-semibold tracking-wider text-amber-700/80 dark:text-amber-400/80 uppercase">
                                                {res.cuisine || "DineAura Select"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Floating Cuisine Pill (Top Left) */}
                                    <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10">
                                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 dark:bg-zinc-900/90 text-amber-800 dark:text-amber-300 shadow-sm backdrop-blur-sm border border-amber-200/50 dark:border-amber-900/50">
                                            {res.cuisine || "Indian Cuisine"}
                                        </span>
                                        <span
                                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm backdrop-blur-sm ${
                                                res.is_active
                                                    ? "bg-emerald-500/90 text-white"
                                                    : "bg-zinc-700/90 text-zinc-200"
                                            }`}
                                        >
                                            {res.is_active ? "Active" : "Inactive"}
                                        </span>
                                    </div>

                                    {/* Floating Star Rating (Top Right) */}
                                    <div className="absolute top-3 right-3 z-10">
                                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-md">
                                            <span>★</span>
                                            <span>{res.rating !== null && res.rating !== undefined ? Number(res.rating).toFixed(1) : "New"}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-5">
                                    {/* Restaurant Title */}
                                    <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                        {res.name}
                                    </h3>

                                    {/* Description if present */}
                                    {res.description && (
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                                            {res.description}
                                        </p>
                                    )}

                                    {/* Location Details: City & State */}
                                    <div className="mt-3 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                                        <p className="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300">
                                            <span>📍</span>
                                            <span>
                                                {res.city}, {res.state}
                                            </span>
                                        </p>
                                        {res.address && (
                                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 pl-4 truncate">
                                                {res.address}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer: Phone + Verified Status */}
                            <div className="px-5 pb-5 pt-3.5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                                <div className="text-zinc-500 dark:text-zinc-400 text-[11px]">
                                    {res.phone ? (
                                        <span className="flex items-center gap-1">
                                            <span>📞</span>
                                            <span>{res.phone}</span>
                                        </span>
                                    ) : (
                                        <span className="text-zinc-400">Contact available at venue</span>
                                    )}
                                </div>

                                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                    <span>✨</span>
                                    <span>DineAura Verified</span>
                                </span>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredRestaurants.length === 0 && (
                <div className="p-12 text-center bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
                    <span className="text-4xl">🍽️</span>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                        {restaurants.length === 0 ? "No Restaurants in Directory" : "No Matching Restaurants Found"}
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                        {restaurants.length === 0
                            ? "No restaurants have been added to the Supabase database yet. As soon as restaurants are registered, they will appear here under your authenticated session."
                            : "No restaurants matched your current search filters. Try clearing your filters or selecting a different city or cuisine."}
                    </p>

                    {restaurants.length > 0 && (
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm transition-all"
                            >
                                Reset Filters
                            </button>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
