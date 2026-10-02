import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/portal/portal-shell";
import type { UserProfile } from "@/lib/types/portal";
import Link from "next/link";

export const metadata = {
    title: "Help & Support | DineAura",
    description: "Frequently asked questions and support for the DineAura restaurant portal.",
};

const FAQS = [
    {
        q: "What is DineAura?",
        a: "DineAura is a dedicated India-focused restaurant directory portal designed to help foodies discover authentic regional cuisines, verify venue details, and explore top-rated dining spots across Indian cities.",
    },
    {
        q: "How are restaurants verified on DineAura?",
        a: "All restaurant listings are curated in our Supabase database with active location parameters, addresses, contact details, and operational statuses.",
    },
    {
        q: "Are the prices listed in Indian Rupee (₹)?",
        a: "Yes. All price ranges, estimates for two, and restaurant costs are standard in INR (₹) inclusive of applicable taxes where noted.",
    },
    {
        q: "How do I update my profile information?",
        a: "Navigate to the Profile page via the top navigation bar or left sidebar to review your current details.",
    },
];

export default async function HelpPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data: profile } = user
        ? await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<UserProfile>()
        : { data: null };

    return (
        <PortalShell user={user} profile={profile}>
            <div className="space-y-10 max-w-4xl mx-auto">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                        <span>❓</span>
                        <span>Help &amp; Support &bull; FAQ</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                        Frequently Asked Questions
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                        Find answers to common questions about using DineAura.
                    </p>
                </div>

                <div className="space-y-4">
                    {FAQS.map((faq) => (
                        <div
                            key={faq.q}
                            className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2"
                        >
                            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                {faq.q}
                            </h2>
                            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                {faq.a}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                            Need further assistance?
                        </h2>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                            Our team is available Mon-Sat, 9:00 AM - 7:00 PM IST.
                        </p>
                    </div>
                    <Link
                        href="/contact"
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors self-start sm:self-center"
                    >
                        Contact Support
                    </Link>
                </div>
            </div>
        </PortalShell>
    );
}
