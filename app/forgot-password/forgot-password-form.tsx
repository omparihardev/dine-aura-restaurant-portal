"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { forgotPasswordAction, type AuthActionResult } from "@/app/login/actions";

export default function ForgotPasswordForm() {
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);

        const form = event.currentTarget;
        const formData = new FormData(form);

        startTransition(async () => {
            try {
                const result: AuthActionResult = await forgotPasswordAction(formData);

                if (result.error) {
                    setErrorMessage(result.error);
                } else if (result.message) {
                    setSuccessMessage(result.message);
                    form.reset();
                }
            } catch {
                setErrorMessage("An unexpected error occurred while requesting password reset. Please try again.");
            }
        });
    }

    return (
        <div className="w-full max-w-md mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-8">
            {/* Header info */}
            <div className="mb-6 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <span className="text-base flex-shrink-0 mt-0.5">🔒</span>
                <div className="text-xs">
                    <p className="font-bold">Password Recovery</p>
                    <p className="text-amber-800/90 dark:text-amber-300/90 text-[11px] mt-0.5">
                        We will email you a secure link to reset your account password.
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
                    <span>{successMessage}</span>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label
                        htmlFor="email"
                        className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1"
                    >
                        Email Address
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        placeholder="you@example.com"
                        autoComplete="email"
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-sm"
                    />
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
                            <span>Sending Reset Link...</span>
                        </>
                    ) : (
                        <span>Send Reset Link</span>
                    )}
                </button>
            </form>

            {/* Bottom helper text */}
            <div className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
                <p>
                    Remember your password?{" "}
                    <Link
                        href="/login"
                        className="font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                    >
                        Back to Login
                    </Link>
                </p>
            </div>
        </div>
    );
}
