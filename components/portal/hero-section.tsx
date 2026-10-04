import Link from "next/link";

interface HeroSectionProps {
    isLoggedIn?: boolean;
    stats?: {
        totalRestaurants: number;
        totalCities: number;
        totalCategories: number;
    };
}

export function HeroSection({ isLoggedIn = false, stats }: HeroSectionProps) {
    const hasLiveStats = Boolean(stats && stats.totalRestaurants > 0);

    return (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600 via-amber-700 to-orange-700 text-white shadow-xl p-8 sm:p-12 lg:p-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                {/* Left Column: Heading, Description, CTAs & Genuine Value Badges */}
                <div className="lg:col-span-7 space-y-6 text-left">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-md shadow-sm">
                        <span>🇮🇳</span>
                        <span>India&apos;s Dedicated Restaurant Portal</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
                        Discover India&apos;s <span className="text-amber-200">Authentic Dining</span> &amp; Culinary Heritage
                    </h1>

                    <p className="text-sm sm:text-base lg:text-lg text-white/90 max-w-xl leading-relaxed">
                        From royal Mughlai biryanis and authentic Bengaluru dosas to rich Rajasthani thalis and vibrant street food. DineAura is your trusted gateway to verified dining across India.
                    </p>

                    {/* Primary and Secondary CTAs */}
                    <div className="pt-2 flex flex-wrap items-center gap-4">
                        <Link
                            href="/#discover"
                            className="px-6 py-3.5 rounded-xl font-bold text-sm bg-white text-amber-800 hover:bg-amber-50 shadow-md hover:shadow-lg transition-all flex items-center gap-2 group cursor-pointer"
                        >
                            <span>Explore Restaurants</span>
                            <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                        </Link>

                        <Link
                            href="/categories"
                            className="px-6 py-3.5 rounded-xl font-semibold text-sm bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm transition-all cursor-pointer"
                        >
                            Browse Cuisines
                        </Link>
                    </div>

                    {/* Genuine Badges: strictly backed by Supabase or genuine platform pillars (No fake numbers) */}
                    <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-white/85 border-t border-white/15">
                        {hasLiveStats ? (
                            <>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-amber-300 font-extrabold">{stats!.totalRestaurants}</span>
                                    <span>Active Restaurants</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-amber-300 font-extrabold">{stats!.totalCities}</span>
                                    <span>Cities Covered</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-amber-300 font-extrabold">{stats!.totalCategories}</span>
                                    <span>Regional Cuisines</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-amber-300">✨</span>
                                    <span>Verified Listings</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-amber-300">🍱</span>
                                    <span>Regional Cuisines</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-amber-300">🔍</span>
                                    <span>Direct Discovery</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Right Column: Premium DineAura Brand & Value Panel (No fabricated restaurant) */}
                <div className="lg:col-span-5 flex justify-center lg:justify-end">
                    <div className="relative w-full max-w-sm sm:max-w-md rounded-3xl bg-gradient-to-tr from-amber-950/70 via-amber-900/40 to-white/10 p-6 sm:p-8 backdrop-blur-md border border-white/20 flex flex-col justify-between shadow-2xl space-y-6">
                        {/* Panel Header */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-xl bg-amber-500/80 flex items-center justify-center text-sm shadow">
                                        🍽️
                                    </span>
                                    <span className="text-xs font-bold uppercase tracking-wider text-amber-200">
                                        DineAura Portal
                                    </span>
                                </div>
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/80 text-white flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    Live Directory
                                </span>
                            </div>

                            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
                                India&apos;s Restaurant Discovery
                            </h2>
                            <p className="mt-2 text-xs sm:text-sm text-white/80 leading-relaxed">
                                Discover authentic restaurants, regional cuisines, and local dining experiences through DineAura.
                            </p>
                        </div>

                        {/* 3 Core Value Items */}
                        <div className="space-y-3">
                            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 flex items-start gap-3 transition-colors hover:bg-white/15">
                                <div className="w-8 h-8 rounded-xl bg-amber-500/30 flex items-center justify-center text-base flex-shrink-0">
                                    📋
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white">Real Restaurant Listings</p>
                                    <p className="text-[11px] text-white/75 mt-0.5 leading-snug">
                                        Verified locations, contact numbers, and authentic menus from genuine venues.
                                    </p>
                                </div>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 flex items-start gap-3 transition-colors hover:bg-white/15">
                                <div className="w-8 h-8 rounded-xl bg-amber-500/30 flex items-center justify-center text-base flex-shrink-0">
                                    🍱
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white">Regional Cuisines</p>
                                    <p className="text-[11px] text-white/75 mt-0.5 leading-snug">
                                        Explore traditional flavours across North, South, East, and Western India.
                                    </p>
                                </div>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 flex items-start gap-3 transition-colors hover:bg-white/15">
                                <div className="w-8 h-8 rounded-xl bg-amber-500/30 flex items-center justify-center text-base flex-shrink-0">
                                    🔍
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-white">Direct Restaurant Discovery</p>
                                    <p className="text-[11px] text-white/75 mt-0.5 leading-snug">
                                        Filter by city or cuisine and discover your next memorable meal.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Live Supabase Statistics Counter (Only rendered if live data exists) */}
                        {hasLiveStats && (
                            <div className="pt-4 border-t border-white/15 grid grid-cols-3 gap-2 text-center">
                                <div className="p-2.5 rounded-xl bg-white/10 border border-white/10">
                                    <p className="text-base sm:text-lg font-extrabold text-white leading-tight">
                                        {stats!.totalRestaurants}
                                    </p>
                                    <p className="text-[10px] text-amber-200 uppercase font-semibold mt-0.5">
                                        Restaurants
                                    </p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-white/10 border border-white/10">
                                    <p className="text-base sm:text-lg font-extrabold text-white leading-tight">
                                        {stats!.totalCities}
                                    </p>
                                    <p className="text-[10px] text-amber-200 uppercase font-semibold mt-0.5">
                                        Cities
                                    </p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-white/10 border border-white/10">
                                    <p className="text-base sm:text-lg font-extrabold text-white leading-tight">
                                        {stats!.totalCategories}
                                    </p>
                                    <p className="text-[10px] text-amber-200 uppercase font-semibold mt-0.5">
                                        Cuisines
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Ambient Background Glow */}
            <div
                className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none"
                aria-hidden="true"
            />
        </section>
    );
}
