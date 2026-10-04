"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { ReservationStatus } from "@/lib/types/portal";

export interface AdminReservationActionResult {
    error?: string;
    success?: boolean;
    message?: string;
}

// Verify current session has admin role
async function verifyAdmin() {
    const supabase = await createClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("Unauthorized: Administrator sign-in required.");
    }

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError || profile?.role !== "admin") {
        throw new Error("Forbidden: Administrator privileges required.");
    }

    return { supabase, user };
}

export async function updateReservationStatusAction(
    reservationId: string,
    newStatus: ReservationStatus
): Promise<AdminReservationActionResult> {
    try {
        const { supabase, user } = await verifyAdmin();

        if (!reservationId) {
            return { error: "Reservation ID is required." };
        }

        const validStatuses: ReservationStatus[] = [
            "pending",
            "confirmed",
            "declined",
            "cancelled",
            "completed",
        ];

        if (!validStatuses.includes(newStatus)) {
            return { error: `Invalid reservation status: "${newStatus}".` };
        }

        const { error: updateError } = await supabase
            .from("reservations")
            .update({ status: newStatus })
            .eq("id", reservationId);

        if (updateError) {
            return { error: updateError.message || "Failed to update reservation status." };
        }

        // Structured Audit Logging
        console.log(`[AUDIT] reservation_${newStatus}`, {
            reservationId,
            adminUserId: user.id,
            status: newStatus,
            timestamp: new Date().toISOString(),
        });

        revalidatePath("/admin/reservations");
        revalidatePath("/reservations");

        const statusLabels: Record<ReservationStatus, string> = {
            pending: "Pending",
            confirmed: "Confirmed",
            declined: "Declined",
            cancelled: "Cancelled",
            completed: "Completed",
        };

        return {
            success: true,
            message: `Reservation status updated to "${statusLabels[newStatus]}".`,
        };
    } catch (err: unknown) {
        return {
            error: err instanceof Error ? err.message : "Failed to update reservation.",
        };
    }
}
