"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { CategoryType } from "@prisma/client";
import { UserCircle2 } from "lucide-react";

interface FriendLocationPinProps {
    friendName: string;
    friendAvatarUrl?: string;
    imageUrl?: string;
    category?: CategoryType;
    mood?: string;
    size?: "small" | "medium" | "large";
    className?: string;
    onClick?: () => void;
}

// Category badge colors and emojis
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
        container: "w-16 h-20",
        image: "w-14 h-14",
        imagePx: 56,
        border: "border-4",
        badge: "w-5 h-5 text-xs",
        avatar: "w-6 h-6",
    },
    medium: {
        container: "w-20 h-24",
        image: "w-18 h-18",
        imagePx: 72,
        border: "border-6",
        badge: "w-6 h-6 text-sm",
        avatar: "w-7 h-7",
    },
    large: {
        container: "w-24 h-28",
        image: "w-22 h-22",
        imagePx: 88,
        border: "border-6",
        badge: "w-7 h-7 text-base",
        avatar: "w-8 h-8",
    },
};

export function FriendLocationPin({
    friendName,
    friendAvatarUrl,
    imageUrl,
    category,
    mood,
    size = "medium",
    className,
    onClick,
}: FriendLocationPinProps) {
    const config = sizeConfig[size];
    const categoryInfo = category ? categoryConfig[category] : null;

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

    return (
        <button
            type="button"
            className={cn(
                "relative cursor-pointer transition-all duration-300 ease-out group",
                "hover:scale-110 hover:z-20",
                "transform-gpu",
                "border-0 p-0 bg-transparent",
                "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
                randomRotation,
                config.container,
                className
            )}
            onClick={handleClick}
            style={{
                filter: "drop-shadow(0 4px 12px rgba(147, 51, 234, 0.3))",
            }}
        >
            {/* Photo container with purple border for friends */}
            <div
                className={cn(
                    "relative bg-gradient-to-br from-white to-neutral-100 rounded-2xl overflow-hidden",
                    "transition-all duration-300 group-hover:shadow-2xl",
                    "ring-2 ring-purple-300 group-hover:ring-purple-500",
                    config.border,
                    config.image
                )}
                style={{
                    transformOrigin: "bottom center",
                }}
            >
                {/* Photo image or placeholder */}
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={`${friendName}'s location`}
                        width={config.imagePx}
                        height={config.imagePx}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        style={{ imageRendering: "crisp-edges" }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200">
                        <span className="text-3xl">
                            {categoryInfo?.emoji || mood || "📍"}
                        </span>
                    </div>
                )}

                {/* Category/mood badge in top-right corner */}
                {(categoryInfo || mood) && (
                    <div
                        className={cn(
                            "absolute -top-1.5 -right-1.5",
                            "rounded-full border-3 border-white",
                            "flex items-center justify-center",
                            "shadow-xl group-hover:scale-110 transition-transform duration-300",
                            config.badge,
                            categoryInfo?.color ||
                                "bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-lg"
                        )}
                    >
                        <span className="leading-none drop-shadow-sm">
                            {mood || categoryInfo?.emoji || "📍"}
                        </span>
                    </div>
                )}

                {/* Friend avatar in bottom-left corner */}
                <div
                    className={cn(
                        "absolute -bottom-1.5 -left-1.5",
                        "rounded-full border-3 border-white bg-white",
                        "flex items-center justify-center overflow-hidden",
                        "shadow-xl group-hover:scale-110 transition-transform duration-300",
                        config.avatar
                    )}
                >
                    {friendAvatarUrl ? (
                        <Image
                            src={friendAvatarUrl}
                            alt={friendName}
                            width={28}
                            height={28}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <UserCircle2 className="w-full h-full text-purple-500" />
                    )}
                </div>

                {/* Subtle gradient overlay on hover with purple tint */}
                <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                <div className="bg-purple-900 text-white text-xs py-1 px-2 rounded shadow-lg">
                    {friendName}'s location
                </div>
            </div>
        </button>
    );
}
