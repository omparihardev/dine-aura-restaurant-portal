"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";

export interface CityComboboxProps {
    value: string;
    onChange: (city: string) => void;
    availableCities: string[];
    name?: string;
    id?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    className?: string;
    error?: string | null;
}

export function CityCombobox({
    value,
    onChange,
    availableCities,
    name = "city",
    id = "city",
    placeholder = "Select a city...",
    required = false,
    disabled = false,
    className = "",
    error = null,
}: CityComboboxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(-1);

    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const triggerButtonRef = useRef<HTMLButtonElement>(null);
    const listboxRef = useRef<HTMLDivElement>(null);

    // Filter cities based on search query
    const filteredCities = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return availableCities;
        return availableCities.filter((city) =>
            city.toLowerCase().includes(query)
        );
    }, [availableCities, searchQuery]);

    // Handle outside click & escape key
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape" && isOpen) {
                setIsOpen(false);
                triggerButtonRef.current?.focus();
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

    // Auto-focus search input when opened
    useEffect(() => {
        if (isOpen) {
            setSearchQuery("");
            setActiveIndex(-1);
            // Focus search input on next tick
            requestAnimationFrame(() => {
                searchInputRef.current?.focus();
            });
        }
    }, [isOpen]);

    // Scroll active item into view
    useEffect(() => {
        if (activeIndex >= 0 && listboxRef.current) {
            const activeElement = listboxRef.current.children[activeIndex] as HTMLElement;
            if (activeElement && typeof activeElement.scrollIntoView === "function") {
                activeElement.scrollIntoView({ block: "nearest" });
            }
        }
    }, [activeIndex]);

    function handleSelectCity(city: string) {
        onChange(city);
        setIsOpen(false);
        setSearchQuery("");
        triggerButtonRef.current?.focus();
    }

    function handleTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
        if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsOpen(true);
        }
    }

    function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((prev) =>
                prev < filteredCities.length - 1 ? prev + 1 : 0
            );
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((prev) =>
                prev > 0 ? prev - 1 : filteredCities.length - 1
            );
        } else if (event.key === "Enter") {
            event.preventDefault();
            if (activeIndex >= 0 && activeIndex < filteredCities.length) {
                handleSelectCity(filteredCities[activeIndex]);
            } else if (filteredCities.length === 1) {
                handleSelectCity(filteredCities[0]);
            }
        } else if (event.key === "Tab") {
            setIsOpen(false);
        }
    }

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Hidden Input to capture form data cleanly for FormData and server actions */}
            <input
                type="hidden"
                id={id}
                name={name}
                value={value}
                data-testid="city-hidden-input"
            />

            {/* Trigger Button: shows [ Select a city... ▼ ] or [ 📍 Bengaluru ▼ ] */}
            <button
                ref={triggerButtonRef}
                type="button"
                id={`${id}-trigger`}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={`${id}-listbox`}
                aria-label={value ? `Selected city: ${value}` : "Select a city"}
                disabled={disabled}
                onClick={() => setIsOpen((prev) => !prev)}
                onKeyDown={handleTriggerKeyDown}
                className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border ${
                    error
                        ? "border-red-500 focus:ring-red-500"
                        : "border-zinc-300 dark:border-zinc-700 focus:ring-amber-500"
                } text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 flex items-center justify-between transition-colors cursor-pointer select-none text-left disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                <div className="flex items-center gap-1.5 truncate">
                    {value ? (
                        <>
                            <span className="text-amber-600 dark:text-amber-400 font-bold flex-shrink-0" aria-hidden="true">
                                📍
                            </span>
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                {value}
                            </span>
                        </>
                    ) : (
                        <span className="text-zinc-400 dark:text-zinc-500 truncate">
                            {placeholder}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <svg
                        className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </div>
            </button>

            {/* Dropdown Popup Menu */}
            {isOpen && (
                <div
                    id={`${id}-dropdown`}
                    className="absolute left-0 top-full mt-1.5 w-full bg-zinc-900 border border-zinc-700/80 text-zinc-100 shadow-2xl rounded-2xl p-2 z-50 animate-in fade-in slide-in-from-top-1 ring-1 ring-black/40"
                >
                    {/* Search Input Box */}
                    <div className="relative mb-2">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs pointer-events-none select-none">
                            🔍
                        </span>
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setActiveIndex(0);
                            }}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="Search city (e.g. Bengaluru, Rewa)..."
                            aria-label="Search city"
                            className="w-full pl-8 pr-8 py-1.5 text-xs rounded-xl bg-zinc-800/90 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery("");
                                    setActiveIndex(-1);
                                    searchInputRef.current?.focus();
                                }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 text-xs p-1"
                                aria-label="Clear search"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Section Header */}
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                        <span>Available Cities</span>
                        <span>{filteredCities.length}</span>
                    </div>

                    {/* Options List */}
                    <div
                        ref={listboxRef}
                        id={`${id}-listbox`}
                        role="listbox"
                        aria-label="Cities list"
                        className="max-h-52 overflow-y-auto space-y-0.5 pr-1 scrollbar-thin scrollbar-thumb-zinc-700"
                    >
                        {filteredCities.length > 0 ? (
                            filteredCities.map((city, index) => {
                                const isSelected = value.toLowerCase() === city.toLowerCase();
                                const isKeyboardActive = index === activeIndex;

                                return (
                                    <button
                                        key={city}
                                        type="button"
                                        role="option"
                                        aria-selected={isSelected}
                                        onClick={() => handleSelectCity(city)}
                                        onMouseEnter={() => setActiveIndex(index)}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                                            isSelected
                                                ? "bg-amber-950/60 border border-amber-800/80 text-amber-300 font-bold"
                                                : isKeyboardActive
                                                ? "bg-zinc-800 text-white"
                                                : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                                        }`}
                                    >
                                        <span className="flex items-center gap-2 truncate">
                                            <span className="text-amber-500 flex-shrink-0">📍</span>
                                            <span className="truncate">{city}</span>
                                        </span>
                                        {isSelected && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex-shrink-0">
                                                ✓ Selected
                                            </span>
                                        )}
                                    </button>
                                );
                            })
                        ) : (
                            <div className="py-6 text-center text-xs text-zinc-400 font-medium">
                                No cities found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
