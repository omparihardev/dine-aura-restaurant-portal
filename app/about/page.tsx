import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/portal/portal-shell";
import type { UserProfile } from "@/lib/types/portal";
import Link from "next/link";

export const metadata = {
    title: "About Us | DineAura",
    description: "Learn more about DineAura, India's dedicated restaurant directory.",
};

export default async function AboutPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data: profile } = user
        ? await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<UserProfile>()
        : { data: null };

    return (
        <PortalShell user={user} profile={profile}>
            <div className="space-y-10 max-w-5xl mx-auto">
                {/* Header */}
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                        <span>🇮🇳</span>
                        <span>About DineAura &bull; India&apos;s Restaurant Portal</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                        Connecting India Through Culinary Excellence
                    </h1>
                    <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
                        DineAura is a specialized restaurant discovery platform crafted specifically for India&apos;s vibrant culinary landscape. Our mission is to celebrate authentic heritage cuisines, regional delicacies, and contemporary dining across Indian cities.
                    </p>
                </div>

                {/* Core Pillars Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
                        <span className="text-3xl">🍛</span>
                        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                            Regional Authenticity
                        </h2>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            From Awadhi dum biryanis and authentic Chettinad curries to crisp dosas and Rajasthani dal baati churma, we highlight true regional cooking.
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
                        <span className="text-3xl">🛡️</span>
                        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                            Verified Directory
                        </h2>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            Every restaurant listed in our directory is verified for authentic location details, active operating status, and transparent pricing in INR (₹).
                        </p>
                    </div>

                    <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
                        <span className="text-3xl">⚡</span>
                        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                            Secure Technology
                        </h2>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            Built with Next.js App Router and Supabase PostgreSQL with Row Level Security (RLS) to ensure blazing speed and data protection.
                        </p>
                    </div>
                </div>

                {/* Bottom Callout */}
                <div className="p-8 rounded-3xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="space-y-1 text-center sm:text-left">
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            Ready to Explore Dining in Your City?
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                            Discover verified restaurant venues across India with DineAura.
                        </p>
                    </div>
                    <Link
                        href="/#discover"
                        className="px-6 py-3 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow transition-all whitespace-nowrap"
                    >
                        Browse Restaurants &rarr;
                    </Link>
                </div>
            </div>
        </PortalShell>
    );
}
