"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { RestaurantImage } from "./restaurant-image";
import type { User } from "@supabase/supabase-js";
import type { Restaurant, UserProfile } from "@/lib/types/portal";
import { createReservationAction } from "@/app/reservations/actions";

interface RestaurantDetailsViewProps {
    restaurant: Restaurant;
    user?: User | null;
    profile?: UserProfile | null;
}

const SEATING_PREFERENCES = [
    "No Preference",
    "Indoor",
    "Outdoor",
    "Family Area",
    "Private Dining",
];

const TIME_SLOTS = [
    { value: "12:00", label: "12:00 PM (Lunch)" },
    { value: "12:30", label: "12:30 PM (Lunch)" },
    { value: "13:00", label: "01:00 PM (Lunch)" },
    { value: "13:30", label: "01:30 PM (Lunch)" },
    { value: "14:00", label: "02:00 PM (Lunch)" },
    { value: "14:30", label: "02:30 PM (Late Lunch)" },
    { value: "19:00", label: "07:00 PM (Dinner)" },
    { value: "19:30", label: "07:30 PM (Dinner)" },
    { value: "20:00", label: "08:00 PM (Dinner Prime)" },
    { value: "20:30", label: "08:30 PM (Dinner Prime)" },
    { value: "21:00", label: "09:00 PM (Dinner)" },
    { value: "21:30", label: "09:30 PM (Late Dinner)" },
    { value: "22:00", label: "10:00 PM (Late Dinner)" },
];

