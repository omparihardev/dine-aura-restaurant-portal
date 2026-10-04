"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { reverseGeocodeCity } from "@/lib/utils/geocoding";

export const DEFAULT_CITIES = [
    "All Metros & Cities",
    "Bengaluru",
    "Mumbai",
    "Delhi NCR",
    "Hyderabad",
    "Pune",
    "Kolkata",
    "Chennai",
    "Jaipur",
    "Ahmedabad",
    "Lucknow",
    "Bhopal",
    "Rewa",
];

export const CANONICAL_CITIES = DEFAULT_CITIES.filter((c) => c !== "All Metros & Cities");

export type LocationMode = "all" | "city" | "current";

export interface UserCoordinates {
    latitude: number;
    longitude: number;
}

/**
 * Normalizes city names, handles variations, and strips accidental trailing states or whitespace.
 */
export function normalizeCityName(city: string | null | undefined): string {
    if (!city) return "All Metros & Cities";
    const trimmed = city.trim();
    const lower = trimmed.toLowerCase();
    if (
        lower === "all cities" ||
        lower === "all metros & cities" ||
        lower === "all metros and cities" ||
        lower === "all" ||
        lower === ""
    ) {
        return "All Metros & Cities";
    }
    // If format is "City, State", extract just the city part
    if (trimmed.includes(",")) {
        return trimmed.split(",")[0].trim();
    }
    return trimmed;
}

/**
 * Robust case-insensitive city matcher with support for aliases (e.g. Bangalore / Bengaluru).
 */
export function isCityMatch(
    restaurantCity: string | null | undefined,
    selectedCity: string
): boolean {
    const normalizedSelected = normalizeCityName(selectedCity);
    if (normalizedSelected === "All Metros & Cities") {
        return true;
    }
    if (!restaurantCity) return false;
    const cleanRest = restaurantCity.trim().toLowerCase();
    const cleanSelected = normalizedSelected.toLowerCase();

    if (cleanRest === cleanSelected) return true;

    // Bangalore / Bengaluru equivalence
    if (
        (cleanSelected === "bengaluru" && cleanRest === "bangalore") ||
        (cleanSelected === "bangalore" && cleanRest === "bengaluru")
    ) {
        return true;
    }

    return false;
}

