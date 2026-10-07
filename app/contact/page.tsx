import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/portal/portal-shell";
import type { UserProfile } from "@/lib/types/portal";

export const metadata = {
    title: "Contact Us | DineAura",
    description: "Get in touch with the DineAura restaurant portal team.",
};

export default async function ContactPage() {
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
                <div className="space-y-3.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-500/20 dark:border-amber-900/60 w-fit shadow-2xs">
                        <span>📞</span>
                        <span>Contact &bull; Support &bull; Inquiries</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                        Get in Touch with DineAura
                    </h1>
                    <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed text-balance">
                        Have questions about restaurant listings, portal features, or account management? Reach out to our India support operations.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Contact Details */}
                    <div className="space-y-4">
                        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs hover:border-amber-500/30 transition-all space-y-2">
                            <h2 className="text-[11px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400">
                                Support Helpline
                            </h2>
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                +91 80 4000 8900
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Mon - Sat &bull; 9:00 AM - 7:00 PM IST</p>
                        </div>

                        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs hover:border-amber-500/30 transition-all space-y-2">
                            <h2 className="text-[11px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400">
                                Official Email
                            </h2>
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                support@dineaura.in
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">General &amp; Restaurant Inquiries</p>
                        </div>

                        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs hover:border-amber-500/30 transition-all space-y-2">
                            <h2 className="text-[11px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400">
                                Corporate Office
                            </h2>
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                DineAura Technologies Pvt. Ltd.
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                Indiranagar 100 Feet Road, Bengaluru, Karnataka 560038, India
                            </p>
                        </div>
                    </div>

                    {/* Contact Inquiry Form */}
                    <div className="md:col-span-2 p-7 sm:p-8 rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm space-y-5">
                        <h2 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                            Send us a Message
                        </h2>
                        <form className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="name" className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                                        Your Name
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        placeholder="e.g. Priya Sharma"
                                        defaultValue={profile?.full_name || ""}
                                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                                        Email Address
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        defaultValue={user?.email || ""}
                                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="subject" className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                                    Subject
                                </label>
                                <input
                                    id="subject"
                                    type="text"
                                    placeholder="Inquiry regarding restaurant listing or account"
                                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                                />
                            </div>

                            <div>
                                <label htmlFor="message" className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                                    Message
                                </label>
                                <textarea
                                    id="message"
                                    rows={4}
                                    placeholder="Write your message here..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                                />
                            </div>

                            <button
                                type="button"
                                className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
                            >
                                Submit Inquiry
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </PortalShell>
    );
}