export function RestaurantDetailsView({
    restaurant,
    user,
    profile,
}: RestaurantDetailsViewProps) {
    const [isFavorite, setIsFavorite] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submittedReservation, setSubmittedReservation] = useState<{
        id: string;
        name: string;
        phone: string;
        date: string;
        time: string;
        guests: string;
    } | null>(null);

    const [customerName, setCustomerName] = useState(
        profile?.full_name || user?.user_metadata?.full_name || ""
    );
    const [customerPhone, setCustomerPhone] = useState(
        profile?.phone || ""
    );
    const [reservationDate, setReservationDate] = useState("");
    const [reservationTime, setReservationTime] = useState("19:30");
    const [partySize, setPartySize] = useState("2");
    const [seatingPreference, setSeatingPreference] = useState("No Preference");
    const [specialRequest, setSpecialRequest] = useState("");
    const [formError, setFormError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Administrative accounts are managers, not table requesters
    const isAdmin = profile?.role === "admin" || user?.user_metadata?.role === "admin";

    // Sync profile data when available
    useEffect(() => {
        if (profile?.full_name && !customerName) {
            setCustomerName(profile.full_name);
        }
        if (profile?.phone && !customerPhone) {
            setCustomerPhone(profile.phone);
        }
    }, [profile]);

    // Today's date in YYYY-MM-DD for min date attribute
    const todayDateString = new Date().toISOString().split("T")[0];

    // Initialize and synchronize favorite status with localStorage and other pages
    useEffect(() => {
        function checkFavoriteStatus() {
            try {
                const savedFavorites = localStorage.getItem("dineaura_favorites");
                if (savedFavorites) {
                    const list = JSON.parse(savedFavorites);
                    setIsFavorite(Array.isArray(list) && list.includes(restaurant.id));
                } else {
                    setIsFavorite(false);
                }
            } catch {
                setIsFavorite(false);
            }
        }

        checkFavoriteStatus();
        window.addEventListener("storage", checkFavoriteStatus);
        window.addEventListener("dineaura_favorites_updated", checkFavoriteStatus);

        return () => {
            window.removeEventListener("storage", checkFavoriteStatus);
            window.removeEventListener("dineaura_favorites_updated", checkFavoriteStatus);
        };
    }, [restaurant.id]);

    function showToast(msg: string) {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage((current) => (current === msg ? null : current));
        }, 3200);
    }

    function toggleFavorite() {
        const nextState = !isFavorite;
        setIsFavorite(nextState);

        try {
            const savedFavorites = localStorage.getItem("dineaura_favorites");
            let list: string[] = savedFavorites ? JSON.parse(savedFavorites) : [];
            if (!Array.isArray(list)) list = [];

            if (nextState) {
                if (!list.includes(restaurant.id)) list.push(restaurant.id);
                showToast(`❤️ Added "${restaurant.name}" to your favorites`);
            } else {
                list = list.filter((id) => id !== restaurant.id);
                showToast(`Removed "${restaurant.name}" from favorites`);
            }
            localStorage.setItem("dineaura_favorites", JSON.stringify(list));
            window.dispatchEvent(new Event("dineaura_favorites_updated"));
        } catch {
            showToast(nextState ? "Added to favorites" : "Removed from favorites");
        }
    }

    async function handleShare() {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(window.location.href);
                showToast("🔗 Restaurant link copied to clipboard!");
            } else {
                showToast("URL: " + window.location.href);
            }
        } catch {
            showToast("URL: " + window.location.href);
        }
    }

    async function handleReservationSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setFormError(null);

        if (isAdmin) {
            setFormError("Administrators cannot submit table reservation requests.");
            return;
        }

        if (!user) {
            setFormError("Please sign in to your account to submit a table request.");
            return;
        }

        if (!customerName.trim()) {
            setFormError("Please enter your name.");
            return;
        }

        if (!customerPhone.trim()) {
            setFormError("Please enter your contact phone number.");
            return;
        }

        if (!reservationDate) {
            setFormError("Please select a reservation date.");
            return;
        }

        if (!reservationTime) {
            setFormError("Please choose a preferred time slot.");
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("restaurant_id", restaurant.id);
            formData.append("customer_name", customerName.trim());
            formData.append("customer_phone", customerPhone.trim());
            formData.append("reservation_date", reservationDate);
            formData.append("reservation_time", reservationTime);
            formData.append("party_size", partySize);
            formData.append("seating_preference", seatingPreference);
            if (specialRequest.trim()) {
                formData.append("special_request", specialRequest.trim());
            }

            const result = await createReservationAction(formData);

            if (result.error) {
                setFormError(result.error);
            } else {
                setSubmittedReservation({
                    id: result.reservationId || "REF-" + Date.now().toString(36).toUpperCase(),
                    name: customerName.trim(),
                    phone: customerPhone.trim(),
                    date: reservationDate,
                    time: reservationTime,
                    guests: partySize,
                });
                showToast("Table request submitted successfully. The restaurant will review your request and confirm availability.");
            }
        } catch (err: unknown) {
            setFormError(err instanceof Error ? err.message : "Failed to submit reservation request.");
        } finally {
            setIsSubmitting(false);
        }
    }

    function resetModal() {
        setIsModalOpen(false);
        setSubmittedReservation(null);
        setFormError(null);
    }

    // Format registration date safely
    const formattedCreatedDate = restaurant.created_at
        ? new Date(restaurant.created_at).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
          })
        : null;

    // Google Maps URLs: use exact geographic coordinates if available, otherwise fallback to address
    const hasCoordinates =
        restaurant.latitude !== null &&
        restaurant.latitude !== undefined &&
        restaurant.longitude !== null &&
        restaurant.longitude !== undefined;

    const openMapsUrl = hasCoordinates
        ? `https://www.google.com/maps/search/?api=1&query=${restaurant.latitude},${restaurant.longitude}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${restaurant.name}, ${restaurant.address ? restaurant.address + ", " : ""}${restaurant.city}, ${restaurant.state}`
          )}`;

    const directionsUrl = hasCoordinates
        ? `https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`
        : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
              `${restaurant.name}, ${restaurant.address ? restaurant.address + ", " : ""}${restaurant.city}, ${restaurant.state}`
          )}`;

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-3 rounded-2xl shadow-2xl border border-zinc-700 dark:border-zinc-300 text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-bounce">
                    <span>✨</span>
                    <span>{toastMessage}</span>
                </div>
            )}

            {/* Top Navigation & Breadcrumbs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                    <Link
                        href="/"
                        className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1"
                    >
                        <span>🏠</span>
                        <span>Home</span>
                    </Link>
                    <span>/</span>
                    <Link
                        href="/#discover"
                        className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                    >
                        Restaurants
                    </Link>
                    <span>/</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium truncate max-w-[200px] sm:max-w-xs">
                        {restaurant.name}
                    </span>
                </nav>

                <div className="flex items-center gap-2">
                    <Link
                        href="/#discover"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-amber-600 dark:hover:text-amber-400 transition-all shadow-sm"
                    >
                        <span>&larr;</span>
                        <span>Back to Restaurants</span>
                    </Link>

                    <button
                        type="button"
                        onClick={handleShare}
                        title="Share restaurant page"
                        aria-label="Share restaurant page"
                        className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-lg">
                {/* Hero Media Container */}
                <div className="relative w-full h-64 sm:h-80 md:h-96 bg-gradient-to-br from-amber-950/60 via-zinc-900 to-zinc-950 overflow-hidden">
                    <RestaurantImage
                        src={restaurant.image_url}
                        alt={restaurant.name}
                        fill
                        priority
                        className="object-cover opacity-85 transition-transform duration-700 hover:scale-105"
                        sizes="100vw"
                        fallbackCuisine={restaurant.cuisine}
                        fallbackSubtitle={`Authentic Indian dining experience in ${restaurant.city}`}
                    />

                    {/* Gradient Overlay for Text Legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent pointer-events-none" />

                    {/* Top Floating Badges */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 z-10">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-600/90 text-white backdrop-blur-md shadow-md border border-amber-400/40">
                                🍛 {restaurant.cuisine || "Indian Cuisine"}
                            </span>
                            <span
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-md flex items-center gap-1.5 ${
                                    restaurant.is_active
                                        ? "bg-emerald-500/90 text-white"
                                        : "bg-zinc-700/90 text-zinc-200"
                                }`}
                            >
                                <span className={`w-2 h-2 rounded-full ${restaurant.is_active ? "bg-white animate-pulse" : "bg-zinc-400"}`} />
                                {restaurant.is_active ? "Active Partner" : "Temporarily Inactive"}
                            </span>
                        </div>

                        {/* Floating Rating Pill */}
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600/95 text-white text-xs sm:text-sm font-bold shadow-lg backdrop-blur-md">
                            <span>★</span>
                            <span>{restaurant.rating !== null && restaurant.rating !== undefined ? Number(restaurant.rating).toFixed(1) : "New"}</span>
                            <span className="text-emerald-200 text-[11px] font-normal">/ 5.0</span>
                        </div>
                    </div>

                    {/* Bottom Hero Info */}
                    <div className="absolute bottom-6 left-6 right-6 z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="space-y-2 max-w-2xl">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 text-amber-300 backdrop-blur-sm border border-amber-400/30">
                                    <span>✨</span>
                                    <span>DineAura Verified</span>
                                </span>
                                <span className="text-zinc-300 text-xs">
                                    ₹₹ • Moderate Dining
                                </span>
                            </div>

                            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">
                                {restaurant.name}
                            </h1>

                            <p className="flex items-center gap-2 text-zinc-300 text-xs sm:text-sm font-medium">
                                <span>📍</span>
                                <span>
                                    {restaurant.city}, {restaurant.state}
                                    {restaurant.address ? ` &bull; ${restaurant.address}` : ""}
                                </span>
                            </p>
                        </div>

                        {/* Quick Hero Actions on Mobile/Desktop */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={toggleFavorite}
                                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md flex items-center gap-2 backdrop-blur-md border cursor-pointer ${
                                    isFavorite
                                        ? "bg-red-600/90 text-white border-red-400 hover:bg-red-700"
                                        : "bg-white/90 text-zinc-900 border-white hover:bg-white dark:bg-zinc-800/90 dark:text-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                                }`}
                            >
                                <svg
                                    className={`w-4 h-4 ${isFavorite ? "fill-current text-white" : "stroke-current fill-none text-red-500"}`}
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                    />
                                </svg>
                                <span>{isFavorite ? "Favorited" : "Favorite"}</span>
                            </button>

                            {!isAdmin && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(true);
                                        setFormError(null);
                                    }}
                                    className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-amber-600/25 transition-all flex items-center gap-2 cursor-pointer"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>Request a Table</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid: 2 Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Detailed Content (2 cols) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* About Section */}
                    <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                            <span className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-sm">
                                📖
                            </span>
                            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
                                About {restaurant.name}
                            </h2>
                        </div>

                        <div className="text-zinc-700 dark:text-zinc-300 text-sm sm:text-base leading-relaxed space-y-3">
                            {restaurant.description ? (
                                <p className="whitespace-pre-line">{restaurant.description}</p>
                            ) : (
                                <p className="text-zinc-500 dark:text-zinc-400 italic">
                                    Welcome to {restaurant.name}, a distinguished culinary destination located in {restaurant.city}, {restaurant.state}. Known for its commitment to authentic {restaurant.cuisine || "Indian"} flavours, {restaurant.name} welcomes diners with hearty hospitality and meticulously prepared dishes.
                                </p>
                            )}
                        </div>

                        {/* Signature Highlights Pills */}
                        <div className="pt-4 flex flex-wrap items-center gap-2">
                            <span className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center gap-1.5">
                                <span>🌿</span>
                                <span>Fresh Authentic Ingredients</span>
                            </span>
                            <span className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center gap-1.5">
                                <span>👨‍🍳</span>
                                <span>Master Chef Prepared</span>
                            </span>
                            <span className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center gap-1.5">
                                <span>🍽️</span>
                                <span>Dine-in &amp; Family Friendly</span>
                            </span>
                            <span className="px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center gap-1.5">
                                <span>🛡️</span>
                                <span>Verified Hygiene Standards</span>
                            </span>
                        </div>
                    </section>

                    {/* Location & Contact Information Card */}
                    <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
                        <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-2.5">
                                <span className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-sm">
                                    📍
                                </span>
                                <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
                                    Location &amp; Contact
                                </h2>
                            </div>

                            <a
                                href={openMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                            >
                                <span>Open Google Maps</span>
                                <span>&rarr;</span>
                            </a>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Address Box */}
                            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-1.5">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    Postal Address
                                </span>
                                <p className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                    {restaurant.address || "Street address available upon enquiry"}
                                </p>
                                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                    {restaurant.city}, {restaurant.state}, India
                                </p>
                                {hasCoordinates && (
                                    <div className="pt-2 mt-1 border-t border-zinc-200/80 dark:border-zinc-700/60 flex items-center gap-1.5 text-[11px] font-mono text-amber-700 dark:text-amber-400 font-semibold">
                                        <span>📍</span>
                                        <span>GPS: {Number(restaurant.latitude).toFixed(6)}, {Number(restaurant.longitude).toFixed(6)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Phone / Contact Box */}
                            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-1.5">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    Direct Contact
                                </span>
                                {restaurant.phone ? (
                                    <div className="space-y-1">
                                        <a
                                            href={`tel:${restaurant.phone}`}
                                            className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1.5"
                                        >
                                            <span>📞</span>
                                            <span>{restaurant.phone}</span>
                                        </a>
                                        <p className="text-[11px] text-zinc-500">
                                            Tap to call directly from your device
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                                        Phone assistance available directly at the venue
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Directions CTA */}
                        <div className="pt-2">
                            <a
                                href={directionsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-3 px-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-700"
                            >
                                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>Get Driving / Transit Directions</span>
                            </a>
                        </div>
                    </section>

                    {/* Directory Transparency & Verification Card */}
                    <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                            <span className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-sm">
                                ℹ️
                            </span>
                            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
                                DineAura Directory Details
                            </h2>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                                <span className="text-zinc-500 block text-[11px]">Primary Cuisine</span>
                                <span className="font-bold text-zinc-800 dark:text-zinc-200 mt-1 block">
                                    {restaurant.cuisine || "Indian"}
                                </span>
                            </div>

                            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                                <span className="text-zinc-500 block text-[11px]">State / Region</span>
                                <span className="font-bold text-zinc-800 dark:text-zinc-200 mt-1 block">
                                    {restaurant.state}
                                </span>
                            </div>

                            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                                <span className="text-zinc-500 block text-[11px]">Listing Status</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                                    {restaurant.is_active ? "Live & Verified" : "Under Review"}
                                </span>
                            </div>

                            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                                <span className="text-zinc-500 block text-[11px]">Registered On</span>
                                <span className="font-bold text-zinc-800 dark:text-zinc-200 mt-1 block">
                                    {formattedCreatedDate || "Recently Added"}
                                </span>
                            </div>
                        </div>

                        <div className="pt-2 text-[11px] text-zinc-500 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
                            <span>Record ID: <code className="font-mono text-zinc-600 dark:text-zinc-400">{restaurant.id}</code></span>
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                <span>🔒</span>
                                <span>Supabase RLS Protected</span>
                            </span>
                        </div>
                    </section>
                </div>

                {/* Right Column: Sticky Action Area & Fast Info */}
                <div className="space-y-6">
                    {/* Primary Booking & Table Request Card */}
                    <div className="lg:sticky lg:top-24 p-6 sm:p-7 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-md space-y-6">
                        <div className="space-y-1.5">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                                Table Reservations
                            </span>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                                Reserve a Table
                            </h3>
                            <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                {isAdmin
                                    ? "Customer reservations are managed through the admin panel."
                                    : `Submit a table reservation request for your party at ${restaurant.name}.`}
                            </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            {isAdmin ? (
                                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 space-y-2.5">
                                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
                                        <span className="p-1 rounded bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">🛡️</span>
                                        <span>Admin View</span>
                                    </div>
                                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        Administrators cannot submit table reservation requests. You can manage live bookings across all venues in the admin dashboard.
                                    </p>
                                    <Link
                                        href="/admin/reservations"
                                        className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                                    >
                                        <span>Manage Reservations</span>
                                        <span>&rarr;</span>
                                    </Link>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(true);
                                        setFormError(null);
                                    }}
                                    className="w-full py-3.5 px-4 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>Request a Table</span>
                                </button>
                            )}

                            {restaurant.phone ? (
                                <a
                                    href={`tel:${restaurant.phone}`}
                                    className="w-full py-3 px-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-700"
                                >
                                    <span>📞 Call: {restaurant.phone}</span>
                                </a>
                            ) : null}

                            <button
                                type="button"
                                onClick={toggleFavorite}
                                className={`w-full py-3 px-4 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                                    isFavorite
                                        ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900"
                                        : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                }`}
                            >
                                <svg
                                    className={`w-4 h-4 ${isFavorite ? "fill-current text-red-600" : "stroke-current fill-none text-zinc-400"}`}
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                    />
                                </svg>
                                <span>{isFavorite ? "Saved in Favorites" : "Add to Favorites"}</span>
                            </button>
                        </div>

                        {/* Quick Facts Breakdown */}
                        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3 text-xs">
                            <h4 className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[11px]">
                                Quick Details
                            </h4>

                            <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                                <span className="text-zinc-500">Cuisine</span>
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                    {restaurant.cuisine || "Indian"}
                                </span>
                            </div>

                            <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                                <span className="text-zinc-500">City</span>
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                    {restaurant.city}
                                </span>
                            </div>

                            <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                                <span className="text-zinc-500">Estimated Cost</span>
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                    ₹₹ • Moderate Dining
                                </span>
                            </div>

                            <div className="flex items-center justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                                <span className="text-zinc-500">Rating</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                    {restaurant.rating !== null && restaurant.rating !== undefined ? `★ ${Number(restaurant.rating).toFixed(1)} / 5` : "New Listing"}
                                </span>
                            </div>

                            <div className="flex items-center justify-between py-1">
                                <span className="text-zinc-500">Verification</span>
                                <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                    <span>✨</span>
                                    <span>Verified</span>
                                </span>
                            </div>
                        </div>

                        {/* Trust Assurance Card */}
                        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 space-y-1.5">
                            <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                                <span>🛡️</span>
                                <span>DineAura Promise</span>
                            </span>
                            <p className="text-[11px] text-amber-800/80 dark:text-amber-400/80 leading-relaxed">
                                Restaurant details and table requests are processed directly through the DineAura reservation system.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Real Supabase Table Reservation Modal */}
            {isModalOpen && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="reservation-title"
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto animate-fade-in"
                >
                    <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-2xl space-y-6 my-auto max-h-[90vh] overflow-y-auto">
                        {/* Close Button */}
                        <button
                            type="button"
                            onClick={resetModal}
                            aria-label="Close modal"
                            className="absolute top-5 right-5 p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Unauthenticated State */}
                        {!user ? (
                            <div className="text-center py-6 space-y-5">
                                <div className="w-16 h-16 rounded-3xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-3xl mx-auto shadow-inner">
                                    🔐
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                                        Sign In Required
                                    </h3>
                                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                                        You must be signed in with your DineAura account to request a table at <strong>{restaurant.name}</strong>.
                                    </p>
                                </div>

                                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                                    <button
                                        type="button"
                                        onClick={resetModal}
                                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <Link
                                        href="/login"
                                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <span>Sign In to Continue</span>
                                        <span>&rarr;</span>
                                    </Link>
                                </div>
                            </div>
                        ) : isAdmin ? (
                            /* Admin Notice (Defense-in-depth if modal triggered) */
                            <div className="text-center py-6 space-y-4">
                                <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl mx-auto shadow-inner">
                                    🛡️
                                </div>
                                <div className="space-y-1.5">
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                                        Administrator Account
                                    </h3>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                                        Administrators cannot submit table reservation requests. You can oversee and manage all incoming reservations from the admin panel.
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                                    <button
                                        type="button"
                                        onClick={resetModal}
                                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                    >
                                        Close
                                    </button>
                                    <Link
                                        href="/admin/reservations"
                                        className="w-full sm:w-auto px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <span>Manage Reservations</span>
                                        <span>&rarr;</span>
                                    </Link>
                                </div>
                            </div>
                        ) : submittedReservation ? (
                            /* Success Confirmation State */
                            <div className="text-center py-4 space-y-5">
                                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl mx-auto shadow-inner">
                                    ✓
                                </div>

                                <div className="space-y-1.5">
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                        Request Registered
                                    </span>
                                    <h3 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
                                        Table Request Submitted!
                                    </h3>
                                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                                        Table request submitted successfully. The restaurant will review your request and confirm availability.
                                    </p>
                                </div>

                                {/* Reference Card */}
                                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 text-left space-y-2 text-xs">
                                    <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-700">
                                        <span className="text-zinc-500 uppercase tracking-wide text-[10px] font-bold">
                                            Reference ID
                                        </span>
                                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-xs">
                                            {submittedReservation.id.slice(0, 8)}...
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div>
                                            <span className="text-zinc-400 block text-[10px]">Restaurant</span>
                                            <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate block">
                                                {restaurant.name}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-zinc-400 block text-[10px]">Date &amp; Time</span>
                                            <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">
                                                {submittedReservation.date} at {submittedReservation.time}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-zinc-400 block text-[10px]">Party Size</span>
                                            <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">
                                                {submittedReservation.guests} Guests
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-zinc-400 block text-[10px]">Contact</span>
                                            <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate block">
                                                {submittedReservation.phone}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-left text-[11px] text-amber-900 dark:text-amber-300">
                                    <p className="font-semibold">Notice regarding your booking:</p>
                                    <p className="mt-0.5 text-amber-800/90 dark:text-amber-300/90">
                                        This is a table request and not an instant confirmation. Track its live approval status in your dashboard.
                                    </p>
                                </div>

                                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                                    <button
                                        type="button"
                                        onClick={resetModal}
                                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
                                    >
                                        Close
                                    </button>
                                    <Link
                                        href="/reservations"
                                        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                                    >
                                        <span>View My Reservations</span>
                                        <span>&rarr;</span>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            /* Reservation Request Form */
                            <form onSubmit={handleReservationSubmit} className="space-y-4">
                                <div>
                                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                                        Dining Reservation
                                    </span>
                                    <h3 id="reservation-title" className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                                        Request a Table
                                    </h3>
                                    <p className="text-xs text-zinc-500 mt-1">
                                        Select your date, party size, and seating preference.
                                    </p>
                                </div>

                                {formError && (
                                    <div
                                        role="alert"
                                        className="p-3.5 rounded-xl text-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 flex items-start gap-2"
                                    >
                                        <span className="text-base flex-shrink-0">⚠️</span>
                                        <span>{formError}</span>
                                    </div>
                                )}

                                <div className="space-y-3.5">
                                    {/* Read-Only Restaurant Name */}
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                                            Restaurant (Read-Only)
                                        </label>
                                        <div className="px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center justify-between">
                                            <span className="truncate">{restaurant.name}</span>
                                            <span className="text-[11px] font-normal text-zinc-500 ml-2">
                                                {restaurant.city}, {restaurant.state}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Name & Phone */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                                                Customer Name *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={customerName}
                                                onChange={(e) => setCustomerName(e.target.value)}
                                                placeholder="e.g. Aarav Sharma"
                                                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                                                Customer Phone *
                                            </label>
                                            <input
                                                type="tel"
                                                required
                                                value={customerPhone}
                                                onChange={(e) => setCustomerPhone(e.target.value)}
                                                placeholder="+91 98765 43210"
                                                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Date & Time */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                                                Reservation Date *
                                            </label>
                                            <input
                                                type="date"
                                                required
                                                min={todayDateString}
                                                value={reservationDate}
                                                onChange={(e) => setReservationDate(e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                                                Reservation Time *
                                            </label>
                                            <select
                                                required
                                                value={reservationTime}
                                                onChange={(e) => setReservationTime(e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                                            >
                                                {TIME_SLOTS.map((slot) => (
                                                    <option key={slot.value} value={slot.value}>
                                                        {slot.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Party Size & Seating Preference */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                                                Number of Guests *
                                            </label>
                                            <select
                                                required
                                                value={partySize}
                                                onChange={(e) => setPartySize(e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                                            >
                                                <option value="1">1 Guest (Solo Dining)</option>
                                                <option value="2">2 Guests (Couple / Pair)</option>
                                                <option value="3">3 Guests</option>
                                                <option value="4">4 Guests (Family Table)</option>
                                                <option value="5">5 Guests</option>
                                                <option value="6">6 Guests (Small Gathering)</option>
                                                <option value="7">7 Guests</option>
                                                <option value="8">8 Guests (Large Gathering)</option>
                                                <option value="10">10 Guests</option>
                                                <option value="12">12+ Guests (Party)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                                                Seating Preference
                                            </label>
                                            <select
                                                value={seatingPreference}
                                                onChange={(e) => setSeatingPreference(e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                                            >
                                                {SEATING_PREFERENCES.map((pref) => (
                                                    <option key={pref} value={pref}>
                                                        {pref}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Special Requests */}
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                                            Special Requests (Optional)
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={specialRequest}
                                            onChange={(e) => setSpecialRequest(e.target.value)}
                                            placeholder="e.g. High chair needed, anniversary celebration, window seating preference..."
                                            className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                                        />
                                    </div>
                                </div>

                                {/* Table Request Transparency Notice */}
                                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-2">
                                    <span className="text-sm mt-0.5">ℹ️</span>
                                    <span>
                                        This is a table reservation request. The restaurant manager will review your party size and confirm availability prior to your visit.
                                    </span>
                                </div>

                                <div className="pt-2 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={resetModal}
                                        disabled={isSubmitting}
                                        className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                <span>Submitting Request...</span>
                                            </>
                                        ) : (
                                            <span>Request a Table</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

