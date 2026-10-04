/**
 * Image URL normalization, validation, and remote host classification.
 * Provides safe helpers to determine whether Next.js <Image /> or standard <img> should be used.
 */

const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "blob:"]);

/**
 * Safely extracts the Supabase hostname from NEXT_PUBLIC_SUPABASE_URL.
 */
export function getSupabaseHostname(): string | null {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return null;
    try {
        return new URL(supabaseUrl).hostname.toLowerCase();
    } catch {
        return null;
    }
}

/**
 * Validates whether a URL is a non-empty, safe HTTP/HTTPS or blob image URL.
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
    if (!url || typeof url !== "string") return false;
    const trimmed = url.trim();
    if (!trimmed) return false;

    // Allow browser blob URLs (used for client-side local file preview)
    if (trimmed.startsWith("blob:")) return true;

    // Allow relative paths (e.g. local assets /images/...)
    if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;

    try {
        const parsed = new URL(trimmed);
        return ALLOWED_PROTOCOLS.has(parsed.protocol);
    } catch {
        return false;
    }
}

/**
 * Determines whether a given URL is hosted on Supabase Storage or an explicitly configured Next.js domain.
 * Next.js <Image /> requires the hostname to be configured in next.config.ts remotePatterns.
 * Any other external URL must use a standard HTML <img> to prevent runtime Next.js hostname errors.
 */
export function isSupabaseOrConfiguredImage(url: string | null | undefined): boolean {
    if (!url || typeof url !== "string") return false;
    const trimmed = url.trim();
    if (!trimmed) return false;

    // Relative URLs are always safe for next/image
    if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;

    // Blob URLs must use native <img>, not next/image
    if (trimmed.startsWith("blob:")) return false;

    try {
        const parsed = new URL(trimmed);
        // Only https URLs are configured for next/image remotePatterns
        if (parsed.protocol !== "https:") return false;

        const hostname = parsed.hostname.toLowerCase();
        const configuredSupabaseHost = getSupabaseHostname();

        // 1. Matches configured project Supabase hostname
        if (configuredSupabaseHost && hostname === configuredSupabaseHost) {
            return true;
        }

        // 2. Matches Supabase storage subdomain wildcard (*.supabase.co)
        if (hostname.endsWith(".supabase.co") || hostname === "supabase.co") {
            return true;
        }

        return false;
    } catch {
        return false;
    }
}
