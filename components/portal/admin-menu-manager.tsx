"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Restaurant } from "@/lib/types/portal";
import type { RestaurantMenuItem } from "@/lib/types/menu";
import {
    createMenuItemAction,
    updateMenuItemAction,
    toggleMenuItemAvailabilityAction,
    deleteMenuItemAction,
} from "@/app/admin/restaurants/menu-actions";
import { RestaurantImage } from "./restaurant-image";

interface AdminMenuManagerProps {
    restaurant: Restaurant;
    initialMenuItems: RestaurantMenuItem[];
    tableNotReadyMessage?: string | null;
}

const COMMON_MENU_CATEGORIES = [
    "Starters & Appetizers",
    "Main Course",
    "Breads & Rotis",
    "Rice & Biryani",
    "Thali & Combos",
    "Street Food & Chaat",
    "Desserts & Sweets",
    "Beverages & Drinks",
    "Accompaniments & Salads",
];

export function AdminMenuManager({
    restaurant,
    initialMenuItems,
    tableNotReadyMessage,
}: AdminMenuManagerProps) {
    const router = useRouter();
    const [menuItems, setMenuItems] = useState<RestaurantMenuItem[]>(initialMenuItems);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available" | "unavailable">("all");

    // Modal states
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<RestaurantMenuItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<RestaurantMenuItem | null>(null);

    // Form inputs state
    const [formName, setFormName] = useState("");
    const [formCategory, setFormCategory] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [formPrice, setFormPrice] = useState("");
    const [formIsAvailable, setFormIsAvailable] = useState(true);

    // Status / Feedback
    const [errorMessage, setErrorMessage] = useState<string | null>(tableNotReadyMessage || null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    // Derived category options from existing items + common defaults
    const existingCategories = Array.from(
        new Set(menuItems.map((item) => item.category).filter(Boolean))
    );
    const allCategories = Array.from(
        new Set([...existingCategories, ...COMMON_MENU_CATEGORIES])
    );

    // Filtered items
    const filteredItems = menuItems.filter((item) => {
        const matchesSearch =
            searchQuery.trim() === "" ||
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            Boolean(item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
            item.category.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory =
            selectedCategory === "all" ||
            item.category.toLowerCase() === selectedCategory.toLowerCase();

        const matchesAvailability =
            availabilityFilter === "all" ||
            (availabilityFilter === "available" && item.is_available) ||
            (availabilityFilter === "unavailable" && !item.is_available);

        return matchesSearch && matchesCategory && matchesAvailability;
    });

    // Metrics
    const totalCount = menuItems.length;
    const availableCount = menuItems.filter((i) => i.is_available).length;
    const unavailableCount = totalCount - availableCount;

    function handleOpenAdd() {
        setEditingItem(null);
        setFormName("");
        setFormCategory(existingCategories[0] || COMMON_MENU_CATEGORIES[0]);
        setFormDescription("");
        setFormPrice("");
        setFormIsAvailable(true);
        setErrorMessage(null);
        setIsFormOpen(true);
    }

    function handleOpenEdit(item: RestaurantMenuItem) {
        setEditingItem(item);
        setFormName(item.name);
        setFormCategory(item.category);
        setFormDescription(item.description || "");
        setFormPrice(item.price.toString());
        setFormIsAvailable(item.is_available);
        setErrorMessage(null);
        setIsFormOpen(true);
    }

    function handleCloseForm() {
        setIsFormOpen(false);
        setEditingItem(null);
    }

    async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);

        // Client validation
        if (!formName.trim()) {
            setErrorMessage("Please enter an item name.");
            return;
        }
        if (!formCategory.trim()) {
            setErrorMessage("Please select or enter a category.");
            return;
        }
        const parsedPrice = parseFloat(formPrice);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
            setErrorMessage("Please enter a valid price (greater than or equal to 0).");
            return;
        }

        const formData = new FormData();
        formData.append("restaurant_id", restaurant.id);
        formData.append("name", formName.trim());
        formData.append("category", formCategory.trim());
        formData.append("description", formDescription.trim());
        formData.append("price", parsedPrice.toString());
        formData.append("is_available", formIsAvailable ? "true" : "false");

        startTransition(async () => {
            let res;
            if (editingItem) {
                formData.append("id", editingItem.id);
                res = await updateMenuItemAction(formData);
            } else {
                res = await createMenuItemAction(formData);
            }

            if (res.error) {
                setErrorMessage(res.error);
            } else {
                setSuccessMessage(res.message || "Operation successful.");
                setIsFormOpen(false);

                if (editingItem) {
                    setMenuItems((prev) =>
                        prev.map((it) =>
                            it.id === editingItem.id
                                ? {
                                      ...it,
                                      name: formName.trim(),
                                      category: formCategory.trim(),
                                      description: formDescription.trim() || null,
                                      price: Number(parsedPrice.toFixed(2)),
                                      is_available: formIsAvailable,
                                  }
                                : it
                        )
                    );
                } else if (res.data) {
                    setMenuItems((prev) => [res.data as RestaurantMenuItem, ...prev]);
                }
                router.refresh();
            }
        });
    }

    async function handleToggleAvailability(item: RestaurantMenuItem) {
        setErrorMessage(null);
        setSuccessMessage(null);

        const targetNewState = !item.is_available;

        // Optimistic UI update
        setMenuItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, is_available: targetNewState } : i))
        );

        startTransition(async () => {
            const res = await toggleMenuItemAvailabilityAction(item.id, restaurant.id, item.is_available);
            if (res.error) {
                // Revert optimistic update
                setMenuItems((prev) =>
                    prev.map((i) => (i.id === item.id ? { ...i, is_available: item.is_available } : i))
                );
                setErrorMessage(res.error);
            } else {
                setSuccessMessage(res.message || "Availability updated.");
                router.refresh();
            }
        });
    }

    async function handleDeleteConfirm() {
        if (!itemToDelete) return;

        setErrorMessage(null);
        setSuccessMessage(null);

        startTransition(async () => {
            const res = await deleteMenuItemAction(itemToDelete.id, restaurant.id);
            if (res.error) {
                setErrorMessage(res.error);
            } else {
                setMenuItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
                setSuccessMessage(res.message || "Menu item deleted.");
                setItemToDelete(null);
                router.refresh();
            }
        });
    }

    return (
        <div className="space-y-6">
            {/* Top Navigation & Breadcrumbs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <Link
                            href="/admin/restaurants"
                            className="hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 font-semibold transition-colors"
                        >
                            <span>&larr;</span>
                            <span>Back to Restaurants</span>
                        </Link>
                        <span>/</span>
                        <span className="text-zinc-700 dark:text-zinc-300 font-medium">Menu Management</span>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 relative border border-zinc-200 dark:border-zinc-700 flex-shrink-0">
                            <RestaurantImage
                                src={restaurant.image_url}
                                alt={restaurant.name}
                                fill
                                className="object-cover"
                                sizes="40px"
                                fallbackCuisine={restaurant.cuisine}
                                compactFallback
                            />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
                                <span>{restaurant.name}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                    Menu
                                </span>
                            </h1>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {restaurant.cuisine || "Indian"} &bull; {restaurant.city}, {restaurant.state}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Add Menu Item Button */}
                <button
                    type="button"
                    onClick={handleOpenAdd}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Menu Item</span>
                </button>
            </div>

            {/* Notice if table has not been initialized in Supabase yet */}
            {tableNotReadyMessage && (
                <div
                    role="alert"
                    className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-3 shadow-sm"
                >
                    <span className="text-lg">ℹ️</span>
                    <div className="space-y-1">
                        <p className="font-bold">Database Migration Pending (STEP 1)</p>
                        <p className="text-xs leading-relaxed text-amber-800/90 dark:text-amber-300/90">
                            The <code className="font-mono bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">public.restaurant_menu_items</code> table has not been applied to Supabase yet.
                            The UI and server actions are completely ready. Once you run <code className="font-mono bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">supabase/restaurant_menu_items.sql</code> in the Supabase SQL editor, this notice will disappear and menu data will persist.
                        </p>
                    </div>
                </div>
            )}

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <p className="text-[11px] text-zinc-500 uppercase font-semibold">Total Dishes</p>
                    <p className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">
                        {totalCount}
                    </p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <p className="text-[11px] text-emerald-600 uppercase font-semibold">Available</p>
                    <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 mt-1">
                        {availableCount}
                    </p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <p className="text-[11px] text-zinc-400 uppercase font-semibold">Unavailable / Sold Out</p>
                    <p className="text-xl sm:text-2xl font-extrabold text-zinc-500 mt-1">
                        {unavailableCount}
                    </p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <p className="text-[11px] text-amber-600 uppercase font-semibold">Categories</p>
                    <p className="text-xl sm:text-2xl font-extrabold text-amber-600 mt-1">
                        {existingCategories.length}
                    </p>
                </div>
            </div>

            {/* Feedback Alerts */}
            {errorMessage && (
                <div
                    role="alert"
                    className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 text-xs sm:text-sm flex items-center justify-between shadow-sm"
                >
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{errorMessage}</span>
                    </div>
                    <button type="button" onClick={() => setErrorMessage(null)} className="text-red-600 font-bold text-sm cursor-pointer">
                        &times;
                    </button>
                </div>
            )}

            {successMessage && (
                <div
                    role="alert"
                    className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm flex items-center justify-between shadow-sm"
                >
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 flex-shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{successMessage}</span>
                    </div>
                    <button type="button" onClick={() => setSuccessMessage(null)} className="text-emerald-600 font-bold text-sm cursor-pointer">
                        &times;
                    </button>
                </div>
            )}

            {/* Filter and Search Toolbar */}
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search menu by dish name or ingredients..."
                        className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    >
                        <option value="all">All Categories</option>
                        {allCategories.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>

                    <select
                        value={availabilityFilter}
                        onChange={(e) => setAvailabilityFilter(e.target.value as "all" | "available" | "unavailable")}
                        className="px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    >
                        <option value="all">All Availability ({totalCount})</option>
                        <option value="available">Available ({availableCount})</option>
                        <option value="unavailable">Unavailable ({unavailableCount})</option>
                    </select>
                </div>
            </div>

            {/* Menu Items Table */}
            {filteredItems.length > 0 ? (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-400">
                            <thead className="bg-zinc-50 dark:bg-zinc-800/60 uppercase font-bold text-[11px] text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                                <tr>
                                    <th className="px-6 py-3.5">Dish / Item</th>
                                    <th className="px-4 py-3.5">Category</th>
                                    <th className="px-4 py-3.5">Price</th>
                                    <th className="px-4 py-3.5">Status</th>
                                    <th className="px-6 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {filteredItems.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                                                    {item.name}
                                                </div>
                                                {item.description && (
                                                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 max-w-md line-clamp-2">
                                                        {item.description}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900">
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                                                ₹{Number(item.price).toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleAvailability(item)}
                                                disabled={isPending}
                                                title="Click to toggle availability"
                                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors border cursor-pointer ${
                                                    item.is_available
                                                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200"
                                                }`}
                                            >
                                                {item.is_available ? "● Available" : "○ Sold Out"}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEdit(item)}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setItemToDelete(item)}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/80 transition-colors cursor-pointer"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="p-12 text-center bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl space-y-3">
                    <span className="text-4xl">📜</span>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                        {menuItems.length === 0 ? "No Menu Items Added Yet" : "No Matching Menu Items"}
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-500 max-w-sm mx-auto">
                        {menuItems.length === 0
                            ? "Start building this restaurant's menu by adding starters, main courses, breads, or desserts."
                            : "No items matched your filter criteria. Try adjusting your search query."}
                    </p>
                    {menuItems.length === 0 && (
                        <button
                            type="button"
                            onClick={handleOpenAdd}
                            className="mt-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-all cursor-pointer"
                        >
                            + Add First Menu Item
                        </button>
                    )}
                </div>
            )}

            {/* Add / Edit Menu Item Modal */}
            {isFormOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) handleCloseForm();
                    }}
                >
                    <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 sm:p-8 space-y-6 my-8">
                        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                            <div>
                                <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
                                    {editingItem ? "Edit Menu Item" : "Add Menu Item"}
                                </h3>
                                <p className="text-xs text-zinc-500 mt-0.5">
                                    {restaurant.name} &bull; DineAura Menu
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={handleCloseForm}
                                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            {/* Item Name */}
                            <div>
                                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                                    Dish / Item Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="e.g. Butter Chicken / Paneer Tikka / Masala Dosa"
                                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                />
                            </div>

                            {/* Category & Price */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <div className="space-y-1.5">
                                        <input
                                            type="text"
                                            required
                                            list="category-suggestions"
                                            value={formCategory}
                                            onChange={(e) => setFormCategory(e.target.value)}
                                            placeholder="e.g. Main Course"
                                            className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                        <datalist id="category-suggestions">
                                            {allCategories.map((c) => (
                                                <option key={c} value={c} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                                        Price in INR (₹) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400 font-bold text-xs">
                                            ₹
                                        </span>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            step="0.01"
                                            value={formPrice}
                                            onChange={(e) => setFormPrice(e.target.value)}
                                            placeholder="299.00"
                                            className="w-full pl-8 pr-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                                    Description / Ingredients <span className="text-zinc-400 font-normal">(Optional)</span>
                                </label>
                                <textarea
                                    rows={3}
                                    value={formDescription}
                                    onChange={(e) => setFormDescription(e.target.value)}
                                    placeholder="Describe the dish, ingredients, preparation style, or spice level..."
                                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                                />
                            </div>

                            {/* Availability Toggle */}
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700">
                                <input
                                    type="checkbox"
                                    id="form-is-available"
                                    checked={formIsAvailable}
                                    onChange={(e) => setFormIsAvailable(e.target.checked)}
                                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                                />
                                <label htmlFor="form-is-available" className="text-xs font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer select-none">
                                    Available for customer ordering
                                </label>
                            </div>

                            {/* Modal Actions */}
                            <div className="pt-3 flex items-center justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800">
                                <button
                                    type="button"
                                    onClick={handleCloseForm}
                                    disabled={isPending}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    {isPending ? (
                                        <>
                                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <span>{editingItem ? "Update Item" : "Add to Menu"}</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {itemToDelete && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setItemToDelete(null);
                    }}
                >
                    <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 shadow-2xl">
                        <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center text-xl mx-auto">
                            🗑️
                        </div>
                        <div className="text-center space-y-1">
                            <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                                Delete &quot;{itemToDelete.name}&quot;?
                            </h3>
                            <p className="text-xs text-zinc-500">
                                This will remove this dish from {restaurant.name}&apos;s menu. This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setItemToDelete(null)}
                                disabled={isPending}
                                className="flex-1 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteConfirm}
                                disabled={isPending}
                                className="flex-1 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer disabled:opacity-50"
                            >
                                {isPending ? "Deleting..." : "Yes, Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
