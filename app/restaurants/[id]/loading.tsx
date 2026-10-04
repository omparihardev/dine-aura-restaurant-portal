export default function RestaurantLoading() {
    return (
        <div className="space-y-8 max-w-7xl mx-auto animate-pulse p-4 sm:p-6 lg:p-8">
            {/* Top Breadcrumbs Skeleton */}
            <div className="flex items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <div className="flex items-center gap-2">
                    <div className="w-16 h-4 rounded-md bg-zinc-200 dark:bg-zinc-800" />
                    <span className="text-zinc-300 dark:text-zinc-700">/</span>
                    <div className="w-24 h-4 rounded-md bg-zinc-200 dark:bg-zinc-800" />
                    <span className="text-zinc-300 dark:text-zinc-700">/</span>
                    <div className="w-32 h-4 rounded-md bg-zinc-200 dark:bg-zinc-800" />
                </div>
                <div className="w-36 h-8 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
            </div>

            {/* Hero Banner Skeleton */}
            <div className="relative w-full h-72 sm:h-96 rounded-3xl bg-zinc-200 dark:bg-zinc-850 overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between p-6 sm:p-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-28 h-6 rounded-full bg-zinc-300 dark:bg-zinc-800" />
                        <div className="w-24 h-6 rounded-full bg-zinc-300 dark:bg-zinc-800" />
                    </div>
                    <div className="w-20 h-6 rounded-full bg-zinc-300 dark:bg-zinc-800" />
                </div>

                <div className="space-y-3 max-w-xl">
                    <div className="w-36 h-4 rounded-full bg-zinc-300 dark:bg-zinc-800" />
                    <div className="w-3/4 h-10 rounded-2xl bg-zinc-300 dark:bg-zinc-800" />
                    <div className="w-1/2 h-5 rounded-lg bg-zinc-300 dark:bg-zinc-800" />
                </div>
            </div>

            {/* Main Content Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
                        <div className="w-48 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                        <div className="space-y-2">
                            <div className="w-full h-4 rounded bg-zinc-100 dark:bg-zinc-800" />
                            <div className="w-5/6 h-4 rounded bg-zinc-100 dark:bg-zinc-800" />
                            <div className="w-4/6 h-4 rounded bg-zinc-100 dark:bg-zinc-800" />
                        </div>
                    </div>

                    <div className="p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
                        <div className="w-40 h-6 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
                            <div className="h-24 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
                        <div className="w-32 h-4 rounded bg-zinc-200 dark:bg-zinc-800" />
                        <div className="w-44 h-6 rounded bg-zinc-200 dark:bg-zinc-800" />
                        <div className="h-12 rounded-2xl bg-amber-200/50 dark:bg-amber-950/40" />
                        <div className="h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
                    </div>
                </div>
            </div>
        </div>
    );
}
