"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface ReservationActionResult {
    error?: string;
    success?: boolean;
    message?: string;
    reservationId?: string;
}

// Indian & international phone validation regex
function isValidPhone(phone: string): boolean {
    const cleaned = phone.replace(/[\s\-().+]/g, "");
    // Check 10-15 digits
    return /^\d{10,15}$/.test(cleaned);
}

export async function createReservationAction(
    formData: FormData
): Promise<ReservationActionResult> {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return {
                error: "Please sign in to submit a table reservation request.",
            };
        }

        // Server-side authorization: Reject administrator accounts from creating table reservations
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

        if (profile?.role === "admin" || user.user_metadata?.role === "admin") {
            return {
                error: "Administrators cannot submit table reservation requests.",
            };
        }

        const restaurantId = formData.get("restaurant_id")?.toString().trim();
        const customerName = formData.get("customer_name")?.toString().trim();
        const customerPhone = formData.get("customer_phone")?.toString().trim();
        const reservationDate = formData.get("reservation_date")?.toString().trim();
        const reservationTime = formData.get("reservation_time")?.toString().trim();
        const partySizeRaw = formData.get("party_size")?.toString().trim();
        const seatingPreference = formData.get("seating_preference")?.toString().trim() || "No Preference";
        const specialRequest = formData.get("special_request")?.toString().trim() || null;

        // Validations
        if (!restaurantId) {
            return { error: "Restaurant identification is missing." };
        }

        if (!customerName || customerName.length === 0) {
            return { error: "Please enter your name." };
        }

        if (!customerPhone || !isValidPhone(customerPhone)) {
            return {
                error: "Please enter a valid phone number (e.g. +91 98765 43210 or 9876543210).",
            };
        }

        if (!reservationDate) {
            return { error: "Please select a preferred reservation date." };
        }

        // Validate date is not in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(reservationDate);
        if (isNaN(selectedDate.getTime()) || selectedDate < today) {
            return { error: "Reservation date cannot be in the past." };
        }

        if (!reservationTime) {
            return { error: "Please choose a preferred time slot." };
        }

        const partySize = parseInt(partySizeRaw || "1", 10);
        if (isNaN(partySize) || partySize < 1) {
            return { error: "Number of guests must be at least 1." };
        }

        if (partySize > 50) {
            return { error: "For parties larger than 50 guests, please contact the restaurant directly." };
        }

        const { data: newReservation, error: insertError } = await supabase
            .from("reservations")
            .insert({
                restaurant_id: restaurantId,
                user_id: user.id,
                customer_name: customerName,
                customer_phone: customerPhone,
                reservation_date: reservationDate,
                reservation_time: reservationTime,
                party_size: partySize,
                seating_preference: seatingPreference,
                special_request: specialRequest,
                status: "pending",
            })
            .select("id")
            .single();

        if (insertError) {
            if (insertError.code === "PGRST205" || insertError.message.includes("schema cache")) {
                return {
                    error: "The reservations table has not been initialized in Supabase yet. Please execute the SQL migration script (supabase/reservations.sql) in your Supabase SQL editor.",
                };
            }
            return { error: insertError.message || "Failed to submit reservation request." };
        }

        // Structured Audit Logging
        console.log("[AUDIT] reservation_created", {
            reservationId: newReservation?.id,
            restaurantId,
            userId: user.id,
            customerName,
            partySize,
            reservationDate,
            reservationTime,
            timestamp: new Date().toISOString(),
        });

        revalidatePath("/reservations");
        revalidatePath("/admin/reservations");
        revalidatePath(`/restaurants/${restaurantId}`);

        return {
            success: true,
            message:
                "Table request submitted successfully. The restaurant will review your request and confirm availability.",
            reservationId: newReservation?.id,
        };
    } catch (err: unknown) {
        return {
            error: err instanceof Error ? err.message : "An unexpected error occurred while requesting a table.",
        };
    }
}

export async function cancelReservationAction(
    reservationId: string
): Promise<ReservationActionResult> {
    try {
        const supabase = await createClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return { error: "Authentication required to cancel a reservation." };
        }

        if (!reservationId) {
            return { error: "Reservation ID is required." };
        }

        // Verify the reservation is currently pending and belongs to the user
        const { data: existing, error: fetchError } = await supabase
            .from("reservations")
            .select("id, status, user_id")
            .eq("id", reservationId)
            .maybeSingle();

        if (fetchError || !existing) {
            return { error: "Reservation request not found." };
        }

        if (existing.user_id !== user.id) {
            return { error: "You can only cancel your own reservation requests." };
        }

        if (existing.status !== "pending") {
            return {
                error: `This reservation is already ${existing.status} and cannot be cancelled automatically. Please contact the venue directly.`,
            };
        }

        // Update status to 'cancelled' (Never delete record)
        const { error: updateError } = await supabase
            .from("reservations")
            .update({ status: "cancelled" })
            .eq("id", reservationId)
            .eq("user_id", user.id);

        if (updateError) {
            return { error: updateError.message || "Failed to cancel reservation." };
        }

        // Structured Audit Logging
        console.log("[AUDIT] reservation_cancelled", {
            reservationId,
            userId: user.id,
            timestamp: new Date().toISOString(),
        });

        revalidatePath("/reservations");
        revalidatePath("/admin/reservations");

        return {
            success: true,
            message: "Your table reservation request has been cancelled.",
        };
    } catch (err: unknown) {
        return {
            error: err instanceof Error ? err.message : "Failed to cancel reservation.",
        };
    }
}
