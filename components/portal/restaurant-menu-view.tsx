"use client";

import { useState } from "react";
import type { RestaurantMenuItem } from "@/lib/types/menu";

interface RestaurantMenuViewProps {
    menuItems: RestaurantMenuItem[];
    error?: string | null;
    restaurantName: string;
}

export function RestaurantMenuView({
    menuItems,
    error,
    restaurantName,
}: RestaurantMenuViewProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    // Group available menu items by category (case-preserved)
    const categories = Array.from(
        new Set(menuItems.map((item) => item.category?.trim()).filter(Boolean))
    );

    const filteredItems =
        selectedCategory === "all"
            ? menuItems
            : menuItems.filter(
                  (item) => item.category?.trim().toLowerCase() === selectedCategory.toLowerCase()
              );

    // Group items by category for structured hierarchical display
    const groupedByCategory = filteredItems.reduce<Record<string, RestaurantMenuItem[]>>(
        (acc, item) => {
            const cat = item.category?.trim() || "Specialties";
            if (!acc[cat]) {
                acc[cat] = [];
            }
            acc[cat].push(item);
            return acc;
        },
        {}
    );

    return (
        <section
            id="restaurant-menu"
            aria-labelledby="menu-heading"
            className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6"
        >
            {/* Menu Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-base flex-shrink-0">
                        📋
                    </span>
                    <div>
                        <h2
                            id="menu-heading"
                            className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight"
                        >
                            Menu &amp; Culinary Offerings
                        </h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            Handcrafted dishes prepared fresh at {restaurantName}
                        </p>
                    </div>
                </div>

                {menuItems.length > 0 && (
                    <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/60">
                        {menuItems.length} {menuItems.length === 1 ? "Dish" : "Dishes"} Available
                    </span>
                )}
            </div>

            {/* Error Fallback (Graceful message; does not break the details page) */}
            {error ? (
                <div
                    role="status"
                    className="p-6 text-center rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-2"
                >
                    <span className="text-2xl">⏳</span>
                    <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                        Menu Temporarily Unavailable
                    </h3>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                        The menu for this restaurant is currently being updated. Please check back shortly or contact the venue directly.
                    </p>
                </div>
            ) : menuItems.length === 0 ? (
                /* Clean Empty State */
                <div
                    role="status"
                    className="p-8 sm:p-12 text-center rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-dashed border-zinc-200 dark:border-zinc-700/80 space-y-3"
                >
                    <span className="text-4xl inline-block">🍽️</span>
                    <div className="space-y-1">
                        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                            Menu coming soon
                        </h3>
                        <p className="text-xs sm:text-sm text-zinc-500 max-w-sm mx-auto leading-relaxed">
                            This restaurant hasn&apos;t added its menu yet. Table reservations and direct phone inquiries are still welcome!
                        </p>
                    </div>
                </div>
            ) : (
                /* Categorized Menu List */
                <div className="space-y-6">
                    {/* Category Filter Pills (if multiple categories exist) */}
                    {categories.length > 1 && (
                        <div
                            role="tablist"
                            aria-label="Filter menu by category"
                            className="flex flex-wrap items-center gap-2 pb-2"
                        >
                            <button
                                type="button"
                                role="tab"
                                aria-selected={selectedCategory === "all"}
                                onClick={() => setSelectedCategory("all")}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                    selectedCategory === "all"
                                        ? "bg-amber-600 text-white shadow-sm"
                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100"
                                }`}
                            >
                                All ({menuItems.length})
                            </button>
                            {categories.map((cat) => {
                                const count = menuItems.filter(
                                    (i) => i.category?.trim().toLowerCase() === cat.toLowerCase()
                                ).length;
                                const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
                                return (
                                    <button
                                        key={cat}
                                        type="button"
                                        role="tab"
                                        aria-selected={isSelected}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                                            isSelected
                                                ? "bg-amber-600 text-white shadow-sm"
                                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100"
                                        }`}
                                    >
                                        {cat} ({count})
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Grouped Menu Sections */}
                    <div className="space-y-6 divide-y divide-zinc-100 dark:divide-zinc-800/80">
                        {Object.entries(groupedByCategory).map(([categoryName, items], idx) => (
                            <div
                                key={categoryName}
                                className={idx > 0 ? "pt-6 space-y-3" : "space-y-3"}
                            >
                                {/* Category Header */}
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                                    <h3 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
                                        {categoryName}
                                    </h3>
                                    <span className="text-xs text-zinc-400 font-normal">
                                        &bull; {items.length} {items.length === 1 ? "item" : "items"}
                                    </span>
                                </div>

                                {/* Items Grid */}
                                <ul
                                    className="grid grid-cols-1 md:grid-cols-2 gap-3"
                                    aria-label={`${categoryName} items`}
                                >
                                    {items.map((item) => (
                                        <li
                                            key={item.id}
                                            className="p-3.5 sm:p-4 rounded-2xl bg-zinc-50/70 dark:bg-zinc-800/50 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/80 border border-zinc-200/70 dark:border-zinc-700/60 transition-colors flex flex-col justify-between gap-2"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="space-y-1 min-w-0 flex-1">
                                                    <h4 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
                                                        {item.name}
                                                    </h4>
                                                    {item.description && (
                                                        <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 leading-snug line-clamp-2">
                                                            {item.description}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Price Tag in INR (₹) */}
                                                <div className="flex-shrink-0">
                                                    <span className="font-extrabold text-xs sm:text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-xl border border-amber-200/80 dark:border-amber-900/60 inline-flex items-center">
                                                        ₹{Number(item.price).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
