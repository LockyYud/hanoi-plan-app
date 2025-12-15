"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { CategoryType } from "@prisma/client";
import { PushPinIcon } from "./push-pin-icon";

// ============================================
// SHARED CONFIGURATION
// ============================================

// Category badge colors and emojis - Enhanced with Pinory palette
export const categoryConfig: Record<
    CategoryType,
    { emoji: string; color: string }
> = {
    cafe: {
        emoji: "☕",
        color: "bg-amber-500 text-white shadow-lg",
    },
    food: {
        emoji: "🍜",
        color: "bg-brand text-white shadow-lg",
    },
    bar: {
        emoji: "🍻",
        color: "bg-purple-600 text-white shadow-lg",
    },
    rooftop: {
        emoji: "🏙️",
        color: "bg-blue-500 text-white shadow-lg",
    },
    activity: {
        emoji: "🎯",
        color: "bg-green-500 text-white shadow-lg",
    },
    landmark: {
        emoji: "🏛️",
        color: "bg-neutral-500 text-white shadow-lg",
    },
};

export const sizeConfig = {
    small: {
        container: "w-16 h-20", // 64px x 80px
        image: "w-14 h-14", // 56px
        imagePx: 56,
        border: "border-2", // Thinner border
        badge: "w-5 h-5 text-xs",
        avatar: "w-6 h-6",
        pushpin: "w-4 h-5", // Smaller pushpin
    },
    medium: {
        container: "w-20 h-24", // 80px x 96px
        image: "w-18 h-18", // 72px
        imagePx: 72,
        border: "border-2", // Thinner border
        badge: "w-6 h-6 text-sm",
        avatar: "w-7 h-7",
        pushpin: "w-5 h-6", // Smaller pushpin
    },
    large: {
        container: "w-24 h-28", // 96px x 112px
        image: "w-22 h-22", // 88px
        imagePx: 88,
        border: "border-2", // Thinner border
        badge: "w-7 h-7 text-base",
        avatar: "w-8 h-8",
        pushpin: "w-6 h-7", // Smaller pushpin
    },
};

// Theme colors for different pin variants
export const themeConfig = {
    default: {
        ring: "ring-2 ring-background/80", // Subtle ring for user's pins
        focusRing: "focus:ring-brand",
        shadow: "rgba(0, 0, 0, 0.25)",
        hoverOverlay: "from-black/20",
    },
    friend: {
        ring: "ring-2 ring-purple-400/60 group-hover:ring-purple-500/80", // Purple glow for friend pins
        focusRing: "focus:ring-purple-500",
        shadow: "rgba(147, 51, 234, 0.3)",
        hoverOverlay: "from-purple-500/20",
    },
};

export type PinSize = "small" | "medium" | "large";
export type PinTheme = keyof typeof themeConfig;

// ============================================
// SHARED HOOKS
// ============================================

export type PinPosition = "left" | "center" | "right";

interface PinPlacement {
    position: PinPosition;
    rotation: string;
    pinPositionClass: string;
    pinTilt: "left" | "center" | "right";
}

// Pin placement configurations - rotation matches pin position for natural look
const PIN_PLACEMENTS: PinPlacement[] = [
    // Pin on left -> photo tilts right (hangs from left), pin tilts left
    {
        position: "left",
        rotation: "rotate-3",
        pinPositionClass: "left-1 -translate-x-1/4",
        pinTilt: "left",
    },
    {
        position: "left",
        rotation: "rotate-4",
        pinPositionClass: "left-1 -translate-x-1/4",
        pinTilt: "left",
    },
    {
        position: "left",
        rotation: "rotate-5",
        pinPositionClass: "left-1 -translate-x-1/4",
        pinTilt: "left",
    },
    // Pin on center -> photo is mostly straight, pin is straight
    {
        position: "center",
        rotation: "rotate-0",
        pinPositionClass: "left-1/2 -translate-x-1/2",
        pinTilt: "center",
    },
    {
        position: "center",
        rotation: "rotate-1",
        pinPositionClass: "left-1/2 -translate-x-1/2",
        pinTilt: "center",
    },
    {
        position: "center",
        rotation: "-rotate-1",
        pinPositionClass: "left-1/2 -translate-x-1/2",
        pinTilt: "center",
    },
    // Pin on right -> photo tilts left (hangs from right), pin tilts right
    {
        position: "right",
        rotation: "-rotate-3",
        pinPositionClass: "right-1 translate-x-1/4",
        pinTilt: "right",
    },
    {
        position: "right",
        rotation: "-rotate-4",
        pinPositionClass: "right-1 translate-x-1/4",
        pinTilt: "right",
    },
    {
        position: "right",
        rotation: "-rotate-5",
        pinPositionClass: "right-1 translate-x-1/4",
        pinTilt: "right",
    },
];