export interface LocationContextType {
    selectedCity: string;
    locationMode: LocationMode;
    userCoordinates: UserCoordinates | null;
    detectedCityName: string | null;
    displayLocation: string;
    isLocating: boolean;
    locationError: string | null;
    availableCities: string[];
    setSelectedCity: (city: string) => void;
    requestCurrentLocation: () => void;
    clearLocationError: () => void;
    setDynamicCities: (cities: string[]) => void;
    isCityMatch: (restaurantCity: string | null | undefined) => boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({
    children,
    initialCity,
}: {
    children: React.ReactNode;
    initialCity?: string;
}) {
    // Dynamic city options combining defaults and discovered database cities
    const [availableCities, setAvailableCities] = useState<string[]>(DEFAULT_CITIES);

    // Single source of truth for global location
    const [selectedCity, setSelectedCityState] = useState<string>(() => {
        if (initialCity) {
            return normalizeCityName(initialCity);
        }
        return "All Metros & Cities";
    });

    // Location mode: "all" | "city" | "current"
    const [locationMode, setLocationMode] = useState<LocationMode>(() => {
        if (initialCity && normalizeCityName(initialCity) !== "All Metros & Cities") {
            return "city";
        }
        return "all";
    });

    // In-memory GPS coordinates & detected city (NEVER persisted to DB, URL, or localStorage)
    const [userCoordinates, setUserCoordinates] = useState<UserCoordinates | null>(null);
    const [detectedCityName, setDetectedCityName] = useState<string | null>(null);
    const [isLocating, setIsLocating] = useState<boolean>(false);
    const [locationError, setLocationError] = useState<string | null>(null);

    // Register additional cities from Supabase restaurants
    const setDynamicCities = useCallback((cities: string[]) => {
        if (!cities || cities.length === 0) return;
        setAvailableCities((prev) => {
            const cleanNew = cities.map((c) => normalizeCityName(c)).filter(Boolean);
            const combined = Array.from(
                new Set([
                    "All Metros & Cities",
                    ...DEFAULT_CITIES.slice(1),
                    ...cleanNew.filter((c) => c !== "All Metros & Cities"),
                ])
            );
            // Only update if changed
            if (combined.length !== prev.length || combined.some((c, i) => c !== prev[i])) {
                return combined;
            }
            return prev;
        });
    }, []);

    // Clear location error
    const clearLocationError = useCallback(() => {
        setLocationError(null);
    }, []);

    // Auto-dismiss location error after 8 seconds
    useEffect(() => {
        if (locationError) {
            const timer = setTimeout(() => {
                setLocationError(null);
            }, 8000);
            return () => clearTimeout(timer);
        }
    }, [locationError]);

    // Request browser current location
    const requestCurrentLocation = useCallback(() => {
        if (typeof window === "undefined" || !("geolocation" in navigator)) {
            setLocationError("Your browser does not support geolocation. Choose a city manually.");
            return;
        }

        setIsLocating(true);
        setLocationError(null);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const coords = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                };
                setIsLocating(false);
                setLocationError(null);
                setUserCoordinates(coords);
                setLocationMode("current");

                // Privacy: Do NOT persist precise coordinates to URL or localStorage.
                // Remove ?city= parameter from URL so URL reflects current location mode cleanly.
                if (typeof window !== "undefined" && window.history.replaceState) {
                    const url = new URL(window.location.href);
                    url.searchParams.delete("city");
                    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
                }

                // Clear any manual city from localStorage so it doesn't conflict with Near You mode
                try {
                    localStorage.removeItem("dineaura_selected_city");
                } catch {
                    // Ignore storage quota or disabled errors
                }

                // Asynchronously reverse geocode without blocking discovery
                try {
                    const city = await reverseGeocodeCity(coords.latitude, coords.longitude);
                    if (city) {
                        setDetectedCityName(city);
                    }
                } catch {
                    // Graceful fallback to "Near You"
                }
            },
            (error) => {
                setIsLocating(false);
                let message = "Unable to determine your location. Choose a city manually.";
                if (error.code === error.PERMISSION_DENIED) {
                    message = "Location access was denied. Choose a city manually.";
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    message = "Location information is unavailable. Choose a city manually.";
                } else if (error.code === error.TIMEOUT) {
                    message = "Location request timed out. Choose a city manually.";
                }
                setLocationError(message);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    }, []);

    // Set selected city with localStorage & URL synchronization
    const setSelectedCity = useCallback((newCity: string) => {
        const normalized = normalizeCityName(newCity);
        setSelectedCityState(normalized);
        setLocationMode(normalized === "All Metros & Cities" ? "all" : "city");
        setUserCoordinates(null); // Clear precise GPS coordinates from memory
        setDetectedCityName(null); // Clear detected city name
        setIsLocating(false);
        setLocationError(null);

        // 1. Persist to localStorage (only manual city, NEVER GPS)
        try {
            if (normalized === "All Metros & Cities") {
                localStorage.removeItem("dineaura_selected_city");
            } else {
                localStorage.setItem("dineaura_selected_city", normalized);
            }
        } catch {
            // Ignore storage quota or disabled errors
        }

        // 2. Dispatch custom event for cross-component sync
        try {
            window.dispatchEvent(
                new CustomEvent("dineaura_city_changed", { detail: normalized })
            );
        } catch {
            // Ignore
        }

        // 3. Synchronize URL query parameter cleanly without full page reload
        if (typeof window !== "undefined" && window.history.replaceState) {
            const url = new URL(window.location.href);
            if (normalized === "All Metros & Cities") {
                url.searchParams.delete("city");
            } else {
                url.searchParams.set("city", normalized);
            }
            window.history.replaceState({}, "", url.pathname + url.search + url.hash);
        }
    }, []);

