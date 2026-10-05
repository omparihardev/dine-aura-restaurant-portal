"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant, Category } from "@/lib/types/portal";
import { useLocation } from "./location-context";
import { LocationDropdown } from "./location-dropdown";
import { RestaurantImage } from "./restaurant-image";
import { calculateDistanceKm, formatDistance } from "@/lib/utils/distance";
import { usePortalSearch } from "./search-context";

interface RestaurantDiscoveryProps {
    initialRestaurants?: Restaurant[];
    initialCategories?: Category[];
    initialError?: string | null;
    initialCuisine?: string;
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
    initialCuisine,
}: RestaurantDiscoveryProps) {
    const searchParams = useSearchParams();
    const queryCuisine = searchParams?.get("cuisine") || undefined;

    // Dynamic cuisine list combining database categories and default seeded categories
    const cuisineOptions = [
        "All Cuisines",
        ...Array.from(
            new Set([
                ...(initialCuisine && initialCuisine !== "All Cuisines" ? [initialCuisine] : []),
                ...(queryCuisine && queryCuisine !== "All Cuisines" ? [queryCuisine] : []),
                ...initialCategories.map((c) => c.name),
                ...initialRestaurants.map((r) => r.cuisine).filter((c): c is string => Boolean(c)),
                ...DEFAULT_CUISINES,
            ])
        ),
    ];

    const incomingCuisine = queryCuisine || initialCuisine;
    const initialMatchedCuisine = incomingCuisine
        ? cuisineOptions.find((c) => c.toLowerCase() === incomingCuisine.toLowerCase()) || incomingCuisine
        : "All Cuisines";

    const {
        selectedCity,
        locationMode,
        userCoordinates,
        setDynamicCities,
        isCityMatch,
    } = useLocation();

    const [restaurants, setRestaurants] = useState<Restaurant[]>(initialRestaurants);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(initialError);

    const portalSearch = usePortalSearch();
    const [localSearchFilter, setLocalSearchFilter] = useState<string>("");

    const searchFilter = portalSearch ? portalSearch.searchQuery : localSearchFilter;
    const setSearchFilter = portalSearch ? portalSearch.setSearchQuery : setLocalSearchFilter;
    const [selectedCuisine, setSelectedCuisine] = useState<string>(initialMatchedCuisine);
    const [ratingFilter, setRatingFilter] = useState<string>("All Ratings");
    const [sortOption, setSortOption] = useState<string>("Recommended");

    // Automatically manage sorting when switching between Current Location and manual city
    useEffect(() => {
        if (locationMode === "current") {
            setSortOption("Nearest First");
        } else if (sortOption === "Nearest First") {
            setSortOption("Recommended");
        }
    }, [locationMode]);

    // Register dynamically discovered cities from live Supabase restaurant records
    useEffect(() => {
        if (restaurants.length > 0) {
            setDynamicCities(restaurants.map((r) => r.city).filter((c): c is string => Boolean(c)));
        }
    }, [restaurants, setDynamicCities]);

    // Synchronize selectedCuisine when URL query parameter changes
    useEffect(() => {
        const urlCuisine = searchParams?.get("cuisine");
        if (urlCuisine) {
            const canonical = cuisineOptions.find(
                (c) => c.toLowerCase() === urlCuisine.toLowerCase()
            ) || urlCuisine;
            setSelectedCuisine(canonical);
        } else if (urlCuisine === null && searchParams) {
            setSelectedCuisine("All Cuisines");
        }
    }, [searchParams]);

    // Synchronize searchFilter when URL query parameter changes
    useEffect(() => {
        const urlSearch = searchParams?.get("search");
        if (urlSearch !== null && urlSearch !== undefined) {
            setSearchFilter(urlSearch);
        }
    }, [searchParams]);

    async function handleRefresh() {
        setIsLoading(true);
        setErrorMessage(null);

        try {
            const supabase = createClient();
            let resolvedList: Restaurant[] = [];
            const { data, error } = await supabase
                .from("restaurants")
                .select("id, name, description, city, state, address, cuisine, image_url, phone, rating, latitude, longitude, is_active, created_at, updated_at")
                .order("created_at", { ascending: false });

            if (error && (error.code === "42703" || error.message?.includes("latitude"))) {
                const fallback = await supabase
                    .from("restaurants")
                    .select("id, name, description, city, state, address, cuisine, image_url, phone, rating, is_active, created_at, updated_at")
                    .order("created_at", { ascending: false });
                if (fallback.error) {
                    setErrorMessage(fallback.error.message);
                } else {
                    resolvedList = (fallback.data || []).map((r) => ({ ...r, latitude: null, longitude: null })) as Restaurant[];
                    setRestaurants(resolvedList);
                }
            } else if (error) {
                setErrorMessage(error.message);
            } else {
                resolvedList = (data as unknown as Restaurant[]) || [];
                setRestaurants(resolvedList);
            }
        } catch (err: unknown) {
            setErrorMessage(err instanceof Error ? err.message : "Failed to load restaurants from database.");
        } finally {
            setIsLoading(false);
        }
    }

    function handleCuisineChange(cuisine: string) {
        setSelectedCuisine(cuisine);
        if (typeof window !== "undefined" && window.history.replaceState) {
            const url = new URL(window.location.href);
            if (cuisine === "All Cuisines") {
                url.searchParams.delete("cuisine");
            } else {
                url.searchParams.set("cuisine", cuisine);
            }
            if (selectedCity && selectedCity !== "All Metros & Cities") {
                url.searchParams.set("city", selectedCity);
            }
            window.history.replaceState({}, "", url.pathname + url.search + url.hash);
        }
    }

    function handleClearFilters() {
        setSelectedCuisine("All Cuisines");
        if (portalSearch) {
            portalSearch.clearSearch();
        } else {
            setSearchFilter("");
        }
        setRatingFilter("All Ratings");
        setSortOption(locationMode === "current" ? "Nearest First" : "Recommended");
        // Preserve selectedCity / locationMode: Global location is a standing setting per Requirement 8 & 12
        if (typeof window !== "undefined" && window.history.replaceState) {
            const url = new URL(window.location.href);
            url.searchParams.delete("cuisine");
            url.searchParams.delete("search");
            if (locationMode !== "current" && selectedCity && selectedCity !== "All Metros & Cities") {
                url.searchParams.set("city", selectedCity);
            } else {
                url.searchParams.delete("city");
            }
            window.history.replaceState({}, "", url.pathname + url.search + url.hash);
        }
    }

    // Determine if any in-page filter or sort differs from default (global location is standing)
    const isFilterActive =
        searchFilter.trim() !== "" ||
        selectedCuisine !== "All Cuisines" ||
        ratingFilter !== "All Ratings" ||
        (locationMode === "current" ? sortOption !== "Nearest First" : sortOption !== "Recommended");

    const filteredRestaurants = restaurants.filter((res) => {
        // Cuisine filtering
        const matchesCuisine =
            selectedCuisine === "All Cuisines" ||
            Boolean(res.cuisine && res.cuisine.toLowerCase().includes(selectedCuisine.toLowerCase()));

        // Global city filtering (single source of truth; matches all active restaurants when in current location or all metros)
        const matchesCity = isCityMatch(res.city);

        // Rating filtering (using existing rating field)
        const ratingVal = res.rating !== null && res.rating !== undefined ? Number(res.rating) : null;
        let matchesRating = true;
        if (ratingFilter === "4.5+") {
            matchesRating = ratingVal !== null && ratingVal >= 4.5;
        } else if (ratingFilter === "4.0+") {
            matchesRating = ratingVal !== null && ratingVal >= 4.0;
        } else if (ratingFilter === "3.5+") {
            matchesRating = ratingVal !== null && ratingVal >= 3.5;
        }

        // Case-insensitive search across: name, cuisine, city, state, address (and description)
        const searchLower = searchFilter.trim().toLowerCase();
        const matchesSearch =
            searchLower === "" ||
            (res.name && res.name.toLowerCase().includes(searchLower)) ||
            Boolean(res.cuisine && res.cuisine.toLowerCase().includes(searchLower)) ||
            (res.city && res.city.toLowerCase().includes(searchLower)) ||
            (res.state && res.state.toLowerCase().includes(searchLower)) ||
            Boolean(res.address && res.address.toLowerCase().includes(searchLower)) ||
            Boolean(res.description && res.description.toLowerCase().includes(searchLower));

        return matchesCuisine && matchesCity && matchesRating && matchesSearch;
    });

    // Sorting options: Nearest First (when current location active), Recommended, Rating: High to Low, Rating: Low to High, Name: A to Z, Name: Z to A
    const sortedRestaurants = [...filteredRestaurants].sort((a, b) => {
        if (sortOption === "Nearest First") {
            const distA =
                locationMode === "current" && userCoordinates && a.latitude != null && a.longitude != null
                    ? calculateDistanceKm(userCoordinates.latitude, userCoordinates.longitude, Number(a.latitude), Number(a.longitude))
                    : null;
            const distB =
                locationMode === "current" && userCoordinates && b.latitude != null && b.longitude != null
                    ? calculateDistanceKm(userCoordinates.latitude, userCoordinates.longitude, Number(b.latitude), Number(b.longitude))
                    : null;

            if (distA !== null && distB !== null) {
                return distA - distB;
            }
            if (distA !== null && distB === null) return -1;
            if (distB !== null && distA === null) return 1;
            return 0;
        }
        if (sortOption === "Rating: High to Low") {
            const ratingA = a.rating !== null && a.rating !== undefined ? Number(a.rating) : -1;
            const ratingB = b.rating !== null && b.rating !== undefined ? Number(b.rating) : -1;
            return ratingB - ratingA;
        }
        if (sortOption === "Rating: Low to High") {
            const ratingA = a.rating !== null && a.rating !== undefined ? Number(a.rating) : 999;
            const ratingB = b.rating !== null && b.rating !== undefined ? Number(b.rating) : 999;
            return ratingA - ratingB;
        }
        if (sortOption === "Name: A to Z") {
            return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
        }
        if (sortOption === "Name: Z to A") {
            return b.name.localeCompare(a.name, undefined, { sensitivity: "base" });
        }
        // "Recommended" preserves original/default order
        return 0;
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
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
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

                    <span className="px-3 py-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-semibold text-xs border border-amber-200 dark:border-amber-900 whitespace-nowrap">
                        {sortedRestaurants.length} {sortedRestaurants.length === 1 ? "restaurant found" : "restaurants found"}
                        {locationMode === "current"
                            ? " near you"
                            : selectedCity !== "All Metros & Cities"
                            ? ` in ${selectedCity}`
                            : ""}
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
                        className="px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors whitespace-nowrap cursor-pointer"
                    >
                        Try Again
                    </button>
                </div>
            )}

            {/* Filter, Search, and Sort Bar */}
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
                    {/* Search text input */}
                    <div className="relative col-span-1 sm:col-span-2 lg:col-span-4">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            id="discovery-search-input"
                            type="text"
                            value={searchFilter}
                            onChange={(e) => setSearchFilter(e.target.value)}
                            placeholder="Search by name, cuisine, city, state, address..."
                            aria-label="Filter restaurants by name or location"
                            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        {searchFilter && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (portalSearch) {
                                        portalSearch.clearSearch();
                                    } else {
                                        setSearchFilter("");
                                    }
                                }}
                                title="Clear search text"
                                aria-label="Clear search text"
                                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                            >
                                <span className="text-sm font-bold">&times;</span>
                            </button>
                        )}
                    </div>

                    {/* Synchronized Location selector (Reflects & controls global location) */}
                    <div className="col-span-1 sm:col-span-1 lg:col-span-3">
                        <LocationDropdown variant="discovery" />
                    </div>

                    {/* Rating filter dropdown */}
                    <div className="col-span-1 sm:col-span-1 lg:col-span-2">
                        <select
                            value={ratingFilter}
                            onChange={(e) => setRatingFilter(e.target.value)}
                            aria-label="Filter by Rating"
                            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                        >
                            <option value="All Ratings">⭐ All Ratings</option>
                            <option value="4.5+">★ 4.5+</option>
                            <option value="4.0+">★ 4.0+</option>
                            <option value="3.5+">★ 3.5+</option>
                        </select>
                    </div>

                    {/* Sort dropdown */}
                    <div className={`col-span-1 sm:col-span-1 ${isFilterActive ? "lg:col-span-2" : "lg:col-span-3"}`}>
                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                            aria-label="Sort restaurants"
                            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                        >
                            {locationMode === "current" && (
                                <option value="Nearest First" className="font-semibold text-emerald-600 dark:text-emerald-400">
                                    📍 Nearest First
                                </option>
                            )}
                            <option value="Recommended">Recommended</option>
                            <option value="Rating: High to Low">Rating: High to Low</option>
                            <option value="Rating: Low to High">Rating: Low to High</option>
                            <option value="Name: A to Z">Name: A to Z</option>
                            <option value="Name: Z to A">Name: Z to A</option>
                        </select>
                    </div>

                    {/* Clear Filters button (Only shown when filters are active) */}
                    {isFilterActive && (
                        <div className="col-span-1 sm:col-span-1 lg:col-span-1 flex items-center">
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                title="Reset all filters and sorting"
                                aria-label="Clear all filters"
                                className="w-full px-2.5 py-2 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-colors flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap shadow-sm"
                            >
                                <span className="font-bold">✕</span>
                                <span>Clear</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Cuisine Category Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none" id="cuisines">
                    {cuisineOptions.map((cuisine) => {
                        const isSelected = selectedCuisine.toLowerCase() === cuisine.toLowerCase();
                        return (
                            <button
                                key={cuisine}
                                type="button"
                                onClick={() => handleCuisineChange(cuisine)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
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
            {!isLoading && sortedRestaurants.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedRestaurants.map((res) => {
                        const resDistance =
                            locationMode === "current" &&
                            userCoordinates &&
                            res.latitude !== null &&
                            res.latitude !== undefined &&
                            res.longitude !== null &&
                            res.longitude !== undefined
                                ? calculateDistanceKm(
                                      userCoordinates.latitude,
                                      userCoordinates.longitude,
                                      Number(res.latitude),
                                      Number(res.longitude)
                                  )
                                : null;

                        return (
                            <Link
                                key={res.id}
                                href={`/restaurants/${res.id}`}
                                className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-amber-400 dark:hover:border-amber-500/50 transition-all flex flex-col justify-between block focus:outline-none focus:ring-2 focus:ring-amber-500"
                            >
                                <div>
                                    {/* Top Image Banner */}
                                    <div className="relative w-full h-44 sm:h-48 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-zinc-800 dark:to-zinc-800/60 overflow-hidden">
                                        <RestaurantImage
                                            src={res.image_url}
                                            alt={res.name}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                            fallbackCuisine={res.cuisine}
                                            fallbackSubtitle="DineAura Select"
                                        />

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
                                        <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors flex items-center justify-between">
                                            <span>{res.name}</span>
                                            <span className="text-amber-600 dark:text-amber-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-sm font-semibold">
                                                &rarr;
                                            </span>
                                        </h3>

                                        {/* Description if present */}
                                        {res.description && (
                                            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 line-clamp-2 leading-relaxed">
                                                {res.description}
                                            </p>
                                        )}

                                        {/* Location Details: City, State & Distance */}
                                        <div className="mt-3 space-y-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300 truncate">
                                                    <span>📍</span>
                                                    <span>
                                                        {res.city}, {res.state}
                                                    </span>
                                                </p>
                                                {locationMode === "current" && (
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold flex-shrink-0 ${
                                                            resDistance !== null
                                                                ? "bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900"
                                                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                                                        }`}
                                                    >
                                                        <span>📍</span>
                                                        <span>{formatDistance(resDistance)}</span>
                                                    </span>
                                                )}
                                            </div>
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

                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                            <span>✨</span>
                                            <span>DineAura Verified</span>
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Empty State */}
            {!isLoading && sortedRestaurants.length === 0 && (
                <div className="p-12 text-center bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl space-y-3">
                    <span className="text-4xl">🍽️</span>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                        {restaurants.length === 0 ? "No Restaurants in Directory" : "No restaurants found"}
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                        {restaurants.length === 0
                            ? "No restaurants have been added to the Supabase database yet. As soon as restaurants are registered, they will appear here under your authenticated session."
                            : locationMode === "current" && selectedCuisine !== "All Cuisines"
                            ? `No restaurants found near your current location matching "${selectedCuisine}". Try choosing another cuisine or viewing all cities.`
                            : locationMode === "current"
                            ? "No restaurants currently found near your current location. Choose a city manually or select \"All Metros & Cities\" from the navbar."
                            : selectedCity !== "All Metros & Cities" && selectedCuisine !== "All Cuisines"
                            ? `No restaurants found in ${selectedCity} matching "${selectedCuisine}". Try choosing another city from the top navbar or clearing your filters.`
                            : selectedCity !== "All Metros & Cities"
                            ? `No restaurants currently listed in ${selectedCity}. Select "All Metros & Cities" from the top navbar to view all restaurants across India.`
                            : selectedCuisine !== "All Cuisines"
                            ? `No restaurants found matching the "${selectedCuisine}" cuisine category. Try clearing the filter or choosing another cuisine.`
                            : "Try changing your search or filters."}
                    </p>

                    {restaurants.length > 0 && (
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
