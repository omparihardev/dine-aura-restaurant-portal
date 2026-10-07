"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { RestaurantImage } from "./restaurant-image";
import type { Restaurant } from "@/lib/types/portal";

interface FavoritesManagerProps {
    allRestaurants: Restaurant[];
}

export function FavoritesManager({ allRestaurants }: FavoritesManagerProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Read stored favorite IDs from localStorage on mount and listen for storage updates
    useEffect(() => {
        setIsMounted(true);

        function syncFavorites() {
            try {
                const stored = localStorage.getItem("dineaura_favorites");
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed)) {
                        setFavoriteIds(parsed);
                        return;
                    }
                }
                setFavoriteIds([]);
            } catch {
                setFavoriteIds([]);
            }
        }

        syncFavorites();
        window.addEventListener("storage", syncFavorites);
        window.addEventListener("dineaura_favorites_updated", syncFavorites);

        return () => {
            window.removeEventListener("storage", syncFavorites);
            window.removeEventListener("dineaura_favorites_updated", syncFavorites);
        };
    }, []);

    function showToast(msg: string) {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage((current) => (current === msg ? null : current));
        }, 3200);
    }

    function handleRemoveFavorite(id: string, name: string) {
        const nextIds = favoriteIds.filter((item) => item !== id);
        setFavoriteIds(nextIds);

        try {
            localStorage.setItem("dineaura_favorites", JSON.stringify(nextIds));
            window.dispatchEvent(new Event("dineaura_favorites_updated"));
        } catch {
            // Ignore write errors
        }

        showToast(`Removed "${name}" from your favorites.`);
    }

    // Filter real Supabase restaurant records by saved IDs
    const favoriteRestaurants = allRestaurants.filter((res) => favoriteIds.includes(res.id));

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-3 rounded-2xl shadow-2xl border border-zinc-700 dark:border-zinc-300 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-bounce">
                    <span>✨</span>
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-6">
                <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-500/20 dark:border-red-900/60 shadow-2xs">
                        <span>❤️</span>
                        <span>Saved Places &bull; Browser Sync</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                        Your Favorite Restaurants
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                        Restaurants you&apos;ve saved for later.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <span className="px-3.5 py-1.5 rounded-full bg-amber-500/10 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold text-xs border border-amber-500/20 dark:border-amber-900/60 shadow-2xs">
                        {isMounted ? `${favoriteRestaurants.length} ${favoriteRestaurants.length === 1 ? "Favorite" : "Favorites"}` : "Loading..."}
                    </span>

                    <Link
                        href="/#discover"
                        className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                        <span>&larr;</span>
                        <span>Discover More</span>
                    </Link>
                </div>
            </div>

            {/* Content: Favorites Grid or Professional Empty State */}
            {isMounted && favoriteRestaurants.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favoriteRestaurants.map((res) => (
                        <article
                            key={res.id}
                            className="group bg-white dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl hover:shadow-amber-500/5 hover:border-amber-500/40 dark:hover:border-amber-500/30 transition-all duration-300 flex flex-col justify-between"
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
                                <div className="p-5 space-y-2">
                                    <Link
                                        href={`/restaurants/${res.id}`}
                                        className="block"
                                    >
                                        <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                                            {res.name}
                                        </h3>
                                    </Link>

                                    {res.description && (
                                        <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                                            {res.description}
                                        </p>
                                    )}

                                    {/* Location Details: City, State, Address */}
                                    <div className="pt-1 space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
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

                            {/* Card Actions Footer: View Restaurant + Remove Favorite */}
                            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
                                <Link
                                    href={`/restaurants/${res.id}`}
                                    className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold text-center transition-colors shadow-sm flex items-center justify-center gap-1"
                                >
                                    <span>View Restaurant</span>
                                    <span>&rarr;</span>
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => handleRemoveFavorite(res.id, res.name)}
                                    title="Remove from favorites"
                                    aria-label={`Remove ${res.name} from favorites`}
                                    className="py-2 px-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                >
                                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                    </svg>
                                    <span>Remove</span>
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            ) : isMounted ? (
                /* Empty State */
                <div className="p-12 sm:p-16 text-center bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-4 max-w-xl mx-auto shadow-sm">
                    <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-3xl mx-auto shadow-inner">
                        ❤️
                    </div>

                    <div className="space-y-1.5">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                            No Favorite Restaurants Yet
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                            Save restaurants you love and they&apos;ll appear here.
                        </p>
                    </div>

                    <div className="pt-2">
                        <Link
                            href="/#discover"
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-600/25 transition-all"
                        >
                            <span>Explore Restaurants</span>
                            <span>&rarr;</span>
                        </Link>
                    </div>
                </div>
            ) : (
                /* Skeleton while checking localStorage */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map((n) => (
                        <div key={n} className="h-72 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800" />
                    ))}
                </div>
            )}
        </div>
    );
}
