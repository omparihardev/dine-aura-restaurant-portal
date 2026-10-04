/**
 * Reverse-geocoding utility for DineAura.
 * Converts latitude and longitude into a friendly city/locality name.
 * Free, client-side, privacy-focused, with fast timeouts and safe fallbacks.
 */

export async function reverseGeocodeCity(
    latitude: number,
    longitude: number
): Promise<string | null> {
    // 1. Try BigDataCloud free client reverse geocoding
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(
            latitude
        )}&longitude=${encodeURIComponent(longitude)}&localityLanguage=en`;

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            const city =
                data.city ||
                data.locality ||
                data.principalSubdivision ||
                null;

            if (city && typeof city === "string" && city.trim().length > 0) {
                return cleanCityName(city.trim());
            }
        }
    } catch {
        // Fall through to fallback
    }

    // 2. Fallback to OpenStreetMap Nominatim
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
            latitude
        )}&lon=${encodeURIComponent(longitude)}`;

        const res = await fetch(url, {
            signal: controller.signal,
            headers: {
                "Accept-Language": "en",
            },
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const city =
                addr.city ||
                addr.town ||
                addr.village ||
                addr.suburb ||
                addr.county ||
                addr.state_district ||
                null;

            if (city && typeof city === "string" && city.trim().length > 0) {
                return cleanCityName(city.trim());
            }
        }
    } catch {
        // Safe fallback
    }

    return null;
}

function cleanCityName(name: string): string {
    // Clean up common administrative suffixes if present
    const cleaned = name
        .replace(/\s+(District|Division|Taluk|Tehsil|City|Corporation)$/i, "")
        .trim();
    return cleaned || name;
}
