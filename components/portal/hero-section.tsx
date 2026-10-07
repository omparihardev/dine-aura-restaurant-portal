import Link from "next/link";
import Image from "next/image";

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
        <section className="relative rounded-3xl lg:rounded-[2.5rem] border border-zinc-800/60 shadow-2xl overflow-hidden flex flex-col justify-between text-white p-5 sm:p-8 lg:p-12 xl:p-14 lg:min-h-[calc(100vh-9.5rem)] lg:max-h-[820px]">
            {/* Cinematic Full-Bleed Food Photography */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/hero-culinary.jpg"
                    alt="Authentic Indian Fine Dining & Traditional Regional Cuisine"
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 95vw, 1280px"
                    className="object-cover object-[center_42%] lg:object-[center_38%] transition-transform duration-1000 ease-out hover:scale-[1.02]"
                />

                {/* Dark Vignette & Gradient Overlays for Maximum Readability */}
                {/* Horizontal gradient: deep black on the left for text contrast, softening to reveal the feast on the right */}
                <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/85 to-zinc-950/40 lg:from-zinc-950/92 lg:via-zinc-950/70 lg:to-black/35" />

                {/* Vertical gradient: ground the statistics and discovery cue at the bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/95 via-zinc-950/40 to-transparent" />

                {/* Subtle amber atmospheric tint matching DineAura branding */}
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-950/30 via-transparent to-orange-950/15 mix-blend-multiply pointer-events-none" />

                {/* Ambient Soft Glow */}
                <div
                    className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none"
                    aria-hidden="true"
                />
            </div>

            {/* Top Bar: Brand Badge & Live Verification Pill */}
            <div className="relative z-10 flex items-center justify-between gap-2 sm:gap-4">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold bg-white/10 text-white border border-white/15 backdrop-blur-md shadow-sm">
                    <span className="text-xs sm:text-sm">🇮🇳</span>
                    <span className="tracking-wide">India&apos;s Dedicated Restaurant Portal</span>
                </div>

                <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-white/15 backdrop-blur-md text-[11px] text-white/90">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-semibold text-amber-200">Live Directory</span>
                    <span className="text-white/40">•</span>
                    <span className="text-white/80">Handcrafted &amp; Verified</span>
                </div>
            </div>

            {/* Center Content: Main Heading, Description, and CTAs */}
            <div className="relative z-10 my-auto py-5 sm:py-8 lg:py-10 max-w-3xl space-y-4 sm:space-y-6 text-left">
                <h1 className="text-2xl sm:text-4xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-white leading-[1.12] sm:leading-[1.08] drop-shadow-sm">
                    Discover India&apos;s{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-200 to-orange-300">
                        Authentic Dining
                    </span>
                    <br className="hidden sm:inline" /> &amp; Culinary Heritage
                </h1>

                <p className="text-xs sm:text-base lg:text-lg text-zinc-200/90 max-w-2xl font-normal leading-relaxed text-balance">
                    From royal Mughlai biryanis and authentic Bengaluru dosas to rich Rajasthani thalis and vibrant street food. DineAura is your trusted gateway to verified dining across India.
                </p>

                {/* Primary and Secondary CTAs */}
                <div className="pt-1 sm:pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
                    <Link
                        href="/#discover"
                        className="inline-flex items-center gap-2 sm:gap-2.5 px-4.5 py-2.5 sm:px-6 sm:py-3.5 rounded-xl font-bold text-xs sm:text-base bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-200 active:scale-95 group cursor-pointer"
                    >
                        <span>Explore Restaurants</span>
                        <span className="transition-transform duration-200 group-hover:translate-x-1">&rarr;</span>
                    </Link>

                    <Link
                        href="/categories"
                        className="inline-flex items-center gap-2 px-4.5 py-2.5 sm:px-6 sm:py-3.5 rounded-xl font-semibold text-xs sm:text-base bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition-all duration-200 active:scale-95 cursor-pointer"
                    >
                        Browse Cuisines
                    </Link>
                </div>
            </div>

            {/* Bottom Bar: Live Statistics & Discovery Transition Cue */}
            <div className="relative z-10 pt-5 sm:pt-6 mt-6 sm:mt-8 border-t border-white/15 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 sm:gap-6">
                {/* Genuine Metrics backed strictly by Supabase - Clean 3-column compact layout on mobile, horizontal on sm+ */}
                <div className="w-full sm:w-auto">
                    {hasLiveStats ? (
                        <div className="grid grid-cols-3 gap-2 text-center sm:text-left sm:flex sm:items-center sm:gap-8 lg:gap-10">
                            <div className="flex flex-col items-center sm:items-start">
                                <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight">
                                    {stats!.totalRestaurants}
                                </p>
                                <p className="text-[10px] sm:text-xs uppercase tracking-wider text-amber-300 font-medium mt-0.5 leading-tight">
                                    Active Restaurants
                                </p>
                            </div>
                            <div className="h-8 w-px bg-white/15 hidden sm:block" />
                            <div className="flex flex-col items-center sm:items-start">
                                <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight">
                                    {stats!.totalCities}
                                </p>
                                <p className="text-[10px] sm:text-xs uppercase tracking-wider text-amber-300 font-medium mt-0.5 leading-tight">
                                    Cities Covered
                                </p>
                            </div>
                            <div className="h-8 w-px bg-white/15 hidden sm:block" />
                            <div className="flex flex-col items-center sm:items-start">
                                <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-tight">
                                    {stats!.totalCategories}
                                </p>
                                <p className="text-[10px] sm:text-xs uppercase tracking-wider text-amber-300 font-medium mt-0.5 leading-tight">
                                    Regional Cuisines
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-2 text-center sm:text-left sm:flex sm:items-center sm:gap-6">
                            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-[10px] sm:text-sm text-zinc-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                <span>Verified Listings</span>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-[10px] sm:text-sm text-zinc-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                <span>Regional Cuisines</span>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-[10px] sm:text-sm text-zinc-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                                <span>Direct Discovery</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Discovery Transition Indicator (In normal content flow below stats on mobile; aligned right on sm+) */}
                <div className="flex items-center justify-center sm:justify-end pt-1 sm:pt-0">
                    <Link
                        href="/#discover"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 border border-white/15 backdrop-blur-md text-xs font-medium text-zinc-200 hover:text-white transition-all duration-200 group cursor-pointer"
                    >
                        <span className="tracking-wide text-[11px] sm:text-xs">Discover restaurants</span>
                        <span className="text-amber-400 font-bold group-hover:translate-y-0.5 transition-transform duration-200">↓</span>
                    </Link>
                </div>
            </div>
        </section>
    );
}
