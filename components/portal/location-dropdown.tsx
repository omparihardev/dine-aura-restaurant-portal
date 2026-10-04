"use client";

import { useState, useRef, useEffect } from "react";
import { useLocation } from "./location-context";

interface LocationDropdownProps {
    variant?: "navbar" | "sidebar" | "discovery";
    className?: string;
    align?: "left" | "right";
}

export function LocationDropdown({
    variant = "navbar",
    className = "",
    align = "left",
}: LocationDropdownProps) {
    const {
        selectedCity,
        locationMode,
        detectedCityName,
        displayLocation,
        isLocating,
        availableCities,
        setSelectedCity,
        requestCurrentLocation,
    } = useLocation();

    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("keydown", handleKeyDown);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isOpen]);

    // Format current location label: "📍 Near You · <City>" or fallback "📍 Near You"
    const liveCityLabel =
        locationMode === "current"
            ? detectedCityName
                ? `Near You · ${detectedCityName}`
                : "Near You"
            : null;

    // Display text for button
    const buttonLabel = isLocating
        ? "Detecting location..."
        : locationMode === "current"
        ? `📍 ${liveCityLabel}`
        : locationMode === "all"
        ? "🌐 All Metros & Cities"
        : `📍 ${selectedCity}`;

    // Base button styles per variant
    const getButtonStyles = () => {
        if (variant === "navbar") {
            return `flex items-center justify-between gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all shadow-sm text-xs font-bold cursor-pointer select-none max-w-[170px] sm:max-w-[210px] ${
                locationMode === "current"
                    ? "bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 hover:bg-emerald-100/70"
                    : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200"
            }`;
        }
        if (variant === "sidebar") {
            return `w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border flex items-center justify-between text-left transition-colors cursor-pointer select-none ${
                locationMode === "current"
                    ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100"
                    : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            }`;
        }
        // discovery variant
        return `w-full px-3 py-2 text-xs sm:text-sm rounded-xl border font-medium flex items-center justify-between text-left transition-colors cursor-pointer select-none shadow-sm ${
            locationMode === "current"
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                : "bg-zinc-50 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        }`;
    };

    return (
        <div ref={dropdownRef} className={`relative inline-block ${variant !== "navbar" ? "w-full" : ""} ${className}`}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label="Location selector"
                title={`Active location: ${displayLocation}`}
                className={getButtonStyles()}
            >
                <div className="flex items-center gap-1.5 truncate">
                    {isLocating ? (
                        <span className="w-3 h-3 rounded-full border-2 border-amber-600 border-t-transparent animate-spin inline-block flex-shrink-0" />
                    ) : locationMode === "current" ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0" aria-hidden="true">
                            📍
                        </span>
                    ) : locationMode === "all" ? (
                        <span className="text-amber-600 dark:text-amber-400 font-bold flex-shrink-0" aria-hidden="true">
                            🌐
                        </span>
                    ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-bold flex-shrink-0" aria-hidden="true">
                            📍
                        </span>
                    )}
                    <span className="truncate">
                        {isLocating
                            ? "Detecting location..."
                            : locationMode === "current"
                            ? liveCityLabel
                            : locationMode === "all"
                            ? "All Metros & Cities"
                            : selectedCity}
                    </span>
                </div>
                <svg
                    className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 flex-shrink-0 ${
                        isOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu Popup (Consistent Dark Theme, No Empty White Blocks) */}
            {isOpen && (
                <div
                    role="listbox"
                    aria-label="Select location"
                    className={`absolute mt-1.5 w-64 sm:w-72 bg-zinc-900 border border-zinc-700/80 text-zinc-100 shadow-2xl rounded-2xl p-2 z-50 animate-in fade-in slide-in-from-top-1 ring-1 ring-black/40 ${
                        align === "right" ? "right-0" : "left-0"
                    }`}
                >
                    {/* SECTION 1: GPS Options */}
                    <div className="space-y-1">
                        <button
                            type="button"
                            role="option"
                            aria-selected={locationMode === "current"}
                            onClick={() => {
                                requestCurrentLocation();
                                setIsOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-amber-400 hover:bg-zinc-800 transition-colors flex items-center justify-between group cursor-pointer"
                        >
                            <span className="flex items-center gap-2">
                                <span>📍</span>
                                <span>Use My Current Location</span>
                            </span>
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                GPS
                            </span>
                        </button>

                        {/* Active GPS status option if current location is active */}
                        {locationMode === "current" && (
                            <button
                                type="button"
                                role="option"
                                aria-selected={true}
                                onClick={() => setIsOpen(false)}
                                className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 transition-colors flex items-center justify-between cursor-pointer"
                            >
                                <span className="flex items-center gap-2 truncate">
                                    <span>📍</span>
                                    <span className="truncate">Near You · {detectedCityName || "Live"}</span>
                                </span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex-shrink-0">
                                    ✓ Active
                                </span>
                            </button>
                        )}
                    </div>

                    {/* Proper CSS Divider (No empty options or whitespace) */}
                    <div className="my-2 border-t border-zinc-800" />

                    {/* SECTION 2: All Metros & Cities */}
                    <div className="space-y-1">
                        <button
                            type="button"
                            role="option"
                            aria-selected={locationMode === "all"}
                            onClick={() => {
                                setSelectedCity("All Metros & Cities");
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-between cursor-pointer ${
                                locationMode === "all"
                                    ? "bg-amber-950/60 border border-amber-800/80 text-amber-300"
                                    : "text-zinc-200 hover:bg-zinc-800 hover:text-white"
                            }`}
                        >
                            <span className="flex items-center gap-2">
                                <span>🌐</span>
                                <span>All Metros &amp; Cities</span>
                            </span>
                            {locationMode === "all" && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                    ✓ Active
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Proper Section Heading */}
                    <div className="px-3 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Popular Metros &amp; Cities
                    </div>

                    {/* SECTION 3: City List (Scrollable, consistent dark theme) */}
                    <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin scrollbar-thumb-zinc-700">
                        {availableCities
                            .filter((c) => c !== "All Metros & Cities")
                            .map((city) => {
                                const isSelected = locationMode === "city" && selectedCity === city;
                                return (
                                    <button
                                        key={city}
                                        type="button"
                                        role="option"
                                        aria-selected={isSelected}
                                        onClick={() => {
                                            setSelectedCity(city);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                                            isSelected
                                                ? "bg-amber-950/60 border border-amber-800/80 text-amber-300 font-bold"
                                                : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                                        }`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <span>📍</span>
                                            <span>{city}</span>
                                        </span>
                                        {isSelected && (
                                            <span className="text-[10px] font-bold text-amber-400">
                                                ✓
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                    </div>
                </div>
            )}
        </div>
    );
}
