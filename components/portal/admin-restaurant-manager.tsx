"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Restaurant, Category } from "@/lib/types/portal";
import {
    createRestaurantAction,
    updateRestaurantAction,
    toggleRestaurantStatusAction,
    deleteRestaurantAction,
    uploadRestaurantImageAction,
    type RestaurantActionResult,
} from "@/app/admin/restaurants/actions";

interface AdminRestaurantManagerProps {
    initialRestaurants: Restaurant[];
    categories: Category[];
}

const COMMON_INDIAN_STATES = [
    "Karnataka",
    "Maharashtra",
    "Delhi",
    "Telangana",
    "Tamil Nadu",
    "West Bengal",
    "Gujarat",
    "Rajasthan",
    "Uttar Pradesh",
    "Punjab",
    "Kerala",
    "Goa",
    "Madhya Pradesh",
    "Bihar",
    "Odisha",
    "Assam",
];

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

export function AdminRestaurantManager({
    initialRestaurants,
    categories,
}: AdminRestaurantManagerProps) {
    const router = useRouter();
    const [restaurants, setRestaurants] = useState<Restaurant[]>(initialRestaurants);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
    const [cuisineFilter, setCuisineFilter] = useState("all");
    const [cityFilter, setCityFilter] = useState("all");

    // Modal state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);

    // Image upload and preview states
    const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [imageUrlInput, setImageUrlInput] = useState<string>("");
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [uploadStatusText, setUploadStatusText] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Delete confirmation state
    const [restaurantToDelete, setRestaurantToDelete] = useState<Restaurant | null>(null);

    // Feedback state
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    // Derived cuisine and city lists
    const availableCuisines = Array.from(
        new Set([
            ...categories.map((c) => c.name),
            ...DEFAULT_CUISINES,
            ...restaurants.map((r) => r.cuisine).filter((c): c is string => Boolean(c)),
        ])
    );

    const availableCities = Array.from(
        new Set(restaurants.map((r) => r.city).filter((c): c is string => Boolean(c)))
    ).sort();

    // Filtered restaurants
    const filteredRestaurants = restaurants.filter((res) => {
        const matchesSearch =
            searchQuery === "" ||
            res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            res.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
            Boolean(res.cuisine && res.cuisine.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "active" && res.is_active) ||
            (statusFilter === "inactive" && !res.is_active);

        const matchesCuisine =
            cuisineFilter === "all" ||
            Boolean(res.cuisine && res.cuisine.toLowerCase() === cuisineFilter.toLowerCase());

        const matchesCity =
            cityFilter === "all" ||
            res.city.toLowerCase() === cityFilter.toLowerCase();

        return matchesSearch && matchesStatus && matchesCuisine && matchesCity;
    });

    // Summary statistics
    const totalCount = restaurants.length;
    const activeCount = restaurants.filter((r) => r.is_active).length;
    const inactiveCount = totalCount - activeCount;

    function handleOpenAdd() {
        setEditingRestaurant(null);
        setSelectedImageFile(null);
        setImagePreviewUrl(null);
        setImageUrlInput("");
        setIsUploading(false);
        setUploadStatusText("");
        setErrorMessage(null);
        setSuccessMessage(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setIsFormOpen(true);
    }

    function handleOpenEdit(restaurant: Restaurant) {
        setEditingRestaurant(restaurant);
        setSelectedImageFile(null);
        setImagePreviewUrl(restaurant.image_url || null);
        setImageUrlInput(restaurant.image_url || "");
        setIsUploading(false);
        setUploadStatusText("");
        setErrorMessage(null);
        setSuccessMessage(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setIsFormOpen(true);
    }

    function handleImageFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        // Size check (max 5MB)
        const MAX_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            setErrorMessage("Image file size must be less than 5MB.");
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        // MIME type check
        const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
        if (!ALLOWED_TYPES.includes(file.type)) {
            setErrorMessage("Unsupported file type. Please select a JPG, JPEG, PNG, or WebP image.");
            if (fileInputRef.current) fileInputRef.current.value = "";
            return;
        }

        setErrorMessage(null);
        setSelectedImageFile(file);
        const objectUrl = URL.createObjectURL(file);
        setImagePreviewUrl(objectUrl);
    }

    function handleRemoveImage() {
        setSelectedImageFile(null);
        setImagePreviewUrl(null);
        setImageUrlInput("");
        if (fileInputRef.current) fileInputRef.current.value = "";
    }

    function handleImageUrlInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const val = e.target.value;
        setImageUrlInput(val);
        if (!selectedImageFile) {
            setImagePreviewUrl(val.trim() || null);
        }
    }

    async function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (isPending || isUploading) return;

        setErrorMessage(null);
        setSuccessMessage(null);

        const form = event.currentTarget;
        const formData = new FormData(form);

        // Validate manual URL if provided without file
        const manualUrl = imageUrlInput.trim();
        if (!selectedImageFile && manualUrl) {
            try {
                const parsed = new URL(manualUrl);
                if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
                    setErrorMessage("Image URL must use http or https protocol.");
                    return;
                }
            } catch {
                setErrorMessage("Please enter a valid HTTP or HTTPS image URL.");
                return;
            }
        }

        let finalImageUrl: string | null = null;

        // Upload file if selected
        if (selectedImageFile) {
            setIsUploading(true);
            setUploadStatusText("Uploading image to Supabase Storage (restaurant-images)...");

            const uploadFormData = new FormData();
            uploadFormData.append("file", selectedImageFile);

            const uploadResult = await uploadRestaurantImageAction(uploadFormData);
            setIsUploading(false);

            if (uploadResult.error || !uploadResult.url) {
                setErrorMessage(uploadResult.error || "Image upload failed. Restaurant was not saved.");
                return;
            }

            finalImageUrl = uploadResult.url;
        } else if (manualUrl) {
            // External image URL provided
            finalImageUrl = manualUrl;
        } else if (imagePreviewUrl && editingRestaurant?.image_url) {
            // Preserve existing restaurant image when only other fields were edited
            finalImageUrl = editingRestaurant.image_url;
        } else {
            // Explicitly removed by user or never provided
            finalImageUrl = null;
        }

        // Set the final resolved image_url (empty string triggers clean nullification in action if intentionally removed)
        formData.set("image_url", finalImageUrl || "");

        startTransition(async () => {
            let result: RestaurantActionResult;
            if (editingRestaurant) {
                result = await updateRestaurantAction(editingRestaurant.id, formData);
            } else {
                result = await createRestaurantAction(formData);
            }

            if (result.error) {
                setErrorMessage(
                    selectedImageFile
                        ? `Image was uploaded, but failed to save restaurant: ${result.error}`
                        : result.error
                );
            } else {
                setSuccessMessage(result.message || "Operation successful.");
                setIsFormOpen(false);
                setSelectedImageFile(null);
                setImagePreviewUrl(null);
                setImageUrlInput("");

                if (result.data) {
                    if (editingRestaurant) {
                        setRestaurants((prev) =>
                            prev.map((r) => (r.id === editingRestaurant.id ? (result.data as Restaurant) : r))
                        );
                    } else {
                        setRestaurants((prev) => [result.data as Restaurant, ...prev]);
                    }
                } else {
                    // Fallback optimistic UI updates
                    const name = formData.get("name")?.toString() || "";
                    const city = formData.get("city")?.toString() || "";
                    const state = formData.get("state")?.toString() || "";
                    const cuisine = formData.get("cuisine")?.toString() || "";
                    const description = formData.get("description")?.toString() || null;
                    const address = formData.get("address")?.toString() || null;
                    const phone = formData.get("phone")?.toString() || null;
                    const rating = formData.get("rating") ? parseFloat(formData.get("rating") as string) : null;
                    const is_active = formData.get("is_active") === "on";

                    if (editingRestaurant) {
                        setRestaurants((prev) =>
                            prev.map((r) =>
                                r.id === editingRestaurant.id
                                    ? { ...r, name, city, state, cuisine, description, address, phone, image_url: finalImageUrl, rating, is_active }
                                    : r
                            )
                        );
                    }
                }
                router.refresh();
            }
        });
    }

    function handleToggleStatus(restaurant: Restaurant) {
        setErrorMessage(null);
        setSuccessMessage(null);

        startTransition(async () => {
            const result = await toggleRestaurantStatusAction(restaurant.id, restaurant.is_active);
            if (result.error) {
                setErrorMessage(result.error);
            } else {
                setSuccessMessage(result.message || "Status updated.");
                setRestaurants((prev) =>
                    prev.map((r) => (r.id === restaurant.id ? { ...r, is_active: !r.is_active } : r))
                );
                router.refresh();
            }
        });
    }

    function handleDeleteConfirm() {
        if (!restaurantToDelete) return;
        setErrorMessage(null);
        setSuccessMessage(null);

        startTransition(async () => {
            const result = await deleteRestaurantAction(restaurantToDelete.id);
            if (result.error) {
                setErrorMessage(result.error);
                setRestaurantToDelete(null);
            } else {
                setSuccessMessage(result.message || "Restaurant removed.");
                setRestaurants((prev) => prev.filter((r) => r.id !== restaurantToDelete.id));
                setRestaurantToDelete(null);
                router.refresh();
            }
        });
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Header & Add Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900 mb-2">
                        <span>🛡️</span>
                        <span>Administrator Workspace</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                        Restaurant Management
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                        Create, edit, toggle visibility, and maintain DineAura&apos;s verified restaurant directory.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleOpenAdd}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-lg transition-all"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add Restaurant</span>
                </button>
            </div>

            {/* Metrics Overview Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <p className="text-xs text-zinc-500 uppercase font-semibold">Total Venues</p>
                    <p className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1">{totalCount}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <p className="text-xs text-emerald-600 uppercase font-semibold">Active Venues</p>
                    <p className="text-2xl font-extrabold text-emerald-600 mt-1">{activeCount}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <p className="text-xs text-zinc-400 uppercase font-semibold">Inactive (Hidden)</p>
                    <p className="text-2xl font-extrabold text-zinc-500 mt-1">{inactiveCount}</p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <p className="text-xs text-amber-600 uppercase font-semibold">Security Level</p>
                    <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mt-2 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Admin RLS Enforced
                    </p>
                </div>
            </div>

            {/* Success and Error Alerts */}
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
                    <button type="button" onClick={() => setErrorMessage(null)} className="text-red-600 font-bold text-sm">
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
                    <button type="button" onClick={() => setSuccessMessage(null)} className="text-emerald-600 font-bold text-sm">
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
                        placeholder="Search by name, city, cuisine..."
                        className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
                        className="px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    >
                        <option value="all">All Statuses ({totalCount})</option>
                        <option value="active">Active Only ({activeCount})</option>
                        <option value="inactive">Inactive Only ({inactiveCount})</option>
                    </select>

                    <select
                        value={cuisineFilter}
                        onChange={(e) => setCuisineFilter(e.target.value)}
                        className="px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    >
                        <option value="all">All Cuisines</option>
                        {availableCuisines.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>

                    <select
                        value={cityFilter}
                        onChange={(e) => setCityFilter(e.target.value)}
                        className="px-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    >
                        <option value="all">All Cities</option>
                        {availableCities.map((city) => (
                            <option key={city} value={city}>
                                {city}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Restaurants Table / Cards */}
            {filteredRestaurants.length > 0 ? (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-zinc-600 dark:text-zinc-400">
                            <thead className="bg-zinc-50 dark:bg-zinc-800/60 uppercase font-bold text-[11px] text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                                <tr>
                                    <th className="px-6 py-3.5">Restaurant</th>
                                    <th className="px-4 py-3.5">Cuisine</th>
                                    <th className="px-4 py-3.5">Location</th>
                                    <th className="px-4 py-3.5">Rating</th>
                                    <th className="px-4 py-3.5">Status</th>
                                    <th className="px-6 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                {filteredRestaurants.map((res) => (
                                    <tr
                                        key={res.id}
                                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-11 h-11 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex-shrink-0 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-lg">
                                                    {res.image_url ? (
                                                        <>
                                                            <img
                                                                src={res.image_url}
                                                                alt={res.name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    const img = e.currentTarget;
                                                                    img.style.display = "none";
                                                                    const fallback = img.nextElementSibling as HTMLElement;
                                                                    if (fallback) fallback.style.display = "flex";
                                                                }}
                                                            />
                                                            <span className="hidden items-center justify-center w-full h-full text-lg" title="Image unavailable">
                                                                🍽️
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span title="No image uploaded">🍽️</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                                                        {res.name}
                                                    </div>
                                                    {res.phone && (
                                                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                                            📞 {res.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-900">
                                                {res.cuisine || "Indian"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="font-medium text-zinc-900 dark:text-zinc-100">
                                                {res.city}, {res.state}
                                            </div>
                                            {res.address && (
                                                <div className="text-[11px] text-zinc-500 truncate max-w-[200px]">
                                                    {res.address}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                                                <span>★</span>
                                                <span>
                                                    {res.rating !== null && res.rating !== undefined
                                                        ? Number(res.rating).toFixed(1)
                                                        : "Unrated"}
                                                </span>
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleStatus(res)}
                                                disabled={isPending}
                                                title="Click to toggle visibility status"
                                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors border ${
                                                    res.is_active
                                                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200"
                                                }`}
                                            >
                                                {res.is_active ? "● Active" : "○ Inactive"}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEdit(res)}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setRestaurantToDelete(res)}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/80 transition-colors"
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
                    <span className="text-4xl">🍽️</span>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                        {restaurants.length === 0 ? "No Restaurants Added Yet" : "No Matching Restaurants"}
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-500 max-w-sm mx-auto">
                        {restaurants.length === 0
                            ? "Get started by adding your first verified restaurant to DineAura."
                            : "No restaurants matched your filter criteria. Try adjusting your query."}
                    </p>
                    {restaurants.length === 0 && (
                        <button
                            type="button"
                            onClick={handleOpenAdd}
                            className="mt-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-all"
                        >
                            + Add First Restaurant
                        </button>
                    )}
                </div>
            )}

            {/* Add / Edit Restaurant Modal */}
            {isFormOpen && (
                <div
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !isPending && !isUploading) {
                            setIsFormOpen(false);
                        }
                    }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
                >
                    <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                            <div>
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                                    {editingRestaurant ? "Edit Restaurant Details" : "Add New Restaurant"}
                                </h2>
                                <p className="text-xs text-zinc-500">
                                    Fields directly synchronize with Supabase <code className="font-mono">public.restaurants</code>.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsFormOpen(false)}
                                className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <label htmlFor="name" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                                        Restaurant Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        required
                                        defaultValue={editingRestaurant?.name || ""}
                                        placeholder="e.g. Punjab Grill Heritage"
                                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="cuisine" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                                        Cuisine <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="cuisine"
                                        name="cuisine"
                                        type="text"
                                        required
                                        list="cuisines-list"
                                        defaultValue={editingRestaurant?.cuisine || ""}
                                        placeholder="e.g. North Indian, Mughlai"
                                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                    <datalist id="cuisines-list">
                                        {availableCuisines.map((c) => (
                                            <option key={c} value={c} />
                                        ))}
                                    </datalist>
                                </div>

                                <div>
                                    <label htmlFor="rating" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                                        Rating (0.0 to 5.0)
                                    </label>
                                    <input
                                        id="rating"
                                        name="rating"
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="5"
                                        defaultValue={editingRestaurant?.rating !== null ? editingRestaurant?.rating : ""}
                                        placeholder="e.g. 4.6"
                                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="city" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                                        City <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="city"
                                        name="city"
                                        type="text"
                                        required
                                        defaultValue={editingRestaurant?.city || ""}
                                        placeholder="e.g. Bengaluru"
                                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="state" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                                        State <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="state"
                                        name="state"
                                        type="text"
                                        required
                                        list="states-list"
                                        defaultValue={editingRestaurant?.state || ""}
                                        placeholder="e.g. Karnataka"
                                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                    <datalist id="states-list">
                                        {COMMON_INDIAN_STATES.map((s) => (
                                            <option key={s} value={s} />
                                        ))}
                                    </datalist>
                                </div>

                                <div className="sm:col-span-2">
                                    <label htmlFor="address" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                                        Full Address
                                    </label>
                                    <input
                                        id="address"
                                        name="address"
                                        type="text"
                                        defaultValue={editingRestaurant?.address || ""}
                                        placeholder="e.g. 100 Feet Road, Indiranagar, Bengaluru"
                                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="phone" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                                        Phone Number (India)
                                    </label>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        defaultValue={editingRestaurant?.phone || ""}
                                        placeholder="+91 98765 43210"
                                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>

                                <div className="sm:col-span-2 space-y-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                                                Restaurant Hero Image
                                            </label>
                                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                                Upload to Supabase Storage (<code className="font-mono">restaurant-images</code>) or provide an external URL.
                                            </p>
                                        </div>
                                        {imagePreviewUrl && (
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                disabled={isPending || isUploading}
                                                className="text-[11px] font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                                            >
                                                <span>✕</span> Remove Image
                                            </button>
                                        )}
                                    </div>

                                    {/* Preview Box or Upload Dropzone */}
                                    {imagePreviewUrl ? (
                                        <div className="relative rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-950 aspect-video max-h-48 group">
                                            <img
                                                src={imagePreviewUrl}
                                                alt="Restaurant Preview"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    // Fallback placeholder if remote image link is broken
                                                    (e.target as HTMLElement).classList.add("hidden");
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-3.5">
                                                <div className="text-white text-xs max-w-[70%]">
                                                    {selectedImageFile ? (
                                                        <div className="flex items-center gap-1.5 font-medium truncate">
                                                            <span>📁</span>
                                                            <span className="truncate">{selectedImageFile.name}</span>
                                                            <span className="text-[10px] text-zinc-300 flex-shrink-0">
                                                                ({(selectedImageFile.size / 1024 / 1024).toFixed(2)} MB)
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 font-medium truncate">
                                                            <span>🌐</span>
                                                            <span className="truncate">Saved / Remote Image</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={isPending || isUploading}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/95 hover:bg-white text-zinc-900 shadow-md backdrop-blur-sm transition-all"
                                                >
                                                    Replace Image
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => !isPending && !isUploading && fileInputRef.current?.click()}
                                            className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-amber-500 dark:hover:border-amber-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-white/60 dark:bg-zinc-900/40"
                                        >
                                            <div className="flex flex-col items-center justify-center gap-1.5">
                                                <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg">
                                                    📷
                                                </div>
                                                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                                    Click to select an image from your device
                                                </p>
                                                <p className="text-[11px] text-zinc-500">
                                                    JPG, PNG, WebP up to 5MB (Stores in Supabase Storage)
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Native File Input */}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleImageFileChange}
                                        disabled={isPending || isUploading}
                                        className="hidden"
                                    />

                                    {/* Upload Progress Status */}
                                    {isUploading && (
                                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2 animate-pulse">
                                            <span className="animate-spin">⏳</span>
                                            <span>{uploadStatusText || "Uploading image to Supabase Storage..."}</span>
                                        </div>
                                    )}

                                    {/* Alternative URL Input */}
                                    <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60">
                                        <label htmlFor="image_url_input" className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                                            Or Paste External Image URL
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="image_url_input"
                                                type="url"
                                                value={imageUrlInput}
                                                onChange={handleImageUrlInputChange}
                                                disabled={isPending || isUploading}
                                                placeholder="https://example.com/photos/restaurant.jpg"
                                                className="w-full px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                            {selectedImageFile && (
                                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                                                    Uploaded file preferred
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10px] text-zinc-400 mt-1">
                                            If an uploaded file is selected, it takes priority over this URL.
                                        </p>
                                    </div>
                                </div>

                                <div className="sm:col-span-2">
                                    <label htmlFor="description" className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                                        Description &bull; Culinary Highlights
                                    </label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        rows={3}
                                        defaultValue={editingRestaurant?.description || ""}
                                        placeholder="Describe specialty dishes, ambiance, or regional heritage..."
                                        className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>

                                <div className="sm:col-span-2 pt-2">
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            name="is_active"
                                            defaultChecked={editingRestaurant ? editingRestaurant.is_active : true}
                                            className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-zinc-300"
                                        />
                                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                                            Active venue (visible in public discovery directory)
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-5 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsFormOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isPending || isUploading}
                                    className="px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl shadow-sm transition-all flex items-center gap-2"
                                >
                                    {isUploading ? (
                                        <>
                                            <span className="animate-spin">⏳</span>
                                            <span>Uploading Image...</span>
                                        </>
                                    ) : isPending ? (
                                        <>
                                            <span className="animate-spin">⏳</span>
                                            <span>Saving to Database...</span>
                                        </>
                                    ) : editingRestaurant ? (
                                        "Save Changes"
                                    ) : (
                                        "Create Restaurant"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {restaurantToDelete && (
                <div
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !isPending) {
                            setRestaurantToDelete(null);
                        }
                    }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                >
                    <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center text-xl">
                            🗑️
                        </div>
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            Delete Restaurant?
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            Are you sure you want to delete <strong className="text-zinc-900 dark:text-zinc-100">{restaurantToDelete.name}</strong>? This action will permanently remove the record from Supabase.
                        </p>

                        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={() => setRestaurantToDelete(null)}
                                className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={handleDeleteConfirm}
                                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl shadow-sm transition-all"
                            >
                                {isPending ? "Deleting..." : "Confirm Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
