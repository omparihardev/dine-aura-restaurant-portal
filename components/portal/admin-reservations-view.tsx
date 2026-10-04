"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Reservation, ReservationStatus } from "@/lib/types/portal";
import { updateReservationStatusAction } from "@/app/admin/reservations/actions";

interface AdminReservationsViewProps {
    initialReservations: Reservation[];
}

export function AdminReservationsView({ initialReservations }: AdminReservationsViewProps) {
    const [reservations, setReservations] = useState<Reservation[]>(initialReservations);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [detailReservation, setDetailReservation] = useState<Reservation | null>(null);

    // Confirmation action state: holds target reservation and action to execute
    const [actionTarget, setActionTarget] = useState<{
        reservation: Reservation;
        newStatus: ReservationStatus;
        actionLabel: string;
        actionColor: "emerald" | "rose" | "zinc";
        warningText: string;
    } | null>(null);

    const [isPending, startTransition] = useTransition();
    const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const showToast = (type: "success" | "error", text: string) => {
        setToastMessage({ type, text });
        setTimeout(() => setToastMessage(null), 5000);
    };

    // Filter by search query (name, phone, restaurant) and status
    const filteredReservations = reservations.filter((r) => {
        // Status filter
        if (statusFilter !== "all" && r.status !== statusFilter) {
            return false;
        }

        // Search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            const customerMatch = r.customer_name?.toLowerCase().includes(query);
            const phoneMatch = r.customer_phone?.toLowerCase().includes(query);
            const restMatch = r.restaurant?.name?.toLowerCase().includes(query);
            if (!customerMatch && !phoneMatch && !restMatch) {
                return false;
            }
        }

        return true;
    });

    const statusCounts = {
        all: reservations.length,
        pending: reservations.filter((r) => r.status === "pending").length,
        confirmed: reservations.filter((r) => r.status === "confirmed").length,
        declined: reservations.filter((r) => r.status === "declined").length,
        cancelled: reservations.filter((r) => r.status === "cancelled").length,
        completed: reservations.filter((r) => r.status === "completed").length,
    };

    const handleExecuteAction = () => {
        if (!actionTarget) return;
        const { reservation, newStatus } = actionTarget;

        startTransition(async () => {
            const res = await updateReservationStatusAction(reservation.id, newStatus);
            if (res.success) {
                setReservations((prev) =>
                    prev.map((r) => (r.id === reservation.id ? { ...r, status: newStatus } : r))
                );
                if (detailReservation?.id === reservation.id) {
                    setDetailReservation((prev) => (prev ? { ...prev, status: newStatus } : null));
                }
                showToast("success", res.message || `Reservation marked as ${newStatus}.`);
                setActionTarget(null);
            } else {
                showToast("error", res.error || "Failed to update reservation status.");
            }
        });
    };

    const getStatusBadge = (status: ReservationStatus) => {
        switch (status) {
            case "pending":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Pending
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                            Admin Workspace
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
                        <span>📋</span> Reservation Requests Management
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        Review, confirm, decline, and monitor all table reservations across restaurants.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="/admin/restaurants"
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors"
                    >
                        Manage Restaurants
                    </Link>
                </div>
            </div>

            {/* Stat Highlights Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
                        Total Requests
                    </span>
                    <span className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100">
                        {statusCounts.all}
                    </span>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                        Pending Review
                    </span>
                    <span className="text-2xl font-extrabold text-amber-800 dark:text-amber-300">
                        {statusCounts.pending}
                    </span>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                        Confirmed
                    </span>
                    <span className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-300">
                        {statusCounts.confirmed}
                    </span>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 shadow-sm">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 block">
                        Declined / Cancelled
                    </span>
                    <span className="text-2xl font-extrabold text-zinc-700 dark:text-zinc-300">
                        {statusCounts.declined + statusCounts.cancelled}
                    </span>
                </div>
            </div>

            {/* Controls: Search + Filter Tabs */}
            <div className="space-y-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                {/* Search Bar */}
                <div className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by customer name, phone, or restaurant..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    />
                    <span className="absolute left-3.5 top-3 text-zinc-400 text-sm">
                        🔍
                    </span>
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="absolute right-3.5 top-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Status Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {(
                        [
                            { id: "all", label: "All", count: statusCounts.all },
                            { id: "pending", label: "Pending", count: statusCounts.pending },
                            { id: "confirmed", label: "Confirmed", count: statusCounts.confirmed },
                            { id: "declined", label: "Declined", count: statusCounts.declined },
                            { id: "cancelled", label: "Cancelled", count: statusCounts.cancelled },
                            { id: "completed", label: "Completed", count: statusCounts.completed },
                        ] as const
                    ).map((tab) => {
                        const isActive = statusFilter === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setStatusFilter(tab.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                                    isActive
                                        ? "bg-amber-600 text-white shadow-sm"
                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                                }`}
                            >
                                <span>{tab.label}</span>
                                <span
                                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                        isActive
                                            ? "bg-amber-700 text-amber-100"
                                            : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                                    }`}
                                >
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Reservations Table / Cards */}
            {filteredReservations.length === 0 ? (
                <div className="text-center py-16 px-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
                    <span className="text-3xl">📋</span>
                    <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                        No Reservations Found
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                        No reservation records match your filter criteria or search query.
                    </p>
                    {(searchQuery || statusFilter !== "all") && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchQuery("");
                                setStatusFilter("all");
                            }}
                            className="px-4 py-2 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 transition-colors"
                        >
                            Reset Filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                    {/* Desktop / Tablet Table View */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/75 dark:bg-zinc-800/50 text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                    <th className="py-3 px-4">Customer</th>
                                    <th className="py-3 px-4">Restaurant</th>
                                    <th className="py-3 px-4">Date & Time</th>
                                    <th className="py-3 px-4">Guests & Seating</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Submitted</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {filteredReservations.map((r) => {
                                    return (
                                        <tr
                                            key={r.id}
                                            className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                                        >
                                            {/* Customer */}
                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-zinc-900 dark:text-zinc-100">
                                                    {r.customer_name}
                                                </div>
                                                <div className="text-[11px] text-zinc-500 font-mono">
                                                    {r.customer_phone}
                                                </div>
                                            </td>

                                            {/* Restaurant */}
                                            <td className="py-3.5 px-4">
                                                <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[180px]">
                                                    {r.restaurant?.name || "Restaurant"}
                                                </div>
                                                <div className="text-[11px] text-zinc-500 truncate max-w-[180px]">
                                                    {r.restaurant?.city || "India"}
                                                </div>
                                            </td>

                                            {/* Date & Time */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                                                    {r.reservation_date}
                                                </div>
                                                <div className="text-[11px] text-zinc-500">
                                                    {r.reservation_time.slice(0, 5)}
                                                </div>
                                            </td>

                                            {/* Guests & Seating */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <div className="font-medium text-zinc-800 dark:text-zinc-200">
                                                    👥 {r.party_size} {r.party_size === 1 ? "Guest" : "Guests"}
                                                </div>
                                                <div className="text-[11px] text-zinc-500">
                                                    🪑 {r.seating_preference || "No preference"}
                                                </div>
                                            </td>

                                            {/* Status Badge */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                {getStatusBadge(r.status)}
                                            </td>

                                            {/* Created date */}
                                            <td className="py-3.5 px-4 whitespace-nowrap text-zinc-500 text-[11px]">
                                                {new Date(r.created_at).toLocaleDateString("en-IN", {
                                                    day: "numeric",
                                                    month: "short",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setDetailReservation(r)}
                                                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                                    >
                                                        Details
                                                    </button>

                                                    {/* Pending Actions: Confirm or Decline */}
                                                    {r.status === "pending" && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setActionTarget({
                                                                        reservation: r,
                                                                        newStatus: "confirmed",
                                                                        actionLabel: "Confirm Reservation",
                                                                        actionColor: "emerald",
                                                                        warningText: `Confirm table request for ${r.customer_name} (${r.party_size} guests) at ${r.restaurant?.name || "Restaurant"} on ${r.reservation_date} at ${r.reservation_time.slice(0, 5)}?`,
                                                                    })
                                                                }
                                                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 transition-colors"
                                                            >
                                                                Confirm
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setActionTarget({
                                                                        reservation: r,
                                                                        newStatus: "declined",
                                                                        actionLabel: "Decline Reservation",
                                                                        actionColor: "rose",
                                                                        warningText: `Decline table request for ${r.customer_name} at ${r.restaurant?.name || "Restaurant"}? The customer will see that this request was declined.`,
                                                                    })
                                                                }
                                                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 transition-colors"
                                                            >
                                                                Decline
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* Confirmed Actions: Cancel */}
                                                    {r.status === "confirmed" && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setActionTarget({
                                                                    reservation: r,
                                                                    newStatus: "cancelled",
                                                                    actionLabel: "Cancel Reservation",
                                                                    actionColor: "zinc",
                                                                    warningText: `Cancel this confirmed reservation for ${r.customer_name}?`,
                                                                })
                                                            }
                                                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Admin View Details Modal */}
            {detailReservation && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="admin-reservation-detail-title"
                >
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-8">
                        <div className="p-5 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                            <div>
                                <h2
                                    id="admin-reservation-detail-title"
                                    className="text-lg font-bold text-zinc-900 dark:text-zinc-100"
                                >
                                    Reservation Request Inspection
                                </h2>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
                                    ID: {detailReservation.id}
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
                            {/* Current Status */}
                            <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Status</span>
                                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 capitalize">
                                        {detailReservation.status}
                                    </span>
                                </div>
                                <div>{getStatusBadge(detailReservation.status)}</div>
                            </div>

                            {/* Customer Profile & Restaurant */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Customer</span>
                                    <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                                        {detailReservation.customer_name}
                                    </div>
                                    <div className="text-zinc-600 dark:text-zinc-400 font-mono">
                                        📞 {detailReservation.customer_phone}
                                    </div>
                                    <div className="text-[10px] text-zinc-400 font-mono truncate">
                                        UID: {detailReservation.user_id}
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Restaurant</span>
                                    <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                                        {detailReservation.restaurant?.name || "Restaurant"}
                                    </div>
                                    <div className="text-zinc-600 dark:text-zinc-400">
                                        📍 {detailReservation.restaurant?.city || "India"}
                                    </div>
                                    <div className="text-[10px] text-zinc-400 font-mono truncate">
                                        RID: {detailReservation.restaurant_id}
                                    </div>
                                </div>
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
                                        👥 {detailReservation.party_size} Guests
                                    </span>
                                </div>
                                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">Seating Area</span>
                                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                                        🪑 {detailReservation.seating_preference || "No Preference"}
                                    </span>
                                </div>
                            </div>

                            {/* Special Requests */}
                            {detailReservation.special_request ? (
                                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-zinc-400 block">
                                        Special Requests / Dietary Notes
                                    </span>
                                    <p className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                                        {detailReservation.special_request}
                                    </p>
                                </div>
                            ) : (
                                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 text-[11px] text-zinc-400">
                                    No special requests provided by customer.
                                </div>
                            )}

                            {/* Audit timestamps */}
                            <div className="text-[11px] text-zinc-400 dark:text-zinc-500 space-y-0.5 pt-1">
                                <div>Created: {new Date(detailReservation.created_at).toLocaleString("en-IN")}</div>
                                <div>Last Updated: {new Date(detailReservation.updated_at).toLocaleString("en-IN")}</div>
                            </div>
                        </div>

                        <div className="p-4 sm:p-5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
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

            {/* Admin Action Confirmation Dialog */}
            {actionTarget && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby="admin-confirm-action-title"
                >
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4">
                        <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mx-auto ${
                                actionTarget.actionColor === "emerald"
                                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600"
                                    : actionTarget.actionColor === "rose"
                                    ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600"
                            }`}
                        >
                            {actionTarget.actionColor === "emerald" ? "✅" : actionTarget.actionColor === "rose" ? "⚠️" : "ℹ️"}
                        </div>
                        <div className="text-center space-y-1.5">
                            <h2
                                id="admin-confirm-action-title"
                                className="text-base font-bold text-zinc-900 dark:text-zinc-100"
                            >
                                {actionTarget.actionLabel}?
                            </h2>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                {actionTarget.warningText}
                            </p>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={() => setActionTarget(null)}
                                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                            >
                                Dismiss
                            </button>
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={handleExecuteAction}
                                className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-white shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                                    actionTarget.actionColor === "emerald"
                                        ? "bg-emerald-600 hover:bg-emerald-700"
                                        : actionTarget.actionColor === "rose"
                                        ? "bg-rose-600 hover:bg-rose-700"
                                        : "bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-700"
                                }`}
                            >
                                {isPending ? (
                                    <>
                                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Updating...</span>
                                    </>
                                ) : (
                                    <span>Confirm {actionTarget.actionLabel}</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
