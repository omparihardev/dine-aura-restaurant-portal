"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface ProfileActionResult {
    error?: string;
    success?: boolean;
    message?: string;
}

export async function updateProfileAction(formData: FormData): Promise<ProfileActionResult> {
    const supabase = await createClient();
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return { error: "Authentication required to update profile." };
    }

    const fullName = formData.get("fullName")?.toString().trim();
    const phone = formData.get("phone")?.toString().trim() || null;

    if (!fullName) {
        return { error: "Full Name cannot be empty." };
    }

    const { error: updateError } = await supabase
        .from("profiles")
        .update({
            full_name: fullName,
            phone: phone,
        })
        .eq("id", user.id);

    if (updateError) {
        return { error: updateError.message };
    }

    // Also update Supabase auth metadata so headers stay in sync
    await supabase.auth.updateUser({
        data: {
            full_name: fullName,
        },
    });

    revalidatePath("/profile");
    revalidatePath("/dashboard");
    revalidatePath("/");

    return {
        success: true,
        message: "Your profile details have been successfully updated.",
    };
}
