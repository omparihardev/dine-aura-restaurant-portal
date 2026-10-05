import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { PortalShell } from "@/components/portal/portal-shell";
import { AdminMenuManager } from "@/components/portal/admin-menu-manager";
import type { UserProfile, Restaurant } from "@/lib/types/portal";
import type { RestaurantMenuItem } from "@/lib/types/menu";

export const metadata = {
    title: "Admin: Restaurant Menu Management | DineAura",
    description: "Manage restaurant menu items and prices in DineAura.",
};

interface MenuPageProps {
    params: Promise<{ id: string }>;
}

export default async function AdminRestaurantMenuPage({ params }: MenuPageProps) {
    const { id: restaurantId } = await params;
    const supabase = await createClient();

    // 1. Enforce Authentication
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect("/login");
    }

    // 2. Enforce Admin Role Server-side
    const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone, avatar_url, role, created_at, updated_at")
        .eq("id", user.id)
        .maybeSingle<UserProfile>();

    if (profile?.role !== "admin") {
        redirect("/dashboard");
    }

    // 3. Retrieve the target restaurant
    const { data: restaurant, error: restError } = await supabase
        .from("restaurants")
        .select("id, name, description, city, state, address, cuisine, image_url, phone, rating, latitude, longitude, is_active, created_at, updated_at")
        .eq("id", restaurantId)
        .maybeSingle<Restaurant>();

    if (restError || !restaurant) {
        notFound();
    }

    // 4. Retrieve restaurant menu items (with graceful handling if migration has not been applied yet)
    let menuItems: RestaurantMenuItem[] = [];
    let tableNotReadyMessage: string | null = null;

    const { data: rawMenuItems, error: menuError } = await supabase
        .from("restaurant_menu_items")
        .select("id, restaurant_id, name, description, category, price, is_available, created_at, updated_at")
        .eq("restaurant_id", restaurantId)
        .order("category", { ascending: true })
        .order("name", { ascending: true });

    if (menuError) {
        const isTableMissing =
            menuError.code === "PGRST205" ||
            menuError.code === "42P01" ||
            (typeof menuError.message === "string" &&
                (menuError.message.includes("schema cache") ||
                    menuError.message.includes("does not exist") ||
                    menuError.message.includes("restaurant_menu_items")));

        if (isTableMissing) {
            tableNotReadyMessage =
                "The restaurant_menu_items table has not been initialized in Supabase yet. Please execute the SQL migration script (supabase/restaurant_menu_items.sql) in your Supabase SQL editor.";
        }
    } else {
        menuItems = (rawMenuItems as RestaurantMenuItem[]) || [];
    }

    return (
        <PortalShell user={user} profile={profile}>
            <AdminMenuManager
                restaurant={restaurant}
                initialMenuItems={menuItems}
                tableNotReadyMessage={tableNotReadyMessage}
            />
        </PortalShell>
    );
}
