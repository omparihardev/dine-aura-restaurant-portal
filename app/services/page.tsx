import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/portal/portal-shell";
import type { UserProfile } from "@/lib/types/portal";

export const metadata = {
    title: "Our Services | DineAura",
    description: "Explore the dining directory services offered by DineAura.",
};

const SERVICES = [
    {
        icon: "🔍",
        badge: "Discovery Engine",
        title: "Restaurant Discovery & Search",
        description:
            "Fast, multi-filter search engine allowing foodies to locate active dining venues across major Indian metropolitan areas and regional food capitals.",
    },
    {
        icon: "🍛",
        badge: "Curated Heritage",
        title: "Regional Cuisine Classification",
        description:
            "Curated taxonomy highlighting 10+ distinct Indian regional cuisines including Mughlai, Punjabi, South Indian, Gujarati, Rajasthani, Bengali, and Street Food.",
    },
    {
        icon: "📍",
        badge: "Precision Coordinates",
        title: "City & Geo-Location Filtering",
        description:
            "Tailored search parameters across India's top dining hubs including Bengaluru, Mumbai, Delhi NCR, Hyderabad, Pune, Kolkata, and Jaipur.",
    },
    {
        icon: "🛡️",
        badge: "Verified Security",
        title: "Verified Venue Data Management",
        description:
            "Structured repository powered by Supabase with Row Level Security, preserving verified addresses, phone numbers, and operational statuses.",
    },
];

export default async function ServicesPage() {
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
                        <span>📋</span>
                        <span>Portal Services &bull; BRD Standard</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                        DineAura Platform Services
                    </h1>
                    <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed text-balance">
                        DineAura provides a standardized, responsive digital ecosystem designed to connect diners with authentic Indian dining establishments.
                    </p>
                </div>

                {/* Service Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                    {SERVICES.map((service) => (
                        <div
                            key={service.title}
                            className="group relative p-7 sm:p-8 rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-amber-500/40 dark:hover:border-amber-500/30 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-300 flex flex-col justify-between space-y-5"
                        >
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/25 flex items-center justify-center text-2xl shadow-xs group-hover:scale-110 group-hover:border-amber-500/40 transition-transform duration-300">
                                        <span>{service.icon}</span>
                                    </div>
                                    <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-500/20 dark:border-amber-900/50">
                                        {service.badge}
                                    </span>
                                </div>

                                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                    {service.title}
                                </h2>

                                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                    {service.description}
                                </p>
                            </div>

                            <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                                <span className="font-medium">Active Portal Pillar</span>
                                <span className="text-amber-600 dark:text-amber-400 font-bold group-hover:translate-x-1 transition-transform">&rarr;</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </PortalShell>
    );
}
