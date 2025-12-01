"use client";

import React from "react";
import { CategoryType } from "@prisma/client";
import { PinBase, PinSize } from "./pin-base";

interface PhotoPinProps {
    readonly imageUrl: string;
    readonly category?: CategoryType;
    readonly mood?: string;
    readonly size?: PinSize;
    readonly className?: string;
    readonly onClick?: () => void;
    readonly onLoad?: () => void;
    readonly onError?: () => void;
}

/**
 * PhotoPin - A polaroid-style photo pin for displaying user's own places on the map
 * Uses the default coral theme from PinBase
 */
export function PhotoPin({
    imageUrl,
    category,
    mood,
    size = "medium",
    className,
    onClick,
    onLoad,
    onError,
}: PhotoPinProps) {
    return (
        <PinBase
            imageUrl={imageUrl}
            mood={mood}
            size={size}
            theme="default"
            className={className}
            onClick={onClick}
            onLoad={onLoad}
            onError={onError}
            imageAlt="Location"
        />
    );
}

export default PhotoPin;
