"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export interface AuthActionResult {
    error?: string;
    success?: boolean;
    message?: string;
}

export async function signInAction(formData: FormData): Promise<AuthActionResult> {
    const email = formData.get("email")?.toString().trim();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
        return { error: "Please enter both your email address and password." };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: error.message };
    }

    redirect("/");
}

export async function adminSignInAction(formData: FormData): Promise<AuthActionResult> {
    const email = formData.get("email")?.toString().trim();
    const password = formData.get("password")?.toString();

    if (!email || !password) {
        return { error: "Please enter both your email address and password." };
    }

    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (authError || !authData.user) {
        return { error: authError?.message || "Invalid login credentials." };
    }

    // Verify role strictly from public.profiles
    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .maybeSingle();

    if (profileError || profile?.role !== "admin") {
        // Sign out to prevent leaving regular user session in admin flow
        await supabase.auth.signOut();
        return { error: "This account does not have administrator access." };
    }

    redirect("/admin/restaurants");
}

export async function signUpAction(formData: FormData): Promise<AuthActionResult> {
    const fullName = formData.get("fullName")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const password = formData.get("password")?.toString();
    const confirmPassword = formData.get("confirmPassword")?.toString();

    if (!email || !password) {
        return { error: "Please enter an email and password." };
    }

    if (password.length < 6) {
        return { error: "Password must be at least 6 characters long." };
    }

    if (confirmPassword && password !== confirmPassword) {
        return { error: "Passwords do not match." };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName || "",
            },
        },
    });

    if (error) {
        return { error: error.message };
    }

    // If email confirmation is enabled on Supabase, no active session is returned immediately
    if (data.user && !data.session) {
        return {
            success: true,
            message: "Account created successfully! Please check your email to confirm your account, then sign in.",
        };
    }

    redirect("/");
}

export async function forgotPasswordAction(formData: FormData): Promise<AuthActionResult> {
    const email = formData.get("email")?.toString().trim();

    if (!email) {
        return { error: "Please enter your email address." };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { error: "Please enter a valid email address." };
    }

    try {
        const headerList = await headers();
        const originHeader = headerList.get("origin");
        const hostHeader = headerList.get("host");
        const protoHeader = headerList.get("x-forwarded-proto") || "http";
        const origin =
            originHeader ||
            (hostHeader ? `${protoHeader}://${hostHeader}` : "") ||
            process.env.NEXT_PUBLIC_SITE_URL ||
            "http://localhost:3000";

        const supabase = await createClient();
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${origin}/auth/callback?next=/reset-password`,
        });

        if (error) {
            return { error: error.message };
        }

        return {
            success: true,
            message: "If an account exists for this email, we've sent a password reset link.",
        };
    } catch {
        return {
            error: "Unable to process password reset request. Please try again later.",
        };
    }
}

export async function signOutAction(): Promise<void> {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
}
