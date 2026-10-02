import Link from "next/link";

interface HeroSectionProps {
    isLoggedIn?: boolean;
}

export function HeroSection({ isLoggedIn = false }: HeroSectionProps) {
    return (
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600 via-amber-700 to-orange-700 text-white shadow-xl p-8 sm:p-12 lg:p-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                {/* Left Column: Heading, Description & CTAs */}
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
                            href={isLoggedIn ? "/dashboard#discover" : "/#discover"}
                            className="px-6 py-3.5 rounded-xl font-bold text-sm bg-white text-amber-800 hover:bg-amber-50 shadow-md hover:shadow-lg transition-all flex items-center gap-2 group"
                        >
                            <span>Explore Restaurants</span>
                            <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                        </Link>

                        <Link
                            href="/categories"
                            className="px-6 py-3.5 rounded-xl font-semibold text-sm bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm transition-all"
                        >
                            Browse Cuisines
                        </Link>
                    </div>

                    {/* Trust badges */}
                    <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-white/80 border-t border-white/15">
                        <div className="flex items-center gap-1.5">
                            <span className="text-amber-300 font-bold">★ 4.5+</span>
                            <span>Curated Dining</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-amber-300 font-bold">10+</span>
                            <span>Regional Cuisines</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-amber-300 font-bold">₹ INR</span>
                            <span>Transparent Pricing</span>
                        </div>
                    </div>
                </div>

                {/* Right Column: Relevant Indian Restaurant / Food Visual */}
                <div className="lg:col-span-5 flex justify-center lg:justify-end">
                    <div className="relative w-full max-w-sm sm:max-w-md aspect-square rounded-3xl bg-gradient-to-tr from-amber-800/40 to-white/10 p-6 backdrop-blur-md border border-white/20 flex flex-col justify-between shadow-2xl">
                        {/* Visual Card Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 rounded-full bg-amber-500/80 flex items-center justify-center text-sm shadow">
                                    🍛
                                </span>
                                <div>
                                    <p className="text-xs font-bold leading-tight">Royal Indian Thali</p>
                                    <p className="text-[10px] text-white/70">Heritage Gastronomy</p>
                                </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/80 text-white">
                                Verified
                            </span>
                        </div>

                        {/* Central Food Visual Composition */}
                        <div className="my-auto py-6 flex flex-col items-center justify-center text-center">
                            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-amber-700 p-1 shadow-2xl flex items-center justify-center relative">
                                <div className="w-full h-full rounded-full bg-amber-950/80 flex items-center justify-center text-6xl sm:text-7xl shadow-inner select-none">
                                    🍱
                                </div>
                                <div className="absolute -top-2 -right-2 px-2.5 py-1 rounded-full bg-amber-300 text-amber-950 font-extrabold text-[11px] shadow-lg">
                                    ★ 4.9
                                </div>
                            </div>

                            <p className="mt-4 font-bold text-base text-white">
                                Grand Maharaja Feast
                            </p>
                            <p className="text-xs text-white/80 max-w-xs mt-1">
                                Mughlai Korma, Tandoori Naan, Dal Makhani &amp; Fragrant Pulao
                            </p>
                        </div>

                        {/* Visual Card Highlights */}
                        <div className="grid grid-cols-2 gap-2 text-center text-xs">
                            <div className="p-2 rounded-xl bg-white/10 border border-white/15">
                                <p className="text-[10px] text-white/70 uppercase">Cuisine Special</p>
                                <p className="font-bold text-white mt-0.5">North &amp; South</p>
                            </div>
                            <div className="p-2 rounded-xl bg-white/10 border border-white/15">
                                <p className="text-[10px] text-white/70 uppercase">Avg. Experience</p>
                                <p className="font-bold text-white mt-0.5">₹800 for two</p>
                            </div>
                        </div>
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