    // Track locationMode in ref to access inside window listeners without stale closures
    const locationModeRef = useRef<LocationMode>(locationMode);
    useEffect(() => {
        locationModeRef.current = locationMode;
    }, [locationMode]);

    // Initial sync from URL search param or localStorage
    useEffect(() => {
        function syncFromUrlOrStorage() {
            if (typeof window === "undefined") return;
            const params = new URLSearchParams(window.location.search);
            const urlCity = params.get("city");
            if (urlCity) {
                const normQuery = normalizeCityName(urlCity);
                setSelectedCityState(normQuery);
                setLocationMode(normQuery === "All Metros & Cities" ? "all" : "city");
                setUserCoordinates(null);
                setDetectedCityName(null);
                try {
                    if (normQuery === "All Metros & Cities") {
                        localStorage.removeItem("dineaura_selected_city");
                    } else {
                        localStorage.setItem("dineaura_selected_city", normQuery);
                    }
                } catch {}
                return;
            }

            // If we are currently in "current" (Near You) mode, route navigation
            // without ?city= must NEVER reset the user's active GPS mode or coordinates!
            if (locationModeRef.current === "current") {
                return;
            }

            try {
                const saved = localStorage.getItem("dineaura_selected_city");
                if (saved) {
                    const normSaved = normalizeCityName(saved);
                    setSelectedCityState(normSaved);
                    setLocationMode(normSaved === "All Metros & Cities" ? "all" : "city");
                    setDetectedCityName(null);
                }
            } catch {}
        }

        syncFromUrlOrStorage();

        // Listen to browser navigation (back/forward)
        window.addEventListener("popstate", syncFromUrlOrStorage);
        return () => {
            window.removeEventListener("popstate", syncFromUrlOrStorage);
        };
    }, []);

    // Listen to storage events (cross-tab) and custom events (cross-component)
    useEffect(() => {
        function handleStorage(e: StorageEvent) {
            if (e.key === "dineaura_selected_city") {
                if (e.newValue === null) {
                    // Manual city was cleared. If we are not currently in "current" mode, reset to "all".
                    if (locationModeRef.current !== "current") {
                        setSelectedCityState("All Metros & Cities");
                        setLocationMode("all");
                        setUserCoordinates(null);
                        setDetectedCityName(null);
                    }
                    return;
                }
                const norm = normalizeCityName(e.newValue);
                setSelectedCityState(norm);
                setLocationMode(norm === "All Metros & Cities" ? "all" : "city");
                setUserCoordinates(null);
                setDetectedCityName(null);
            }
        }

        function handleCustom(e: Event) {
            const customEvent = e as CustomEvent<string>;
            if (customEvent.detail !== undefined) {
                const norm = normalizeCityName(customEvent.detail);
                setSelectedCityState(norm);
                setLocationMode(norm === "All Metros & Cities" ? "all" : "city");
                setUserCoordinates(null);
                setDetectedCityName(null);
            }
        }

        window.addEventListener("storage", handleStorage);
        window.addEventListener("dineaura_city_changed", handleCustom);

        return () => {
            window.removeEventListener("storage", handleStorage);
            window.removeEventListener("dineaura_city_changed", handleCustom);
        };
    }, []);

    const matchCityHelper = useCallback(
        (restaurantCity: string | null | undefined) => {
            if (locationMode === "current" || locationMode === "all") {
                return true;
            }
            return isCityMatch(restaurantCity, selectedCity);
        },
        [locationMode, selectedCity]
    );

    const displayLocation =
        locationMode === "current"
            ? detectedCityName
                ? `Near You · ${detectedCityName}`
                : "Near You"
            : selectedCity;

    return (
        <LocationContext.Provider
            value={{
                selectedCity,
                locationMode,
                userCoordinates,
                detectedCityName,
                displayLocation,
                isLocating,
                locationError,
                availableCities,
                setSelectedCity,
                requestCurrentLocation,
                clearLocationError,
                setDynamicCities,
                isCityMatch: matchCityHelper,
            }}
        >
            {children}
        </LocationContext.Provider>
    );
}

export function useLocation() {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error("useLocation must be used within a LocationProvider");
    }
    return context;
}
