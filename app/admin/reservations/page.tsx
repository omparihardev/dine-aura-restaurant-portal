import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/portal/portal-shell";
import { AdminReservationsView } from "@/components/portal/admin-reservations-view";
import type { Metadata } from "next";
import type { UserProfile, Reservation } from "@/lib/types/portal";

export const metadata: Metadata = {
    title: "Admin: Table Reservation Management | DineAura",
    description: "Review and manage restaurant table reservations in DineAura.",
};

export default async function AdminReservationsPage() {
    const supabase = await createClient();

    // Authenticated user session
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect("/login");
    }

    // Enforce admin role authorization server-side
    const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, avatar_url, role, created_at, updated_at")
        .eq("id", user.id)
        .maybeSingle<UserProfile>();

    if (profile?.role !== "admin") {
        redirect("/dashboard");
    }

    // Fetch all reservations from Supabase with restaurant details
    let reservations: Reservation[] = [];
    try {
        const { data, error } = await supabase
            .from("reservations")
            .select(`
                id,
                restaurant_id,
                user_id,
                customer_name,
                customer_phone,
                reservation_date,
                reservation_time,
                party_size,
                seating_preference,
                special_request,
                status,
                created_at,
                updated_at,
                restaurant:restaurants (
                    id,
                    name,
                    city,
                    cuisine,
                    image_url,
                    phone,
                    address
                )
            `)
            .order("created_at", { ascending: false });

        if (!error && data) {
            reservations = data as unknown as Reservation[];
        } else if (error) {
            // Fallback in case embedded relation is not resolved automatically
            const { data: rawRes, error: rawErr } = await supabase
                .from("reservations")
                .select("*")
                .order("created_at", { ascending: false });

            if (!rawErr && rawRes) {
                const { data: restList } = await supabase
                    .from("restaurants")
                    .select("id, name, city, cuisine, image_url, phone, address");

                const restMap = new Map((restList || []).map((r) => [r.id, r]));
                reservations = rawRes.map((r) => ({
                    ...r,
                    restaurant: restMap.get(r.restaurant_id),
                })) as unknown as Reservation[];
            }
        }
    } catch (err) {
        console.error("Error retrieving admin reservations:", err);
    }

    return (
        <PortalShell user={user} profile={profile}>
            <AdminReservationsView initialReservations={reservations} />
        </PortalShell>
    );
}
