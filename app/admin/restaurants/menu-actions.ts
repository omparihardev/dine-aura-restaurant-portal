"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { RestaurantMenuItem, MenuItemActionResult } from "@/lib/types/menu";

/**
 * Server-side Admin Authorization Guard
 * Verifies that the request comes from an authenticated user whose profile role is 'admin'.
 * Does not trust any client-supplied role flags.
 */
async function verifyAdmin() {
    const supabase = await createClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error("Unauthorized: Please log in as an administrator.");
    }

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (profileError || profile?.role !== "admin") {
        throw new Error("Forbidden: Administrator privileges are required for this action.");
    }

    return { supabase, user };
}

/**
 * Helper to identify if an error is due to missing restaurant_menu_items table in Supabase
 */
function isTableMissingError(error: { code?: string; message?: string } | null): boolean {
    if (!error) return false;
    return (
        error.code === "PGRST205" ||
        error.code === "42P01" ||
        (typeof error.message === "string" &&
            (error.message.includes("schema cache") ||
                error.message.includes("does not exist") ||
                error.message.includes("restaurant_menu_items")))
    );
}

const TABLE_NOT_READY_MESSAGE =
    "The restaurant_menu_items table has not been initialized in Supabase yet. Please execute the SQL migration script (supabase/restaurant_menu_items.sql) in your Supabase SQL editor.";

/**
 * Create a new menu item for a restaurant
 */
export async function createMenuItemAction(formData: FormData): Promise<MenuItemActionResult> {
    try {
        const { supabase } = await verifyAdmin();

        const restaurantId = formData.get("restaurant_id")?.toString().trim();
        const name = formData.get("name")?.toString().trim();
        const category = formData.get("category")?.toString().trim();
        const description = formData.get("description")?.toString().trim() || null;
        const priceRaw = formData.get("price")?.toString().trim();
        const isAvailableRaw = formData.get("is_available");
        const is_available = isAvailableRaw === "on" || isAvailableRaw === "true";

        // Required field validations
        if (!restaurantId) {
            return { error: "Restaurant ID is required." };
        }
        if (!name) {
            return { error: "Menu item name cannot be empty." };
        }
        if (!category) {
            return { error: "Category cannot be empty." };
        }
        if (!priceRaw) {
            return { error: "Price is required." };
        }

        const price = parseFloat(priceRaw);
        if (isNaN(price) || price < 0) {
            return { error: "Price must be a valid non-negative number." };
        }

        // Verify the restaurant exists
        const { data: restaurant, error: restError } = await supabase
            .from("restaurants")
            .select("id")
            .eq("id", restaurantId)
            .maybeSingle();

        if (restError || !restaurant) {
            return { error: "The referenced restaurant does not exist." };
        }

        const { data: newItem, error: insertError } = await supabase
            .from("restaurant_menu_items")
            .insert({
                restaurant_id: restaurantId,
                name,
                category,
                description,
                price: Number(price.toFixed(2)),
                is_available,
            })
            .select("id, restaurant_id, name, description, category, price, is_available, created_at, updated_at")
            .single<RestaurantMenuItem>();

        if (insertError) {
            if (isTableMissingError(insertError)) {
                return { error: TABLE_NOT_READY_MESSAGE };
            }
            return { error: insertError.message || "Failed to create menu item." };
        }

        revalidatePath(`/admin/restaurants/${restaurantId}/menu`);
        revalidatePath(`/restaurants/${restaurantId}`);

        return {
            success: true,
            message: `"${name}" added to menu successfully.`,
            data: newItem,
        };
    } catch (err: unknown) {
        return {
            error: err instanceof Error ? err.message : "An unexpected error occurred while adding the menu item.",
        };
    }
}

/**
 * Update an existing menu item
 */
