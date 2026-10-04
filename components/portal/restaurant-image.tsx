"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { isValidImageUrl, isSupabaseOrConfiguredImage } from "@/lib/utils/image-url";

export interface RestaurantImageProps {
    src?: string | null;
    alt: string;
    className?: string;
    fill?: boolean;
    width?: number;
    height?: number;
    priority?: boolean;
    sizes?: string;
    quality?: number;
    fallbackCuisine?: string | null;
    fallbackSubtitle?: string | null;
    fallbackClassName?: string;
    compactFallback?: boolean;
}

export function RestaurantImageFallback({
    cuisine,
    subtitle = "Restaurant Image",
    className = "",
    compact = false,
}: {
    cuisine?: string | null;
    subtitle?: string | null;
    className?: string;
    compact?: boolean;
}) {
    return (
        <div
            className={`w-full h-full flex flex-col items-center justify-center text-center p-2 select-none bg-gradient-to-br from-amber-500/10 via-zinc-900/60 to-orange-500/10 dark:from-zinc-900/90 dark:via-zinc-900 dark:to-zinc-950 ${className}`}
            role="img"
            aria-label="Restaurant image placeholder"
        >
            <span className="text-xl sm:text-2xl mb-0.5 drop-shadow-sm leading-none" aria-hidden="true">
                🍽️
            </span>
            {!compact && (
                <>
                    <span className="text-[10px] sm:text-[11px] font-bold tracking-wider text-amber-500 dark:text-amber-400 uppercase truncate max-w-full px-1">
                        {cuisine || "DineAura"}
                    </span>
                    <span className="text-[9px] text-zinc-400 dark:text-zinc-500 truncate max-w-full px-1">
                        {subtitle}
                    </span>
                </>
            )}
        </div>
    );
}

/**
 * Reusable, resilient restaurant image component.
 * 
 * - Leverages Next.js <Image /> for optimized Supabase Storage and configured remote images.
 * - Safely routes arbitrary external images (e.g. assets.vogue.com, third-party CDN URLs)
 *   through standard HTML <img> to prevent Next.js hostname runtime exceptions.
 * - Displays a branded, polished DineAura fallback when images are missing, invalid, or broken.
 */
export function RestaurantImage({
    src,
    alt,
    className = "",
    fill = false,
    width,
    height,
    priority = false,
    sizes,
    quality,
    fallbackCuisine,
    fallbackSubtitle,
    fallbackClassName = "",
    compactFallback = false,
}: RestaurantImageProps) {
    const [hasError, setHasError] = useState(false);

    // Reset error state when src changes
    useEffect(() => {
        setHasError(false);
    }, [src]);

    const cleanSrc = src?.trim() || null;

    // Missing, invalid, or failed image -> show fallback
    if (!cleanSrc || !isValidImageUrl(cleanSrc) || hasError) {
        return (
            <RestaurantImageFallback
                cuisine={fallbackCuisine}
                subtitle={fallbackSubtitle}
                className={fallbackClassName}
                compact={compactFallback}
            />
        );
    }

    // Supabase Storage or explicitly configured domains -> use Next.js <Image />
    if (isSupabaseOrConfiguredImage(cleanSrc)) {
        if (fill) {
            return (
                <Image
                    src={cleanSrc}
                    alt={alt}
                    fill
                    priority={priority}
                    sizes={sizes}
                    quality={quality}
                    className={className}
                    onError={() => setHasError(true)}
                />
            );
        }

        return (
            <Image
                src={cleanSrc}
                alt={alt}
                width={width || 400}
                height={height || 300}
                priority={priority}
                sizes={sizes}
                quality={quality}
                className={className}
                onError={() => setHasError(true)}
            />
        );
    }

    // Arbitrary external URLs -> safely render standard HTML <img>
    const imgClasses = fill
        ? `absolute inset-0 w-full h-full object-cover ${className}`.trim()
        : className;

    return (
        <img
            src={cleanSrc}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            width={width}
            height={height}
            className={imgClasses}
            onError={() => setHasError(true)}
        />
    );
}