export function usePinPlacement(): PinPlacement {
    return React.useMemo(() => {
        return PIN_PLACEMENTS[
            Math.floor(Math.random() * PIN_PLACEMENTS.length)
        ];
    }, []);
}

// Legacy hook for backwards compatibility
export function useRandomRotation(): string {
    const placement = usePinPlacement();
    return placement.rotation;
}

// ============================================
// PIN BASE COMPONENT
// ============================================

export interface PinBaseProps {
    /** Image URL to display in the pin */
    readonly imageUrl?: string;
    /** Custom mood emoji to display */
    readonly mood?: string;
    /** Size of the pin */
    readonly size?: PinSize;
    /** Theme variant */
    readonly theme?: PinTheme;
    /** Additional CSS classes */
    readonly className?: string;
    /** Click handler */
    readonly onClick?: () => void;
    /** Image load handler */
    readonly onLoad?: () => void;
    /** Image error handler */
    readonly onError?: () => void;
    /** Alt text for the image */
    readonly imageAlt?: string;
    /** Placeholder content when no image */
    readonly placeholder?: React.ReactNode;
    /** Additional badges to render (e.g., friend avatar) */
    readonly additionalBadges?: React.ReactNode;
    /** Tooltip content */
    readonly tooltip?: React.ReactNode;
}

export function PinBase({
    imageUrl,
    mood,
    size = "medium",
    theme = "default",
    className,
    onClick,
    onLoad,
    onError,
    imageAlt = "Location",
    placeholder,
    additionalBadges,
    tooltip,
}: PinBaseProps) {
    const config = sizeConfig[size];
    const themeStyles = themeConfig[theme];
    const pinPlacement = usePinPlacement();

    const handleClick = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        onClick?.();
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onClick?.();
        }
    };

    // Default placeholder when no image and no custom placeholder provided
    const defaultPlaceholder = (
        <div className="w-full h-full bg-gradient-to-br from-brand/10 via-brand/20 to-brand/30 flex items-center justify-center relative overflow-hidden">
            {/* Decorative background pattern */}
            <div className="absolute inset-0 opacity-10">
                <svg
                    className="w-full h-full"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                >
                    <defs>
                        <pattern
                            id="grid"
                            width="10"
                            height="10"
                            patternUnits="userSpaceOnUse"
                        >
                            <path
                                d="M 10 0 L 0 0 0 10"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="0.5"
                            />
                        </pattern>
                    </defs>
                    <rect width="100" height="100" fill="url(#grid)" />
                </svg>
            </div>

            {/* Center icon/emoji */}
            {mood ? (
                <span className="text-4xl z-10 drop-shadow-sm">{mood}</span>
            ) : (
                <svg
                    className="w-8 h-8 text-brand/40 z-10 drop-shadow-sm"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                </svg>
            )}
        </div>
    );

    return (
        <button
            type="button"
            className={cn(
                "relative cursor-pointer transition-all duration-300 ease-out group",
                "hover:scale-110 hover:z-20",
                "transform-gpu",
                "border-0 p-0 bg-transparent",
                "focus:outline-none focus:ring-2 focus:ring-offset-2",
                themeStyles.focusRing,
                pinPlacement.rotation,
                config.container,
                className
            )}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            style={{
                filter: `drop-shadow(0 4px 12px ${themeStyles.shadow})`,
            }}
        >
            {/* Pushpin - positioned based on placement, tilted toward center */}
            <div
                className={cn(
                    "absolute -top-1 z-10",
                    "group-hover:scale-110 transition-transform duration-300",
                    pinPlacement.pinPositionClass
                )}
            >
                <PushPinIcon
                    className={config.pushpin}
                    tilt={pinPlacement.pinTilt}
                />
            </div>

            {/* Photo container with subtle ring glow */}
            <div
                className={cn(
                    "relative bg-white rounded-sm overflow-hidden",
                    "transition-all duration-300 group-hover:shadow-2xl",
                    themeStyles.ring,
                    config.image
                )}
            >
                {/* Photo image or placeholder */}
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={imageAlt}
                        width={config.imagePx}
                        height={config.imagePx}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onLoad={onLoad}
                        onError={onError}
                    />
                ) : (
                    placeholder || defaultPlaceholder
                )}

                {/* Additional badges (e.g., friend avatar) */}
                {additionalBadges}

                {/* Subtle gradient overlay on hover */}
                <div
                    className={cn(
                        "absolute inset-0 bg-transparent",
                        "opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
                        themeStyles.hoverOverlay
                    )}
                />
            </div>

            {/* Tooltip */}
            {tooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {tooltip}
                </div>
            )}
        </button>
    );
}

export default PinBase;
