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
        title: "Restaurant Discovery & Search",
        description:
            "Fast, multi-filter search engine allowing foodies to locate active dining venues across major Indian metropolitan areas and regional food capitals.",
    },
    {
        icon: "🍛",
        title: "Regional Cuisine Classification",
        description:
            "Curated taxonomy highlighting 10+ distinct Indian regional cuisines including Mughlai, Punjabi, South Indian, Gujarati, Rajasthani, Bengali, and Street Food.",
    },
    {
        icon: "📍",
        title: "City & Geo-Location Filtering",
        description:
            "Tailored search parameters across India's top dining hubs including Bengaluru, Mumbai, Delhi NCR, Hyderabad, Pune, Kolkata, and Jaipur.",
    },
    {
        icon: "🛡️",
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
            <div className="space-y-10 max-w-5xl mx-auto">
                <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                        <span>📋</span>
                        <span>Portal Services &bull; BRD Standard</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                        DineAura Platform Services
                    </h1>
                    <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
                        DineAura provides a standardized, responsive digital ecosystem designed to connect diners with authentic Indian dining establishments.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {SERVICES.map((service) => (
                        <div
                            key={service.title}
                            className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3"
                        >
                            <span className="text-3xl">{service.icon}</span>
                            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                                {service.title}
                            </h2>
                            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                {service.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </PortalShell>
    );
}
