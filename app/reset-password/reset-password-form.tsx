"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface ResetPasswordFormProps {
    userEmail?: string;
}

export default function ResetPasswordForm({ userEmail }: ResetPasswordFormProps) {
    const [password, setPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [isComplete, setIsComplete] = useState<boolean>(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);

        if (!password || !confirmPassword) {
            setErrorMessage("Please enter and confirm your new password.");
            return;
        }

        if (password.length < 6) {
            setErrorMessage("Password must be at least 6 characters long.");
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage("Passwords do not match. Please ensure both fields are identical.");
            return;
        }

        startTransition(async () => {
            try {
                const supabase = createClient();
                const { error } = await supabase.auth.updateUser({
                    password: password,
                });

                if (error) {
                    setErrorMessage(error.message);
                    return;
                }

                // Sign out of the temporary recovery session so user can log in freshly
                await supabase.auth.signOut();

                setIsComplete(true);
                setSuccessMessage("Password reset successfully! Redirecting you to login...");

                // Smooth redirect to login after confirmation
                setTimeout(() => {
                    if (typeof window !== "undefined") {
                        window.location.href = "/login";
                    }
                }, 2500);
            } catch {
                setErrorMessage("An unexpected error occurred while resetting your password. Please try again.");
            }
        });
    }

    return (
        <div className="w-full max-w-md mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-8">
            {/* Header info */}
            <div className="mb-6 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <span className="text-base flex-shrink-0 mt-0.5">🛡️</span>
                <div className="text-xs">
                    <p className="font-bold">Create New Password</p>
                    <p className="text-amber-800/90 dark:text-amber-300/90 text-[11px] mt-0.5">
                        {userEmail ? `Resetting password for ${userEmail}` : "Must be at least 6 characters long."}
                    </p>
                </div>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
                <div
                    role="alert"
                    className="mb-6 p-4 rounded-xl text-sm bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 flex items-start gap-3"
                >
                    <svg
                        className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Success Message Alert */}
            {successMessage && (
                <div
                    role="alert"
                    className="mb-6 p-4 rounded-xl text-sm bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 flex items-start gap-3"
                >
                    <svg
                        className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <div className="flex flex-col gap-1">
                        <span className="font-semibold">{successMessage}</span>
                        <Link
                            href="/login"
                            className="text-xs text-emerald-900 dark:text-emerald-200 underline font-medium hover:opacity-80"
                        >
                            Click here if not redirected automatically &rarr;
                        </Link>
                    </div>
                </div>
            )}

            {!isComplete ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="new-password"
                            className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1"
                        >
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                id="new-password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="At least 6 characters"
                                autoComplete="new-password"
                                className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                title={showPassword ? "Hide password" : "Show password"}
                                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors focus:outline-none cursor-pointer"
                            >
                                {showPassword ? (
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={1.5}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                                        />
                                    </svg>
                                ) : (
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={1.5}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="confirm-password"
                            className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1"
                        >
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <input
                                id="confirm-password"
                                name="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                required
                                minLength={6}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Re-enter your new password"
                                autoComplete="new-password"
                                className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword((prev) => !prev)}
                                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                                title={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors focus:outline-none cursor-pointer"
                            >
                                {showConfirmPassword ? (
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={1.5}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                                        />
                                    </svg>
                                ) : (
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={1.5}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full mt-2 py-3 px-4 rounded-xl font-medium text-sm text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isPending ? (
                            <>
                                <svg
                                    className="animate-spin h-4 w-4 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                <span>Updating Password...</span>
                            </>
                        ) : (
                            <span>Set New Password</span>
                        )}
                    </button>
                </form>
            ) : (
                <div className="text-center pt-2">
                    <Link
                        href="/login"
                        className="inline-block w-full py-3 px-4 rounded-xl font-medium text-sm text-white bg-amber-600 hover:bg-amber-700 transition-all text-center shadow-md"
                    >
                        Proceed to Login
                    </Link>
                </div>
            )}
        </div>
    );
}
