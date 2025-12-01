"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { CategoryType } from "@prisma/client";
import { UserCircle2 } from "lucide-react";
import { PinBase } from "@/components/map/markers/pin-base";
import {
    PinSize,
    sizeConfig,
    categoryConfig,
} from "@/components/map/markers/pin-base";

interface FriendPinoryPinProps {
    readonly friendName: string;
    readonly friendAvatarUrl?: string;
    readonly imageUrl?: string;
    readonly category?: CategoryType;
    readonly mood?: string;
    readonly size?: PinSize;
    readonly className?: string;
    readonly onClick?: () => void;
}

/**
 * FriendPinoryPin - A polaroid-style photo pin for displaying friend's places on the map
 * Uses the purple theme from PinBase with additional avatar badge and tooltip
 */
export function FriendPinoryPin({
    friendName,
    friendAvatarUrl,
    imageUrl,
    category,
    mood,
    size = "medium",
    className,
    onClick,
}: FriendPinoryPinProps) {
    const config = sizeConfig[size];
    const categoryInfo = category ? categoryConfig[category] : null;

    // Custom placeholder with purple gradient for friend pins
    const friendPlaceholder = (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200">
            <span className="text-3xl">
                {categoryInfo?.emoji || mood || "📍"}
            </span>
        </div>
    );

    // Friend avatar badge to show in bottom-left corner
    const avatarBadge = (
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
    );

    // Tooltip showing friend name
    const tooltip = (
        <div className="bg-purple-900 text-white text-xs py-1 px-2 rounded shadow-lg">
            {friendName}&apos;s location
        </div>
    );

    return (
        <PinBase
            imageUrl={imageUrl}
            mood={mood}
            size={size}
            theme="friend"
            className={className}
            onClick={onClick}
            imageAlt={`${friendName}'s location`}
            placeholder={friendPlaceholder}
            additionalBadges={avatarBadge}
            tooltip={tooltip}
        />
    );
}

export default FriendPinoryPin;
