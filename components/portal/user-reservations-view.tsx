"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { RestaurantImage } from "./restaurant-image";
import type { Reservation, ReservationStatus } from "@/lib/types/portal";
import { cancelReservationAction } from "@/app/reservations/actions";

interface UserReservationsViewProps {
    initialReservations: Reservation[];
}

export function UserReservationsView({ initialReservations }: UserReservationsViewProps) {
    const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    const [detailReservation, setDetailReservation] = useState<Reservation | null>(null);
    const [cancellingReservation, setCancellingReservation] = useState<Reservation | null>(null);
    const [isPending, startTransition] = useTransition();
    const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const showToast = (type: "success" | "error", text: string) => {
        setToastMessage({ type, text });
        setTimeout(() => setToastMessage(null), 5000);
    };

    // Filter by status tab
    const filteredReservations = reservations.filter((r) => {
        if (selectedStatus === "all") return true;
        return r.status === selectedStatus;
    });

    const statusCounts = {
        all: reservations.length,
        pending: reservations.filter((r) => r.status === "pending").length,
        confirmed: reservations.filter((r) => r.status === "confirmed").length,
        declined: reservations.filter((r) => r.status === "declined").length,
        cancelled: reservations.filter((r) => r.status === "cancelled").length,
        completed: reservations.filter((r) => r.status === "completed").length,
    };

    const handleConfirmCancel = () => {
        if (!cancellingReservation) return;
        const targetId = cancellingReservation.id;

        startTransition(async () => {
            const res = await cancelReservationAction(targetId);
            if (res.success) {
                setReservations((prev) =>
                    prev.map((r) => (r.id === targetId ? { ...r, status: "cancelled" as ReservationStatus } : r))
                );
                if (detailReservation?.id === targetId) {
                    setDetailReservation((prev) => (prev ? { ...prev, status: "cancelled" } : null));
                }
                showToast("success", res.message || "Reservation request cancelled.");
                setCancellingReservation(null);
            } else {
                showToast("error", res.error || "Failed to cancel reservation.");
            }
        });
    };

    const getStatusBadge = (status: ReservationStatus) => {
        switch (status) {
            case "pending":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Pending Review
                    </span>
                );
            case "confirmed":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Confirmed
                    </span>
                );
            case "declined":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Declined
                    </span>
                );
            case "cancelled":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                        Cancelled
                    </span>
                );
            case "completed":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        Completed
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Toast notification */}
            {toastMessage && (
                <div
                    role="alert"
                    aria-live="polite"
                    className={`fixed top-20 right-4 sm:right-6 z-50 max-w-md p-4 rounded-xl shadow-lg border flex items-start gap-3 backdrop-blur-md transition-all ${
                        toastMessage.type === "success"
                            ? "bg-emerald-50 dark:bg-emerald-950/90 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100"
                            : "bg-rose-50 dark:bg-rose-950/90 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-100"
                    }`}
                >
                    <span className="text-lg">
                        {toastMessage.type === "success" ? "✅" : "⚠️"}
                    </span>
                    <div className="flex-1 text-xs sm:text-sm font-medium">
                        {toastMessage.text}
                    </div>
                    <button
                        type="button"
                        onClick={() => setToastMessage(null)}
                        className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Header banner */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
                        <span>🗓️</span> My Reservations
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Track table requests and status updates for your dining reservations.
                    </p>
                </div>

                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white shadow-xs hover:shadow-md transition-all active:scale-95 self-start sm:self-auto cursor-pointer"
                >
                    <span>🔍</span> Explore Restaurants
                </Link>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {(
                    [
                        { id: "all", label: "All Requests", count: statusCounts.all },
                        { id: "pending", label: "Pending", count: statusCounts.pending },
                        { id: "confirmed", label: "Confirmed", count: statusCounts.confirmed },
                        { id: "declined", label: "Declined", count: statusCounts.declined },
                        { id: "cancelled", label: "Cancelled", count: statusCounts.cancelled },
                        { id: "completed", label: "Completed", count: statusCounts.completed },
                    ] as const
                ).map((tab) => {
                    const isActive = selectedStatus === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setSelectedStatus(tab.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                                isActive
                                    ? "bg-amber-600 text-white shadow-xs font-bold"
                                    : "bg-white dark:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xs"
                            }`}
                        >
                            <span>{tab.label}</span>
                            <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                    isActive
                                        ? "bg-amber-700 text-amber-100 font-bold"
                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                                }`}
                            >
                                {tab.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Reservations List / Empty State */}
            {filteredReservations.length === 0 ? (
                <div className="text-center py-16 px-4 bg-white dark:bg-zinc-900/70 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-3xl shadow-2xs">
                        🍽️
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            {selectedStatus === "all"
                                ? "No Reservation Requests Yet"
                                : `No ${selectedStatus} reservations found`}
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                            {selectedStatus === "all"
                                ? "You haven't requested any tables yet. Discover top Indian dining spots and reserve your table in advance."
                                : `You do not have any requests marked as "${selectedStatus}".`}
                        </p>
                    </div>
                    <div className="pt-2">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
                        >
                            <span>Explore Restaurants</span>
                            <span>&rarr;</span>
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredReservations.map((r) => {
                        const restaurantName = r.restaurant?.name || "Restaurant";
                        const city = r.restaurant?.city;
                        const cuisine = r.restaurant?.cuisine;
                        const imageUrl = r.restaurant?.image_url;

                        return (
                            <div
                                key={r.id}
                                className="bg-white dark:bg-zinc-900/80 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-xl hover:shadow-amber-500/5 hover:border-amber-500/40 dark:hover:border-amber-500/30 transition-all duration-300"
                            >
                                <div className="p-4 sm:p-5 space-y-3.5">
                                    {/* Card Header: Restaurant & Status */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 relative shrink-0 border border-zinc-200 dark:border-zinc-700/60">
                                                <RestaurantImage
                                                    src={imageUrl}
                                                    alt={restaurantName}
                                                    fill
                                                    className="object-cover"
                                                    sizes="48px"
                                                    fallbackCuisine={cuisine}
                                                    compactFallback
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                                    {restaurantName}
                                                </h3>
                                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                                                    {cuisine} {city ? `• ${city}` : ""}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="shrink-0">{getStatusBadge(r.status)}</div>
                                    </div>

                                    {/* Reservation Details Pill Grid */}
                                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                                        <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
                                            <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 block">
                                                Date
                                            </span>
                                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                                {r.reservation_date}
                                            </span>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
                                            <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 block">
                                                Time
                                            </span>
                                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                                {r.reservation_time.slice(0, 5)}
                                            </span>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
                                            <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 block">
                                                Guests
                                            </span>
                                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                                👥 {r.party_size} {r.party_size === 1 ? "Person" : "People"}
                                            </span>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
                                            <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 block">
                                                Seating
                                            </span>
                                            <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate block">
                                                🪑 {r.seating_preference || "No Pref"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Submitted timestamp */}
                                    <div className="text-[11px] text-zinc-400 dark:text-zinc-500 pt-0.5">
                                        Submitted on: {new Date(r.created_at).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </div>
                                </div>

                                {/* Card Actions */}
                                <div className="px-4 sm:px-5 py-3 bg-zinc-50/70 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setDetailReservation(r)}
                                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-700/60 transition-colors"
                                    >
                                        View Details
                                    </button>

                                    {r.status === "pending" && (
                                        <button
                                            type="button"
                                            onClick={() => setCancellingReservation(r)}
                                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                        >
                                            Cancel Request
                                        </button>
                                    )}

                                    {r.status === "confirmed" && (
                                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                            Ready for Dining
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Details Modal */}
            {detailReservation && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="reservation-detail-title"
                >
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-8">
                        <div className="p-5 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                            <div>
                                <h2
                                    id="reservation-detail-title"
                                    className="text-lg font-bold text-zinc-900 dark:text-zinc-100"
                                >
                                    Reservation Request Details
                                </h2>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                                    Ref ID: {detailReservation.id}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setDetailReservation(null)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                            {/* Status Banner */}
                            <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Status</span>
                                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 capitalize">
                                        {detailReservation.status}
                                    </span>
                                </div>
                                <div>{getStatusBadge(detailReservation.status)}</div>
                            </div>

                            {/* Restaurant Info */}
                            <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 space-y-1">
                                <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">
                                    Restaurant
                                </span>
                                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100">
                                    {detailReservation.restaurant?.name || "Restaurant"}
                                </h3>
                                {detailReservation.restaurant?.address && (
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                        📍 {detailReservation.restaurant.address}, {detailReservation.restaurant.city}
                                    </p>
                                )}
                                {detailReservation.restaurant?.phone && (
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                                        📞 {detailReservation.restaurant.phone}
                                    </p>
                                )}
                            </div>

                            {/* Booking Specifications */}
                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Date</span>
                                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                        {detailReservation.reservation_date}
                                    </span>
                                </div>
                                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Time</span>
                                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                        {detailReservation.reservation_time.slice(0, 5)}
                                    </span>
                                </div>
                                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Party Size</span>
                                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                        👥 {detailReservation.party_size} {detailReservation.party_size === 1 ? "Guest" : "Guests"}
                                    </span>
                                </div>
                                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Seating Area</span>
                                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                        🪑 {detailReservation.seating_preference || "No Preference"}
                                    </span>
                                </div>
                            </div>

                            {/* Contact Details */}
                            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 space-y-1.5 text-xs">
                                <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                                    Customer Contact Details
                                </span>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Name:</span>
                                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                        {detailReservation.customer_name}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Phone:</span>
                                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 font-mono">
                                        {detailReservation.customer_phone}
                                    </span>
                                </div>
                            </div>

                            {/* Special Requests */}
                            {detailReservation.special_request && (
                                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                                        Special Requests / Dietary Notes
                                    </span>
                                    <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                                        {detailReservation.special_request}
                                    </p>
                                </div>
                            )}

                            {/* Notice */}
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/40 p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
                                ℹ️ <span className="font-semibold">Note:</span> Table requests are reviewed by restaurant staff based on floor capacity and operational hours. You will receive real-time status updates here.
                            </div>
                        </div>

                        <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                            {detailReservation.status === "pending" ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCancellingReservation(detailReservation);
                                        setDetailReservation(null);
                                    }}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                >
                                    Cancel Request
                                </button>
                            ) : (
                                <span />
                            )}

                            <button
                                type="button"
                                onClick={() => setDetailReservation(null)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Confirmation Dialog */}
            {cancellingReservation && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby="cancel-dialog-title"
                >
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
                        <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center text-2xl mx-auto">
                            ⚠️
                        </div>
                        <div className="text-center space-y-1.5">
                            <h2
                                id="cancel-dialog-title"
                                className="text-base font-bold text-zinc-900 dark:text-zinc-100"
                            >
                                Cancel Table Reservation Request?
                            </h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                Are you sure you want to cancel your table request at{" "}
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                    {cancellingReservation.restaurant?.name || "this restaurant"}
                                </span>{" "}
                                for {cancellingReservation.reservation_date} at {cancellingReservation.reservation_time.slice(0, 5)}?
                                This action cannot be undone.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={() => setCancellingReservation(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                            >
                                Keep Request
                            </button>
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={handleConfirmCancel}
                                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                                {isPending ? (
                                    <>
                                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Cancelling...</span>
                                    </>
                                ) : (
                                    <span>Yes, Cancel Request</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
