"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
    MapPin,
    Heart,
    Star,
    X,
    Navigation,
    Calendar,
    UserCircle2,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { PinoryDetailsBase, useDirections } from "../base";
import { SmartImageGallery } from "../details/smart-image-gallery";
import type { Pinory } from "@/lib/types";

interface FriendPinoryDetailsProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly pinory: Pinory;
    readonly onAddToFavorites?: () => void;
}

/**
 * FriendPinoryDetails - Details view for friend's pinory
 * Uses PinoryDetailsBase with friend theme and custom slots
 */
export function FriendPinoryDetails({
    isOpen,
    onClose,
    pinory,
    onAddToFavorites,
}: FriendPinoryDetailsProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showLightbox, setShowLightbox] = useState(false);

    const { isGettingDirections, handleGetDirections } = useDirections({
        toastId: "friend-directions",
    });

    const user = pinory.creator;
    const { rating, note, visitDate } = pinory;
    const images =
        (pinory as any).images || pinory.media?.map((m) => m.url) || [];

    const formatVisitDate = (date: Date | string) => {
        try {
            const d = new Date(date);
            return d.toLocaleString("vi-VN", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
            });
        } catch {
            return "";
        }
    };

    const handleDirections = useCallback(() => {
        handleGetDirections({
            name: pinory.name,
            address: pinory.address,
            lat: pinory.lat,
            lng: pinory.lng,
        });
    }, [pinory, handleGetDirections]);

    // ============================================
    // SLOT: Mobile Header
    // ============================================
    const mobileHeader = (
        <div className="px-5 py-3 border-b border-purple-900/30 bg-purple-900/10">
            <div className="flex items-center gap-3">
                {user?.avatarUrl ? (
                    <Image
                        src={user.avatarUrl}
                        alt={user.name || user.email}
                        width={40}
                        height={40}
                        className="rounded-full border-2 border-purple-500"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center">
                        <UserCircle2 className="w-6 h-6 text-purple-400" />
                    </div>
                )}
                <div className="flex-1">
                    <p className="text-sm font-semibold text-purple-400">
                        {user?.name || user?.email}
                    </p>
                    <p className="text-xs text-purple-300/70">
                        Friend&apos;s location
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="text-white bg-black/50 hover:bg-black/70 rounded-full w-8 h-8 p-0 backdrop-blur-md"
                >
                    <X className="h-4 w-4" strokeWidth={2.5} />
                </Button>
            </div>
        </div>
    );

    // ============================================
    // SLOT: Desktop Header
    // ============================================
    const desktopHeader = (
        <div className="flex items-center gap-3">
            {user?.avatarUrl ? (
                <Image
                    src={user.avatarUrl}
                    alt={user.name || user.email}
                    width={40}
                    height={40}
                    className="rounded-full border-2 border-purple-400"
                />
            ) : (
                <div className="w-10 h-10 rounded-full bg-purple-500/20 border-2 border-purple-400 flex items-center justify-center">
                    <UserCircle2 className="w-6 h-6 text-purple-300" />
                </div>
            )}
            <div className="flex-1">
                <p className="text-sm font-semibold text-purple-300">
                    {user?.name || user?.email}
                </p>
                <p className="text-xs text-purple-200/70">
                    Shared this location
                </p>
            </div>
        </div>
    );

    // ============================================
    // SLOT: Main Content
    // ============================================
    const mainContent = (
        <>
            {/* Smart Image Gallery - wrapped to prevent purple tint from parent */}
            {images.length > 0 && (
                <div className="bg-background rounded-xl overflow-hidden">
                    <SmartImageGallery
                        images={images}
                        pinoryId={pinory.id}
                        onImageClick={(index) => {
                            setCurrentImageIndex(index);
                            setShowLightbox(true);
                        }}
                    />
                </div>
            )}

            {/* Place Info */}
            <div className="space-y-3">
                <h2 className="text-xl font-bold text-foreground">
                    {pinory.name}
                </h2>
                <p className="text-sm text-muted-foreground flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-purple-400" />
                    <span>{pinory.address}</span>
                </p>
                {rating && (
                    <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium text-foreground">
                            {rating}/5
                        </span>
                    </div>
                )}
            </div>

            {/* Note */}
            {note && (
                <div className="bg-purple-900/10 p-4 rounded-lg border border-purple-500/20">
                    <p className="text-sm text-foreground italic">
                        &quot;{note}&quot;
                    </p>
                </div>
            )}

            {/* Visit Date */}
            {visitDate && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card/50 p-3 rounded-lg">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span>Visited on {formatVisitDate(visitDate)}</span>
                </div>
            )}
        </>
    );

    // ============================================
    // SLOT: Actions (shared for mobile and desktop)
    // ============================================
    const actionButtons = (
        <div className="flex gap-2">
            <Button
                variant="outline"
                onClick={handleDirections}
                disabled={isGettingDirections}
                className="flex-1 h-11 bg-blue-900/50 hover:bg-blue-800/60 border-blue-700/50 text-blue-300 font-semibold text-sm rounded-xl"
            >
                <Navigation
                    className={cn(
                        "h-4 w-4 mr-1.5",
                        isGettingDirections && "animate-spin"
                    )}
                />
                Directions
            </Button>
            <Button
                variant="outline"
                onClick={onAddToFavorites}
                className="flex-1 h-11 bg-purple-900/50 hover:bg-purple-800/60 border-purple-700/50 text-purple-300 font-semibold text-sm rounded-xl"
            >
                <Heart className="h-4 w-4 mr-1.5" />
                Add to Favorites
            </Button>
        </div>
    );

    return (
        <PinoryDetailsBase
            isOpen={isOpen}
            onClose={onClose}
            pinory={pinory}
            theme="friend"
            mobileHeader={mobileHeader}
            desktopHeader={desktopHeader}
            mainContent={mainContent}
            mobileActions={actionButtons}
            desktopActions={actionButtons}
            currentImageIndex={currentImageIndex}
            onImageIndexChange={setCurrentImageIndex}
            showLightbox={showLightbox}
            onLightboxChange={setShowLightbox}
        />
    );
}
