import { createClient } from "@/lib/supabase/server";
import { PortalShell } from "@/components/portal/portal-shell";
import type { UserProfile, Category } from "@/lib/types/portal";
import Link from "next/link";

export const metadata = {
    title: "Regional Indian Cuisines | DineAura",
    description: "Explore the 10+ authentic Indian culinary categories curated in DineAura.",
};

export default async function CategoriesPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data: profile } = user
        ? await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<UserProfile>()
        : { data: null };

    // Fetch real categories from Supabase public.categories table
    const { data: categories, error } = await supabase
        .from("categories")
        .select("id, name, description, created_at")
        .order("name", { ascending: true });

    return (
        <PortalShell user={user} profile={profile}>
            <div className="space-y-12 max-w-5xl mx-auto py-2 sm:py-4">
                <div className="space-y-3.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-500/20 dark:border-amber-900/60 w-fit shadow-2xs">
                        <span>🍱</span>
                        <span>Seeded Categories &bull; Supabase Database</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                        Regional Indian Cuisines
                    </h1>
                    <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed text-balance">
                        India is a land of vibrant culinary traditions. Explore the verified regional cuisine classifications stored in our database.
                    </p>
                </div>

                {error && (
                    <div
                        role="alert"
                        className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300 text-sm"
                    >
                        Error loading categories: {error.message}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categories && categories.length > 0 ? (
                        categories.map((cat: Category) => (
                            <div
                                key={cat.id}
                                className="group p-6 rounded-2xl bg-white dark:bg-zinc-900/70 border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-500/40 dark:hover:border-amber-500/30 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300"
                            >
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                            {cat.name}
                                        </h2>
                                        <span className="w-2 h-2 rounded-full bg-amber-500 group-hover:scale-125 transition-transform" />
                                    </div>
                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                        {cat.description || "Authentic regional Indian cooking and traditional specialties."}
                                    </p>
                                </div>

                                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                                    <Link
                                        href={`/?cuisine=${encodeURIComponent(cat.name)}#discover`}
                                        className="text-xs font-semibold text-amber-600 dark:text-amber-400 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1 cursor-pointer"
                                    >
                                        <span>View restaurants</span>
                                        <span>&rarr;</span>
                                    </Link>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full p-12 text-center bg-white dark:bg-zinc-900/70 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                            <p className="text-sm text-zinc-500">No categories found in database.</p>
                        </div>
                    )}
                </div>
            </div>
        </PortalShell>
    );
}
