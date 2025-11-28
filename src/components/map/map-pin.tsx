"use client";

import React from "react";
import { CategoryType } from "@prisma/client";
import { PhotoPin } from "./photo-pin";
// import { IconPin } from "./icon-pin";
import type { Pinory } from "@/lib/types";

interface MapPinDisplayProps {
    readonly pinory?: Pinory | null; // Use Pinory instead of LocationNote
    readonly mood?: string;
    readonly size?: "small" | "medium" | "large";
    readonly className?: string;
    readonly onClick?: () => void;
    readonly isSelected?: boolean;
}

export function MapPin({
    pinory,
    mood,
    size = "medium",
    className,
    onClick,
    isSelected = false,
}: MapPinDisplayProps) {
    // If we have images in the note, use PhotoPin, otherwise use IconPin
    const hasImages =
        pinory?.hasImages && pinory.images && pinory.images.length > 0;
    const imageUrl = hasImages && pinory.images ? pinory.images[0] : undefined; // Use first image

    if (hasImages && imageUrl) {
        return (
            <PhotoPin
                imageUrl={imageUrl}
                mood={mood || pinory.mood}
                size={size}
                className={className}
                onClick={onClick}
            />
        );
    }
}

export default MapPin;
