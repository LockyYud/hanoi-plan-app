"use client";

import React from "react";
import { PinBase, PinSize, PinTheme } from "./pin-base";
import type { Pinory } from "@/lib/types";

interface PinoryPinProps {
    /** Pinory data to display */
    readonly pinory?: Pinory | null;
    /** Optional mood override (defaults to pinory.mood) */
    readonly mood?: string;
    /** Size of the pin */
    readonly size?: PinSize;
    /** Theme variant - auto-detected from pinory.pinoryType if not specified */
    readonly theme?: PinTheme;
    /** Additional CSS classes */
    readonly className?: string;
    /** Click handler */
    readonly onClick?: () => void;
    /** Image load handler */
    readonly onLoad?: () => void;
    /** Image error handler */
    readonly onError?: () => void;
    /** Whether the pin is currently selected */
    readonly isSelected?: boolean;
}

/**
 * PinoryPin - A polaroid-style pin for displaying pinories (location memories) on the map.
 *
 * Automatically handles:
 * - Image display (or default placeholder if no images)
 * - Mood emoji display
 * - Theme (user vs friend pinories)
 * - All pin interactions and animations
 *
 * This component replaces the old MapPin + PhotoPin architecture.
 */
export function PinoryPin({
    pinory,
    mood,
    size = "medium",
    theme,
    className,
    onClick,
    onLoad,
    onError,
    isSelected = false,
}: PinoryPinProps) {
    // Extract image URL from pinory (use first image if available)
    const hasImages =
        pinory?.hasImages && pinory.images && pinory.images.length > 0;
    const imageUrl = hasImages && pinory.images ? pinory.images[0] : undefined;

    // Auto-detect theme from pinoryType if not explicitly provided
    const resolvedTheme =
        theme || (pinory?.pinoryType === "friend" ? "friend" : "default");

    // Use provided mood or fallback to pinory's mood
    const resolvedMood = mood || pinory?.mood;

    return (
        <PinBase
            imageUrl={imageUrl}
            mood={resolvedMood}
            size={size}
            theme={resolvedTheme}
            className={className}
            onClick={onClick}
            onLoad={onLoad}
            onError={onError}
            imageAlt={pinory?.name || "Location"}
        />
    );
}

export default PinoryPin;
