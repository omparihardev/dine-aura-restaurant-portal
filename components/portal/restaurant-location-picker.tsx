"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

interface RestaurantLocationPickerProps {
    initialLatitude?: number | null;
    initialLongitude?: number | null;
    city?: string;
    state?: string;
    onCoordinatesChange: (lat: number | null, lng: number | null) => void;
}

export type LocationMethod = "map" | "manual";

export function RestaurantLocationPicker({
    initialLatitude,
    initialLongitude,
    city,
    state,
    onCoordinatesChange,
}: RestaurantLocationPickerProps) {
    const [method, setMethod] = useState<LocationMethod>("map");

    // Coordinates state
    const [latitude, setLatitude] = useState<number | null>(
        initialLatitude !== undefined ? initialLatitude : null
    );
    const [longitude, setLongitude] = useState<number | null>(
        initialLongitude !== undefined ? initialLongitude : null
    );

    // Manual input strings
    const [manualLatStr, setManualLatStr] = useState<string>(
        initialLatitude !== undefined && initialLatitude !== null ? initialLatitude.toString() : ""
    );
    const [manualLngStr, setManualLngStr] = useState<string>(
        initialLongitude !== undefined && initialLongitude !== null ? initialLongitude.toString() : ""
    );

    // Manual validation error
    const [manualError, setManualError] = useState<string | null>(null);

    // Map container ref & Leaflet map instance ref
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<any>(null);
    const markerRef = useRef<any>(null);

    // Reset when initial props change (e.g. opening different restaurant in edit mode)
    useEffect(() => {
        const lat = initialLatitude !== undefined ? initialLatitude : null;
        const lng = initialLongitude !== undefined ? initialLongitude : null;
        setLatitude(lat);
        setLongitude(lng);
        setManualLatStr(lat !== null ? lat.toString() : "");
        setManualLngStr(lng !== null ? lng.toString() : "");
        setManualError(null);
    }, [initialLatitude, initialLongitude]);

    // Notify parent on change
    const updateCoordinates = (lat: number | null, lng: number | null) => {
        setLatitude(lat);
        setLongitude(lng);
        onCoordinatesChange(lat, lng);
    };

    // Initialize or update Leaflet map
    useEffect(() => {
        if (method !== "map" || !mapContainerRef.current) {
            return;
        }

        let isMounted = true;

        async function initMap() {
            const L = (await import("leaflet")).default;
            if (!isMounted || !mapContainerRef.current) return;

            // Clean up existing instance if already attached
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                markerRef.current = null;
            }

            // Default to India coordinates if none provided
            const defaultLat = latitude ?? 20.5937;
            const defaultLng = longitude ?? 78.9629;
            const defaultZoom = latitude !== null && longitude !== null ? 14 : 5;

            const map = L.map(mapContainerRef.current, {
                center: [defaultLat, defaultLng],
                zoom: defaultZoom,
                scrollWheelZoom: true,
            });

            mapInstanceRef.current = map;

            // OpenStreetMap Standard Tiles
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19,
            }).addTo(map);

            // Custom modern SVG pin icon (avoids Leaflet PNG asset bundling issues)
            const pinIcon = L.divIcon({
                className: "custom-leaflet-marker",
                html: `
                    <div style="position: relative; transform: translate(-50%, -100%); cursor: pointer; text-align: center;">
                        <div style="width: 36px; height: 36px; background: linear-gradient(135deg, #f59e0b, #ea580c); border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.4); border: 2.5px solid #ffffff;">
                            <span style="transform: rotate(45deg); font-size: 16px;">🍽️</span>
                        </div>
                        <div style="width: 10px; height: 10px; background: rgba(0,0,0,0.3); border-radius: 50%; filter: blur(1.5px); margin: -4px auto 0;"></div>
                    </div>
                `,
                iconSize: [36, 36],
                iconAnchor: [18, 36],
            });

            // If coordinates exist, create marker
            if (latitude !== null && longitude !== null) {
                const marker = L.marker([latitude, longitude], { icon: pinIcon }).addTo(map);
                markerRef.current = marker;
            }

            // Click listener on map to select exact restaurant location
            map.on("click", (e: any) => {
                const clickLat = parseFloat(e.latlng.lat.toFixed(6));
                const clickLng = parseFloat(e.latlng.lng.toFixed(6));

                if (markerRef.current) {
                    markerRef.current.setLatLng([clickLat, clickLng]);
                } else {
                    const marker = L.marker([clickLat, clickLng], { icon: pinIcon }).addTo(map);
                    markerRef.current = marker;
                }

                updateCoordinates(clickLat, clickLng);
                setManualLatStr(clickLat.toString());
                setManualLngStr(clickLng.toString());
            });

            // Ensure tile sizing is refreshed
            setTimeout(() => {
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.invalidateSize();
                }
            }, 250);
        }

        initMap();

        return () => {
            isMounted = false;
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                markerRef.current = null;
            }
        };
    }, [method]);

    // Handle switching between Map and Manual
    const handleSwitchMethod = (newMethod: LocationMethod) => {
        if (newMethod === method) return;
        setMethod(newMethod);
        setManualError(null);

        if (newMethod === "manual") {
            // Pre-fill manual fields from current coordinates
            setManualLatStr(latitude !== null ? latitude.toString() : "");
            setManualLngStr(longitude !== null ? longitude.toString() : "");
        } else {
            // Switched to map: validate and apply current manual inputs if valid
            if (manualLatStr.trim() && manualLngStr.trim()) {
                const lat = parseFloat(manualLatStr);
                const lng = parseFloat(manualLngStr);
                if (!isNaN(lat) && lat >= -90 && lat <= 90 && !isNaN(lng) && lng >= -180 && lng <= 180) {
                    updateCoordinates(lat, lng);
                }
            }
        }
    };

    // Handle manual input change
    const handleManualLatChange = (val: string) => {
        setManualLatStr(val);
        validateAndSyncManual(val, manualLngStr);
    };

    const handleManualLngChange = (val: string) => {
        setManualLngStr(val);
        validateAndSyncManual(manualLatStr, val);
    };

    const validateAndSyncManual = (latStr: string, lngStr: string) => {
        setManualError(null);

        const trimmedLat = latStr.trim();
        const trimmedLng = lngStr.trim();

        // If both empty, allowed as null
        if (!trimmedLat && !trimmedLng) {
            updateCoordinates(null, null);
            return;
        }

        // If one is filled and other is empty
        if ((trimmedLat && !trimmedLng) || (!trimmedLat && trimmedLng)) {
            setManualError("Both latitude and longitude must be provided together.");
            updateCoordinates(null, null);
            return;
        }

        const latNum = parseFloat(trimmedLat);
        const lngNum = parseFloat(trimmedLng);

        if (isNaN(latNum)) {
            setManualError("Latitude must be a valid number.");
            updateCoordinates(null, null);
            return;
        }

        if (latNum < -90 || latNum > 90) {
            setManualError("Latitude must be between -90 and 90.");
            updateCoordinates(null, null);
            return;
        }

        if (isNaN(lngNum)) {
            setManualError("Longitude must be a valid number.");
            updateCoordinates(null, null);
            return;
        }

        if (lngNum < -180 || lngNum > 180) {
            setManualError("Longitude must be between -180 and 180.");
            updateCoordinates(null, null);
            return;
        }

        // Both valid
        updateCoordinates(latNum, lngNum);
    };

    const handleClearLocation = () => {
        updateCoordinates(null, null);
        setManualLatStr("");
        setManualLngStr("");
        setManualError(null);
        if (markerRef.current && mapInstanceRef.current) {
            mapInstanceRef.current.removeLayer(markerRef.current);
            markerRef.current = null;
        }
    };

    return (
        <div className="space-y-4 p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
            {/* Header: Title & Instructions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-zinc-200/80 dark:border-zinc-700/60">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm">📍</span>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                            Restaurant Location
                        </label>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        Set the exact geographic coordinates for Google Maps navigation and discovery.
                    </p>
                </div>

                {/* Clear Location Button (if coordinates are set) */}
                {latitude !== null && longitude !== null && (
                    <button
                        type="button"
                        onClick={handleClearLocation}
                        className="text-[11px] font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
                    >
                        <span>✕</span> Clear Location
                    </button>
                )}
            </div>

            {/* Mutually Exclusive Option Switcher */}
            <div>
                <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                    Choose how to set the exact restaurant location:
                </p>
                <div className="grid grid-cols-2 gap-2 sm:max-w-md">
                    <button
                        type="button"
                        onClick={() => handleSwitchMethod("map")}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 border ${
                            method === "map"
                                ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                                : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`}
                    >
                        <span className="text-sm">{method === "map" ? "🔘" : "⚪"}</span>
                        <span>Pick Location on Map</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleSwitchMethod("manual")}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 border ${
                            method === "manual"
                                ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                                : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`}
                    >
                        <span className="text-sm">{method === "manual" ? "🔘" : "⚪"}</span>
                        <span>Enter Coordinates</span>
                    </button>
                </div>
            </div>

            {/* Hidden Form Inputs: Guarantees ONLY the active coordinates pair is submitted */}
            <input
                type="hidden"
                name="latitude"
                value={latitude !== null ? latitude.toString() : ""}
            />
            <input
                type="hidden"
                name="longitude"
                value={longitude !== null ? longitude.toString() : ""}
            />

            {/* OPTION 1: PICK LOCATION ON MAP */}
            {method === "map" && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-zinc-600 dark:text-zinc-300 font-medium">
                            🗺️ Click anywhere on the map to place the restaurant pin.
                        </span>
                        {city && (
                            <span className="text-[11px] text-zinc-500">
                                Target: {city}{state ? `, ${state}` : ""}
                            </span>
                        )}
                    </div>

                    {/* Interactive Leaflet Map Viewport */}
                    <div className="rounded-2xl overflow-hidden border border-zinc-300 dark:border-zinc-700 relative shadow-inner">
                        <div
                            ref={mapContainerRef}
                            style={{ height: "300px", width: "100%", zIndex: 10 }}
                            className="bg-zinc-100 dark:bg-zinc-900"
                        />
                    </div>

                    {/* Selected Location Feedback Card */}
                    {latitude !== null && longitude !== null ? (
                        <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between">
                            <div className="space-y-0.5">
                                <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                                    <span>✅</span> Selected Location
                                </span>
                                <div className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
                                    <span>Latitude: {latitude.toFixed(6)}</span>
                                    <span>&bull;</span>
                                    <span>Longitude: {longitude.toFixed(6)}</span>
                                </div>
                            </div>
                            <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold hidden sm:inline">
                                Coordinates captured
                            </span>
                        </div>
                    ) : (
                        <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-500 flex items-center gap-2">
                            <span>ℹ️</span>
                            <span>No location selected yet. Click on the map to pin the restaurant location.</span>
                        </div>
                    )}
                </div>
            )}

            {/* OPTION 2: MANUAL LATITUDE & LONGITUDE */}
            {method === "manual" && (
                <div className="space-y-3">
                    <p className="text-xs text-zinc-600 dark:text-zinc-300">
                        Enter the exact geographic coordinates of the restaurant:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                                Latitude (-90 to 90)
                            </label>
                            <input
                                type="number"
                                step="any"
                                min="-90"
                                max="90"
                                value={manualLatStr}
                                onChange={(e) => handleManualLatChange(e.target.value)}
                                placeholder="e.g. 23.2599"
                                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                                Longitude (-180 to 180)
                            </label>
                            <input
                                type="number"
                                step="any"
                                min="-180"
                                max="180"
                                value={manualLngStr}
                                onChange={(e) => handleManualLngChange(e.target.value)}
                                placeholder="e.g. 77.4126"
                                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                            />
                        </div>
                    </div>

                    {/* Manual Error Alert */}
                    {manualError && (
                        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                            <span>⚠️</span>
                            <span>{manualError}</span>
                        </div>
                    )}

                    {/* Valid preview badge */}
                    {!manualError && latitude !== null && longitude !== null && (
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between font-mono">
                            <span>Valid Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}</span>
                            <span className="text-[10px] uppercase font-bold text-emerald-600">✓ Ready</span>
                        </div>
                    )}

                    <p className="text-[11px] text-zinc-400">
                        Tip: Open Google Maps, right-click on the venue, and copy the latitude and longitude.
                    </p>
                </div>
            )}
        </div>
    );
}
