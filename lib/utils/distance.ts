/**
 * Haversine geographic distance utility for DineAura.
 * Calculates real distances in kilometers between user GPS coordinates
 * and restaurant coordinates stored in Supabase.
 */

/**
 * Calculates geographic distance in kilometers between two sets of coordinates.
 * Returns null if any coordinate is missing, null, or invalid.
 */
export function calculateDistanceKm(
    lat1: number | null | undefined,
    lon1: number | null | undefined,
    lat2: number | null | undefined,
    lon2: number | null | undefined
): number | null {
    if (
        lat1 === null ||
        lat1 === undefined ||
        lon1 === null ||
        lon1 === undefined ||
        lat2 === null ||
        lat2 === undefined ||
        lon2 === null ||
        lon2 === undefined
    ) {
        return null;
    }

    const nLat1 = Number(lat1);
    const nLon1 = Number(lon1);
    const nLat2 = Number(lat2);
    const nLon2 = Number(lon2);

    if (
        Number.isNaN(nLat1) ||
        Number.isNaN(nLon1) ||
        Number.isNaN(nLat2) ||
        Number.isNaN(nLon2)
    ) {
        return null;
    }

    const R = 6371; // Earth's mean radius in kilometers
    const dLat = ((nLat2 - nLat1) * Math.PI) / 180;
    const dLon = ((nLon2 - nLon1) * Math.PI) / 180;

    const radLat1 = (nLat1 * Math.PI) / 180;
    const radLat2 = (nLat2 * Math.PI) / 180;

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Number.isFinite(distance) ? distance : null;
}

/**
 * Formats a distance in kilometers into a friendly human-readable label:
 * - Under 1 km: e.g. "650 m away"
 * - 1 km or more: e.g. "2.4 km away"
 * - Missing/null: "Distance unavailable"
 */
export function formatDistance(distanceKm: number | null | undefined): string {
    if (distanceKm === null || distanceKm === undefined || Number.isNaN(distanceKm)) {
        return "Distance unavailable";
    }

    if (distanceKm < 1) {
        const meters = Math.max(10, Math.round(distanceKm * 1000));
        return `${meters} m away`;
    }

    return `${distanceKm.toFixed(1)} km away`;
}
