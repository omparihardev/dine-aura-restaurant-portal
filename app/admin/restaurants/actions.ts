"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface RestaurantActionResult {
    error?: string;
    success?: boolean;
    message?: string;
    data?: any;
}

// Helper: Ensure the current user is authenticated and has admin privileges
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

// Indian phone validation regex (optional, but if provided must be a valid 10-digit number or with +91/0 prefix)
function isValidIndianPhone(phone: string): boolean {
    const cleaned = phone.replace(/[\s\-()]/g, "");
    return /^(\+91|0)?[6-9]\d{9}$/.test(cleaned);
}

export async function createRestaurantAction(formData: FormData): Promise<RestaurantActionResult> {
    try {
        const { supabase } = await verifyAdmin();

        const name = formData.get("name")?.toString().trim();
        const city = formData.get("city")?.toString().trim();
        const state = formData.get("state")?.toString().trim();
        const cuisine = formData.get("cuisine")?.toString().trim();
        const description = formData.get("description")?.toString().trim() || null;
        const address = formData.get("address")?.toString().trim() || null;
        const image_url = formData.get("image_url")?.toString().trim() || null;
        const phone = formData.get("phone")?.toString().trim() || null;
        const ratingRaw = formData.get("rating")?.toString().trim();
        const isActiveRaw = formData.get("is_active");
        const is_active = isActiveRaw === "on" || isActiveRaw === "true";

        // Required field validations
        if (!name) return { error: "Restaurant name is required." };
        if (!city) return { error: "City is required." };
        if (!state) return { error: "State is required." };
        if (!cuisine) return { error: "Cuisine is required." };

        // Rating validation
        let rating: number | null = null;
        if (ratingRaw) {
            rating = parseFloat(ratingRaw);
            if (isNaN(rating) || rating < 0 || rating > 5) {
                return { error: "Rating must be a number between 0 and 5." };
            }
        }

        // Phone validation
        if (phone && !isValidIndianPhone(phone)) {
            return { error: "Please enter a valid 10-digit Indian phone number (e.g. +91 98765 43210 or 9876543210)." };
        }

        const { data: insertedData, error: insertError } = await supabase
            .from("restaurants")
            .insert({
                name,
                city,
                state,
                cuisine,
                description,
                address,
                image_url,
                phone,
                rating,
                is_active,
            })
            .select()
            .single();

        if (insertError) {
            return { error: insertError.message };
        }

        revalidatePath("/admin/restaurants");
        revalidatePath("/dashboard");
        revalidatePath("/");

        return {
            success: true,
            message: `Restaurant "${name}" has been created successfully.`,
            data: insertedData,
        };
    } catch (err: unknown) {
        return { error: err instanceof Error ? err.message : "Failed to create restaurant." };
    }
}

export async function updateRestaurantAction(
    id: string,
    formData: FormData
): Promise<RestaurantActionResult> {
    try {
        const { supabase } = await verifyAdmin();

        if (!id) return { error: "Restaurant ID is missing." };

        const name = formData.get("name")?.toString().trim();
        const city = formData.get("city")?.toString().trim();
        const state = formData.get("state")?.toString().trim();
        const cuisine = formData.get("cuisine")?.toString().trim();
        const description = formData.get("description")?.toString().trim() || null;
        const address = formData.get("address")?.toString().trim() || null;
        const image_url = formData.get("image_url")?.toString().trim() || null;
        const phone = formData.get("phone")?.toString().trim() || null;
        const ratingRaw = formData.get("rating")?.toString().trim();
        const isActiveRaw = formData.get("is_active");
        const is_active = isActiveRaw === "on" || isActiveRaw === "true";

        // Required field validations
        if (!name) return { error: "Restaurant name is required." };
        if (!city) return { error: "City is required." };
        if (!state) return { error: "State is required." };
        if (!cuisine) return { error: "Cuisine is required." };

        // Rating validation
        let rating: number | null = null;
        if (ratingRaw) {
            rating = parseFloat(ratingRaw);
            if (isNaN(rating) || rating < 0 || rating > 5) {
                return { error: "Rating must be a number between 0 and 5." };
            }
        }

        // Phone validation
        if (phone && !isValidIndianPhone(phone)) {
            return { error: "Please enter a valid 10-digit Indian phone number (e.g. +91 98765 43210 or 9876543210)." };
        }

        const updatePayload: Record<string, any> = {
            name,
            city,
            state,
            cuisine,
            description,
            address,
            phone,
            rating,
            is_active,
        };

        // Only update image_url if the field was explicitly provided in formData
        if (formData.has("image_url")) {
            const rawImageUrl = formData.get("image_url")?.toString().trim();
            updatePayload.image_url = rawImageUrl ? rawImageUrl : null;
        }

        const { data: updatedData, error: updateError } = await supabase
            .from("restaurants")
            .update(updatePayload)
            .eq("id", id)
            .select()
            .single();

        if (updateError) {
            return { error: updateError.message };
        }

        revalidatePath("/admin/restaurants");
        revalidatePath("/dashboard");
        revalidatePath("/");

        return {
            success: true,
            message: `Restaurant "${name}" has been updated successfully.`,
            data: updatedData,
        };
    } catch (err: unknown) {
        return { error: err instanceof Error ? err.message : "Failed to update restaurant." };
    }
}

