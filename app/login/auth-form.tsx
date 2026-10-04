"use client";

import { useState, useTransition } from "react";
import {
    signInAction,
    adminSignInAction,
    signUpAction,
    type AuthActionResult,
} from "./actions";

export default function AuthForm() {
    const [portalType, setPortalType] = useState<"user" | "admin">("user");
    const [mode, setMode] = useState<"signin" | "signup">("signin");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    function handlePortalTypeChange(newPortalType: "user" | "admin") {
        setPortalType(newPortalType);
        setMode("signin"); // Admin mode never has signup
        setErrorMessage(null);
        setSuccessMessage(null);
        setShowPassword(false);
        setShowConfirmPassword(false);
    }

    function handleModeChange(newMode: "signin" | "signup") {
        setMode(newMode);
        setErrorMessage(null);
        setSuccessMessage(null);
        setShowPassword(false);
        setShowConfirmPassword(false);
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);

        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
            try {
                const action =
                    portalType === "admin"
                        ? adminSignInAction
                        : mode === "signin"
                        ? signInAction
                        : signUpAction;

                const result: AuthActionResult | undefined = await action(formData);

                if (result?.error) {
                    setErrorMessage(result.error);
                } else if (result?.message) {
                    setSuccessMessage(result.message);
                    if (result?.success && mode === "signup") {
                        setMode("signin");
                    }
                }
            } catch (err: unknown) {
                // Next.js redirect throws a special NEXT_REDIRECT error which shouldn't be caught as an error
                if (
                    err &&
                    typeof err === "object" &&
                    (("digest" in err &&
                        typeof (err as { digest: unknown }).digest === "string" &&
                        (err as { digest: string }).digest.startsWith("NEXT_REDIRECT")) ||
                        ("message" in err &&
                            (err as { message: unknown }).message === "NEXT_REDIRECT"))
                ) {
                    throw err;
                }
                setErrorMessage("An unexpected authentication error occurred. Please try again.");
            }
        });
    }

    return (
        <div className="w-full max-w-md mx-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-8">
            {/* Top-Level Portal Switcher: User Login vs Admin Login */}
            <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 mb-6 border border-zinc-200/80 dark:border-zinc-700/60 shadow-inner">
                <button
                    type="button"
                    onClick={() => handlePortalTypeChange("user")}
                    className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                        portalType === "user"
                            ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm"
                            : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                    }`}
                >
                    <span className="text-sm">👤</span>
                    <span>User Login</span>
                </button>
                <button
                    type="button"
                    onClick={() => handlePortalTypeChange("admin")}
                    className={`flex-1 py-2.5 px-3 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                        portalType === "admin"
                            ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                            : "text-zinc-500 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400"
                    }`}
                >
                    <span className="text-sm">🛡️</span>
                    <span>Admin Login</span>
                </button>
            </div>

            {/* Admin Badge Header when in Admin Login mode */}
            {portalType === "admin" && (
                <div className="mb-6 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                    <span className="text-base flex-shrink-0 mt-0.5">🛡️</span>
                    <div className="text-xs">
                        <p className="font-bold">Administrative Portal</p>
                        <p className="text-amber-800/90 dark:text-amber-300/90 text-[11px] mt-0.5">
                            Sign in with verified administrator credentials to access restaurant directory management.
                        </p>
                    </div>
                </div>
            )}

            {/* User Sub-Tabs: Sign In vs Create Account (Only in User Login mode) */}
            {portalType === "user" && (
                <div className="flex rounded-xl bg-zinc-100/70 dark:bg-zinc-800/60 p-1 mb-6 border border-zinc-200/60 dark:border-zinc-700/40">
                    <button
                        type="button"
                        onClick={() => handleModeChange("signin")}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                            mode === "signin"
                                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm"
                                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                        }`}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        onClick={() => handleModeChange("signup")}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                            mode === "signup"
                                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm"
                                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                        }`}
                    >
                        Create Account
                    </button>
                </div>
            )}

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
                {portalType === "user" && mode === "signup" && (
                    <div>
                        <label
                            htmlFor="fullName"
                            className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1"
                        >
                            Full Name
                        </label>
                        <input
                            id="fullName"
                            name="fullName"
                            type="text"
                            placeholder="e.g. Aarav Sharma"
                            autoComplete="name"
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-sm"
                        />
                    </div>
                )}

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
                        placeholder={
                            portalType === "admin"
                                ? "admin@dineaura.in"
                                : "you@example.com"
                        }
                        autoComplete="email"
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all text-sm"
                    />
                </div>

                <div>
                    <label
                        htmlFor="password"
                        className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1"
                    >
                        Password
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            required
                            minLength={6}
                            placeholder="At least 6 characters"
                            autoComplete={
                                mode === "signin"
                                    ? "current-password"
                                    : "new-password"
                            }
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

                {portalType === "user" && mode === "signup" && (
                    <div>
                        <label
                            htmlFor="confirmPassword"
                            className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1"
                        >
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                required
                                minLength={6}
                                placeholder="Re-enter your password"
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
                )}

                <button
                    type="submit"
                    disabled={isPending}
                    className={`w-full mt-2 py-3 px-4 rounded-xl font-medium text-sm text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                        portalType === "admin"
                            ? "bg-amber-600 hover:bg-amber-700 active:bg-amber-800"
                            : "bg-amber-600 hover:bg-amber-700 active:bg-amber-800"
                    }`}
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
                            <span>Authenticating...</span>
                        </>
                    ) : portalType === "admin" ? (
                        <span className="flex items-center gap-1.5">
                            <span>🛡️</span>
                            <span>Sign In to Admin Portal</span>
                        </span>
                    ) : mode === "signin" ? (
                        "Sign In"
                    ) : (
                        "Create Account"
                    )}
                </button>
            </form>

            {/* Bottom helper text */}
            <div className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
                {portalType === "admin" ? (
                    <p>
                        Need standard customer access?{" "}
                        <button
                            type="button"
                            onClick={() => handlePortalTypeChange("user")}
                            className="font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                        >
                            Switch to User Login
                        </button>
                    </p>
                ) : mode === "signin" ? (
                    <div className="space-y-2">
                        <p>
                            New to DineAura?{" "}
                            <button
                                type="button"
                                onClick={() => handleModeChange("signup")}
                                className="font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                            >
                                Create an account
                            </button>
                        </p>
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                            Restaurant Manager or Administrator?{" "}
                            <button
                                type="button"
                                onClick={() => handlePortalTypeChange("admin")}
                                className="font-medium text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                            >
                                Switch to Admin Login
                            </button>
                        </p>
                    </div>
                ) : (
                    <p>
                        Already have an account?{" "}
                        <button
                            type="button"
                            onClick={() => handleModeChange("signin")}
                            className="font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                        >
                            Sign in here
                        </button>
                    </p>
                )}
            </div>
        </div>
    );
}
