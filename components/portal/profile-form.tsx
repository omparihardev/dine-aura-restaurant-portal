"use client";

import { useState, useTransition } from "react";
import type { UserProfile } from "@/lib/types/portal";
import { updateProfileAction, type ProfileActionResult } from "@/app/profile/actions";
import { signOutAction } from "@/app/login/actions";

interface ProfileFormProps {
    profile: UserProfile | null;
    email?: string;
}

export function ProfileForm({ profile, email }: ProfileFormProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const currentName = profile?.full_name || email?.split("@")[0] || "Valued Member";
    const currentPhone = profile?.phone || "";
    const currentRole = profile?.role || "user";
    const initial = currentName.charAt(0).toUpperCase();

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage(null);
        setSuccessMessage(null);

        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
            const result: ProfileActionResult = await updateProfileAction(formData);

            if (result.error) {
                setErrorMessage(result.error);
            } else if (result.success) {
                setSuccessMessage(result.message || "Profile updated successfully.");
                setIsEditing(false);
            }
        });
    }

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            {/* Profile Header: Avatar + Display Name + Role Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-600 text-white flex items-center justify-center font-bold text-2xl shadow-md">
                        {initial}
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            {currentName}
                        </h2>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{email}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                        Role: {currentRole}
                    </span>

                    {!isEditing && (
                        <button
                            type="button"
                            onClick={() => {
                                setIsEditing(true);
                                setSuccessMessage(null);
                                setErrorMessage(null);
                            }}
                            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-all"
                        >
                            Edit Profile
                        </button>
                    )}
                </div>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
                <div
                    role="alert"
                    className="p-4 rounded-2xl text-xs sm:text-sm bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 flex items-start gap-2.5"
                >
                    <svg className="w-5 h-5 flex-shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{errorMessage}</span>
                </div>
            )}

            {/* Success Message Alert */}
            {successMessage && (
                <div
                    role="alert"
                    className="p-4 rounded-2xl text-xs sm:text-sm bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 flex items-start gap-2.5"
                >
                    <svg className="w-5 h-5 flex-shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{successMessage}</span>
                </div>
            )}

            {/* View Mode */}
            {!isEditing ? (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800">
                        <dt className="text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400">
                            Full Name
                        </dt>
                        <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                            {currentName}
                        </dd>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800">
                        <dt className="text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400">
                            Email Address
                        </dt>
                        <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-100 truncate">
                            {email}
                        </dd>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800">
                        <dt className="text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400">
                            Phone Number
                        </dt>
                        <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                            {currentPhone || "Not provided"}
                        </dd>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800">
                        <dt className="text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400">
                            Account UID
                        </dt>
                        <dd className="mt-1 font-mono text-xs text-zinc-600 dark:text-zinc-400 truncate">
                            {profile?.id || "Verified"}
                        </dd>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800">
                        <dt className="text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400">
                            Member Since
                        </dt>
                        <dd className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                            {profile?.created_at
                                ? new Date(profile.created_at).toLocaleDateString("en-IN", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                  })
                                : "Active"}
                        </dd>
                    </div>

                    <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800">
                        <dt className="text-xs uppercase font-semibold text-zinc-500 dark:text-zinc-400">
                            Security Status
                        </dt>
                        <dd className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Supabase Auth &bull; RLS Protected
                        </dd>
                    </div>
                </dl>
            ) : (
                /* Edit Mode */
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="fullName"
                                className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1"
                            >
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="fullName"
                                name="fullName"
                                type="text"
                                required
                                defaultValue={currentName}
                                placeholder="e.g. Aarav Sharma"
                                className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="phone"
                                className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1"
                            >
                                Phone Number (India)
                            </label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                defaultValue={currentPhone}
                                placeholder="+91 98765 43210"
                                className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800">
                            <span className="text-xs font-semibold text-zinc-400 uppercase">Email Address (Managed by Auth)</span>
                            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 font-mono truncate">{email}</p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800">
                            <span className="text-xs font-semibold text-zinc-400 uppercase">User Role (Managed by Admin)</span>
                            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 uppercase font-bold">{currentRole}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <button
                            type="submit"
                            disabled={isPending}
                            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm"
                        >
                            {isPending ? (
                                <>
                                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>Saving to Supabase...</span>
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </button>

                        <button
                            type="button"
                            disabled={isPending}
                            onClick={() => {
                                setIsEditing(false);
                                setErrorMessage(null);
                            }}
                            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            )}

            {/* Bottom Footer: Sign Out Action */}
            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                <span>DineAura Profile &bull; PostgreSQL Protected</span>

                <form action={signOutAction}>
                    <button
                        type="submit"
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-950/80 border border-red-200 dark:border-red-900/60 transition-colors"
                    >
                        Sign Out
                    </button>
                </form>
            </div>
        </div>
    );
}