export async function toggleRestaurantStatusAction(
    id: string,
    currentStatus: boolean
): Promise<RestaurantActionResult> {
    try {
        const { supabase } = await verifyAdmin();

        const newStatus = !currentStatus;

        const { error: toggleError } = await supabase
            .from("restaurants")
            .update({ is_active: newStatus })
            .eq("id", id);

        if (toggleError) {
            return { error: toggleError.message };
        }

        revalidatePath("/admin/restaurants");
        revalidatePath("/dashboard");
        revalidatePath("/");

        return {
            success: true,
            message: `Restaurant status updated to ${newStatus ? "Active" : "Inactive"}.`,
        };
    } catch (err: unknown) {
        return { error: err instanceof Error ? err.message : "Failed to toggle restaurant status." };
    }
}

export async function deleteRestaurantAction(id: string): Promise<RestaurantActionResult> {
    try {
        const { supabase } = await verifyAdmin();

        const { error: deleteError } = await supabase
            .from("restaurants")
            .delete()
            .eq("id", id);

        if (deleteError) {
            return { error: deleteError.message };
        }

        revalidatePath("/admin/restaurants");
        revalidatePath("/dashboard");
        revalidatePath("/");

        return { success: true, message: "Restaurant deleted successfully." };
    } catch (err: unknown) {
        return { error: err instanceof Error ? err.message : "Failed to delete restaurant." };
    }
}

export async function uploadRestaurantImageAction(
    formData: FormData
): Promise<{ error?: string; url?: string }> {
    try {
        const { supabase } = await verifyAdmin();

        const file = formData.get("file") as File | null;
        if (!file || !(file instanceof File)) {
            return { error: "No image file provided." };
        }

        const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
        if (!validTypes.includes(file.type.toLowerCase())) {
            return { error: "Invalid image format. Allowed formats are JPG, PNG, and WebP." };
        }

        const maxBytes = 5 * 1024 * 1024; // 5MB
        if (file.size > maxBytes) {
            return { error: "Image file size exceeds the 5MB limit." };
        }

        // Generate safe unique filename
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const cleanName = file.name
            .replace(/\.[^/.]+$/, "")
            .replace(/[^a-zA-Z0-9_-]/g, "_")
            .slice(0, 30);
        const fileName = `${Date.now()}-${cleanName}.${ext}`;
        const filePath = `restaurants/${fileName}`;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Supabase Storage bucket 'restaurant-images'
        const { error: uploadError } = await supabase.storage
            .from("restaurant-images")
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            if (
                uploadError.message.includes("Bucket not found") ||
                uploadError.message.includes("not found")
            ) {
                return {
                    error: "Storage bucket 'restaurant-images' was not found. Please ensure the bucket is created in your Supabase project (see supabase/storage.sql).",
                };
            }
            return { error: `Upload failed: ${uploadError.message}` };
        }

        // Retrieve public URL
        const { data: urlData } = supabase.storage
            .from("restaurant-images")
            .getPublicUrl(filePath);

        return { url: urlData.publicUrl };
    } catch (err: unknown) {
        return { error: err instanceof Error ? err.message : "Failed to upload image." };
    }
}

