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
            <div className="space-y-12 max-w-5xl mx-auto py-2 sm:py-4">
                {/* Header */}
                <div className="space-y-3.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-500/20 dark:border-amber-900/60 w-fit shadow-2xs">
                        <span>🇮🇳</span>
                        <span>About DineAura &bull; India&apos;s Restaurant Portal</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                        Connecting India Through Culinary Excellence
                    </h1>
                    <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed text-balance">
                        DineAura is a specialized restaurant discovery platform crafted specifically for India&apos;s vibrant culinary landscape. Our mission is to celebrate authentic heritage cuisines, regional delicacies, and contemporary dining across Indian cities.
                    </p>
                </div>

                {/* Core Pillars Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                    <div className="group p-7 rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs hover:border-amber-500/40 dark:hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 space-y-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/25 flex items-center justify-center text-2xl shadow-xs group-hover:scale-110 group-hover:border-amber-500/40 transition-transform duration-300">
                            <span>🍛</span>
                        </div>
                        <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            Regional Authenticity
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            From Awadhi dum biryanis and authentic Chettinad curries to crisp dosas and Rajasthani dal baati churma, we highlight true regional cooking.
                        </p>
                    </div>

                    <div className="group p-7 rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs hover:border-amber-500/40 dark:hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 space-y-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/25 flex items-center justify-center text-2xl shadow-xs group-hover:scale-110 group-hover:border-amber-500/40 transition-transform duration-300">
                            <span>🛡️</span>
                        </div>
                        <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            Verified Directory
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            Every restaurant listed in our directory is verified for authentic location details, active operating status, and transparent pricing in INR (₹).
                        </p>
                    </div>

                    <div className="group p-7 rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs hover:border-amber-500/40 dark:hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 space-y-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/25 flex items-center justify-center text-2xl shadow-xs group-hover:scale-110 group-hover:border-amber-500/40 transition-transform duration-300">
                            <span>⚡</span>
                        </div>
                        <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            Secure Technology
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            Built with Next.js App Router and Supabase PostgreSQL with Row Level Security (RLS) to ensure blazing speed and data protection.
                        </p>
                    </div>
                </div>

                {/* Bottom Callout */}
                <div className="p-8 sm:p-10 rounded-3xl bg-zinc-900 text-white border border-zinc-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="space-y-1 text-center sm:text-left">
                        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                            Ready to Explore Dining in Your City?
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-400">
                            Discover verified restaurant venues across India with DineAura.
                        </p>
                    </div>
                    <Link
                        href="/#discover"
                        className="px-6 py-3.5 rounded-xl font-bold text-xs sm:text-sm bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 transition-all whitespace-nowrap cursor-pointer active:scale-95"
                    >
                        Browse Restaurants &rarr;
                    </Link>
                </div>
            </div>
        </PortalShell>
    );
}