export async function updateMenuItemAction(formData: FormData): Promise<MenuItemActionResult> {
    try {
        const { supabase } = await verifyAdmin();

        const id = formData.get("id")?.toString().trim();
        const restaurantId = formData.get("restaurant_id")?.toString().trim();
        const name = formData.get("name")?.toString().trim();
        const category = formData.get("category")?.toString().trim();
        const description = formData.get("description")?.toString().trim() || null;
        const priceRaw = formData.get("price")?.toString().trim();
        const isAvailableRaw = formData.get("is_available");
        const is_available = isAvailableRaw === "on" || isAvailableRaw === "true";

        if (!id) {
            return { error: "Menu item ID is required." };
        }
        if (!restaurantId) {
            return { error: "Restaurant ID is required." };
        }
        if (!name) {
            return { error: "Menu item name cannot be empty." };
        }
        if (!category) {
            return { error: "Category cannot be empty." };
        }
        if (!priceRaw) {
            return { error: "Price is required." };
        }

        const price = parseFloat(priceRaw);
        if (isNaN(price) || price < 0) {
            return { error: "Price must be a valid non-negative number." };
        }

        const { data: updatedItem, error: updateError } = await supabase
            .from("restaurant_menu_items")
            .update({
                name,
                category,
                description,
                price: Number(price.toFixed(2)),
                is_available,
            })
            .eq("id", id)
            .eq("restaurant_id", restaurantId)
            .select("id, restaurant_id, name, description, category, price, is_available, created_at, updated_at")
            .single<RestaurantMenuItem>();

        if (updateError) {
            if (isTableMissingError(updateError)) {
                return { error: TABLE_NOT_READY_MESSAGE };
            }
            return { error: updateError.message || "Failed to update menu item." };
        }

        revalidatePath(`/admin/restaurants/${restaurantId}/menu`);
        revalidatePath(`/restaurants/${restaurantId}`);

        return {
            success: true,
            message: `"${name}" updated successfully.`,
            data: updatedItem,
        };
    } catch (err: unknown) {
        return {
            error: err instanceof Error ? err.message : "An unexpected error occurred while updating the menu item.",
        };
    }
}

/**
 * Toggle the availability of a menu item
 */
export async function toggleMenuItemAvailabilityAction(
    id: string,
    restaurantId: string,
    currentStatus: boolean
): Promise<MenuItemActionResult> {
    try {
        const { supabase } = await verifyAdmin();

        if (!id || !restaurantId) {
            return { error: "Invalid item or restaurant identifier." };
        }

        const newStatus = !currentStatus;

        const { error: updateError } = await supabase
            .from("restaurant_menu_items")
            .update({ is_available: newStatus })
            .eq("id", id)
            .eq("restaurant_id", restaurantId);

        if (updateError) {
            if (isTableMissingError(updateError)) {
                return { error: TABLE_NOT_READY_MESSAGE };
            }
            return { error: updateError.message || "Failed to update availability status." };
        }

        revalidatePath(`/admin/restaurants/${restaurantId}/menu`);
        revalidatePath(`/restaurants/${restaurantId}`);

        return {
            success: true,
            message: `Menu item is now marked as ${newStatus ? "Available" : "Unavailable"}.`,
        };
    } catch (err: unknown) {
        return {
            error: err instanceof Error ? err.message : "An unexpected error occurred while toggling availability.",
        };
    }
}

/**
 * Delete a menu item
 */
export async function deleteMenuItemAction(
    id: string,
    restaurantId: string
): Promise<MenuItemActionResult> {
    try {
        const { supabase } = await verifyAdmin();

        if (!id || !restaurantId) {
            return { error: "Invalid item or restaurant identifier." };
        }

        const { error: deleteError } = await supabase
            .from("restaurant_menu_items")
            .delete()
            .eq("id", id)
            .eq("restaurant_id", restaurantId);

        if (deleteError) {
            if (isTableMissingError(deleteError)) {
                return { error: TABLE_NOT_READY_MESSAGE };
            }
            return { error: deleteError.message || "Failed to delete menu item." };
        }

        revalidatePath(`/admin/restaurants/${restaurantId}/menu`);
        revalidatePath(`/restaurants/${restaurantId}`);

        return {
            success: true,
            message: "Menu item deleted successfully.",
        };
    } catch (err: unknown) {
        return {
            error: err instanceof Error ? err.message : "An unexpected error occurred while deleting the menu item.",
        };
    }
}
