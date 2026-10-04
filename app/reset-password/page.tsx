import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ResetPasswordForm from "./reset-password-form";
import Link from "next/link";

export const metadata = {
    title: "Reset Password | DineAura",
    description: "Set a new secure password for your DineAura account.",
};

export default async function ResetPasswordPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Enforce that the user has arrived with an active recovery session
    if (!user) {
        redirect("/login?error=" + encodeURIComponent("Please use the password reset link sent to your email to access this page."));
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 hover:opacity-80 transition-opacity"
                >
                    <span className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white text-base shadow-sm">
                        🍽️
                    </span>
                    <span>DineAura</span>
                </Link>
                <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                    Set New Password
                </h1>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    Choose a strong new password for your account ({user.email}).
                </p>
            </div>

            <ResetPasswordForm userEmail={user.email} />

            <div className="mt-8 text-center text-xs text-zinc-400 dark:text-zinc-600">
                <Link href="/login" className="hover:underline">
                    &larr; Back to Login
                </Link>
            </div>
        </div>
    );
}
