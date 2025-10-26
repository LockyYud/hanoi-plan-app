"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { CategoryType } from "@prisma/client";

interface PhotoPinProps {
    readonly imageUrl: string;
    readonly category?: CategoryType;
    readonly mood?: string;
    readonly size?: "small" | "medium" | "large";
    readonly className?: string;
    readonly onClick?: () => void;
    readonly onLoad?: () => void;
    readonly onError?: () => void;
}

// Category badge colors and emojis - Enhanced with Pinory palette
const categoryConfig = {
    cafe: {
        emoji: "☕",
        color: "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg",
    },
    food: {
        emoji: "🍜",
        color: "bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] text-white shadow-lg",
    },
    bar: {
        emoji: "🍻",
        color: "bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-lg",
    },
    rooftop: {
        emoji: "🏙️",
        color: "bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg",
    },
    activity: {
        emoji: "🎯",
        color: "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg",
    },
    landmark: {
        emoji: "🏛️",
        color: "bg-gradient-to-br from-neutral-600 to-neutral-800 text-white shadow-lg",
    },
};

const sizeConfig = {
    small: {
        container: "w-16 h-20", // 64px x 80px
        image: "w-14 h-14", // 56px
        imagePx: 56,
        border: "border-4",
        badge: "w-5 h-5 text-xs",
        rotation: "rotate-3",
    },
    medium: {
        container: "w-20 h-24", // 80px x 96px
        image: "w-18 h-18", // 72px
        imagePx: 72,
        border: "border-6",
        badge: "w-6 h-6 text-sm",
        rotation: "rotate-6",
    },
    large: {
        container: "w-24 h-28", // 96px x 112px
        image: "w-22 h-22", // 88px
        imagePx: 88,
        border: "border-6",
        badge: "w-7 h-7 text-base",
        rotation: "-rotate-3",
    },
};

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
    const config = sizeConfig[size];
    const categoryInfo = category ? categoryConfig[category] : null;

    // Random rotation between -6 to 6 degrees for natural look
    const randomRotation = React.useMemo(() => {
        const rotations = [
            "-rotate-6",
            "-rotate-3",
            "-rotate-2",
            "-rotate-1",
            "rotate-0",
            "rotate-1",
            "rotate-2",
            "rotate-3",
            "rotate-6",
        ];
        return rotations[Math.floor(Math.random() * rotations.length)];
    }, []);

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

    return (
        <button
            type="button"
            className={cn(
                "relative cursor-pointer transition-all duration-300 ease-out group",
                "hover:scale-110 hover:z-20",
                "transform-gpu",
                "border-0 p-0 bg-transparent",
                "focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] focus:ring-offset-2",
                randomRotation,
                config.container,
                className
            )}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            style={{
                filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.25))",
            }}
        >
            {/* Photo container with white border and rounded corners - Enhanced */}
            <div
                className={cn(
                    "relative bg-gradient-to-br from-white to-neutral-100 rounded-2xl overflow-hidden",
                    "transition-all duration-300 group-hover:shadow-2xl",
                    "ring-2 ring-white group-hover:ring-[#FF6B6B]",
                    config.border,
                    config.image
                )}
                style={{
                    /* Anchor point at bottom center */
                    transformOrigin: "bottom center",
                }}
            >
                {/* Photo image */}
                <Image
                    src={imageUrl}
                    alt="Location"
                    width={config.imagePx}
                    height={config.imagePx}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onLoad={onLoad}
                    onError={onError}
                    style={{
                        /* Ensure crisp rendering on high DPR displays */
                        imageRendering: "crisp-edges",
                    }}
                />

                {/* Category/mood badge in corner - Enhanced */}
                {(categoryInfo || mood) && (
                    <div
                        className={cn(
                            "absolute -top-1.5 -right-1.5",
                            "rounded-full border-3 border-white",
                            "flex items-center justify-center",
                            "shadow-xl group-hover:scale-110 transition-transform duration-300",
                            config.badge,
                            categoryInfo
                                ? categoryInfo.color
                                : "bg-gradient-to-br from-neutral-500 to-neutral-700 text-white shadow-lg"
                        )}
                    >
                        <span className="leading-none drop-shadow-sm">
                            {mood || categoryInfo?.emoji || "📍"}
                        </span>
                    </div>
                )}

                {/* Subtle gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
        </button>
    );
}

export default PhotoPin;
