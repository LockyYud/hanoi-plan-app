"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    MapPin,
    Calendar,
    Tag,
    Heart,
    Navigation,
    Eye,
    UserCircle2,
    Home,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SmartImageGallery } from "@/components/pinory/details/smart-image-gallery";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { useDirections } from "@/components/pinory/base/hooks";
import { cn } from "@/lib/utils";
import type { Pinory } from "@/lib/types";

interface FriendPinoryShareViewProps {
    pinory: Pinory;
    shareInfo?: {
        viewCount: number;
        createdAt: Date;
        visibility: string;
    };
}

/**
 * FriendPinoryShareView - View for friends accessing shared pinory via link
 * Used when: Logged in + Is Friend of owner
 * Features: Can add to favorites, get directions, view full details
 */
export function FriendPinoryShareView({
    pinory,
    shareInfo,
}: FriendPinoryShareViewProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showLightbox, setShowLightbox] = useState(false);

    const { isGettingDirections, handleGetDirections } = useDirections({
        toastId: "friend-share-directions",
    });

    const formatDate = (date: Date | string | undefined) => {
        if (!date) return "";
        try {
            return new Date(date).toLocaleDateString("vi-VN", {
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
            address: pinory.address || "",
            lat: pinory.lat,
            lng: pinory.lng,
        });
    }, [pinory, handleGetDirections]);

    const handleAddToFavorites = async () => {
        // Future: Implement add to favorites API call
        console.log("Add to favorites:", pinory.id);
    };

    const images = pinory.images || pinory.media?.map((m) => m.url) || [];

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="text-2xl">📍</div>
                            <span className="font-bold text-xl text-brand-accent">
                                Pinory
                            </span>
                        </div>
                        <Link href="/">
                            <Button variant="ghost" size="sm">
                                <Home className="h-4 w-4 mr-2" />
                                Back to App
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="space-y-6">
                    {/* Friend Badge & Creator Info */}
                    {pinory.creator && (
                        <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-xl border border-purple-500/30 p-4">
                            <div className="flex items-center gap-3">
                                {pinory.creator.avatarUrl ? (
                                    <Image
                                        src={pinory.creator.avatarUrl}
                                        alt={
                                            pinory.creator.name ||
                                            pinory.creator.email
                                        }
                                        width={48}
                                        height={48}
                                        className="rounded-full border-2 border-purple-400"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-purple-500/20 border-2 border-purple-400 flex items-center justify-center">
                                        <UserCircle2 className="w-8 h-8 text-purple-300" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-purple-300">
                                            {pinory.creator.name ||
                                                pinory.creator.email}
                                        </p>
                                        <Badge
                                            variant="secondary"
                                            className="bg-purple-500/20 text-purple-300 border-purple-500/30"
                                        >
                                            Friend
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-purple-200/70">
                                        shared this location with you
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Images */}
                    {images.length > 0 && (
                        <div className="rounded-2xl overflow-hidden border border-border">
                            <SmartImageGallery
                                images={images}
                                pinoryId={pinory.id}
                                onImageClick={(index) => {
                                    setCurrentImageIndex(index);
                                    setShowLightbox(true);
                                }}
                                variant="desktop"
                            />
                        </div>
                    )}

                    {/* Place Info Card */}
                    <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground mb-2">
                                {pinory.name}
                            </h1>
                            <p className="text-muted-foreground flex items-start gap-2">
                                <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0 text-purple-500" />
                                <span>{pinory.address}</span>
                            </p>
                        </div>

                        {/* Tags */}
                        {(pinory.categoryName || pinory.visitDate) && (
                            <div className="flex flex-wrap gap-2">
                                {pinory.categoryName && (
                                    <Badge
                                        variant="secondary"
                                        className="flex items-center gap-1"
                                    >
                                        <Tag className="h-3 w-3" />
                                        {pinory.categoryName}
                                    </Badge>
                                )}
                                {pinory.visitDate && (
                                    <Badge
                                        variant="outline"
                                        className="flex items-center gap-1"
                                    >
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(pinory.visitDate)}
                                    </Badge>
                                )}
                            </div>
                        )}

                        {/* Note/Content */}
                        {(pinory.note || pinory.content) && (
                            <div className="pt-4 border-t border-border">
                                <p className="text-foreground leading-relaxed whitespace-pre-wrap italic">
                                    &quot;{pinory.note || pinory.content}&quot;
                                </p>
                            </div>
                        )}

                        {/* Rating */}
                        {pinory.rating && (
                            <div className="flex items-center gap-2">
                                <span className="text-yellow-500 text-xl">
                                    ⭐
                                </span>
                                <span className="font-semibold text-foreground">
                                    {pinory.rating}/5
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="sticky bottom-4 bg-card/95 backdrop-blur-xl rounded-2xl border border-border p-4 shadow-lg">
                        <div className="flex gap-3">
                            <Button
                                onClick={handleDirections}
                                disabled={isGettingDirections}
                                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
                            >
                                <Navigation
                                    className={cn(
                                        "h-5 w-5 mr-2",
                                        isGettingDirections && "animate-spin"
                                    )}
                                />
                                Get Directions
                            </Button>
                            <Button
                                onClick={handleAddToFavorites}
                                variant="outline"
                                className="flex-1 h-12 border-purple-500/50 hover:bg-purple-500/10"
                            >
                                <Heart className="h-5 w-5 mr-2" />
                                Add to Favorites
                            </Button>
                        </div>
                    </div>

                    {/* Stats */}
                    {shareInfo && (
                        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground p-4 bg-muted rounded-xl">
                            <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                <span>{shareInfo.viewCount} views</span>
                            </div>
                            <span>•</span>
                            <span>
                                Shared {formatDate(shareInfo.createdAt)}
                            </span>
                        </div>
                    )}
                </div>
            </main>

            {/* Image Lightbox */}
            <ImageLightbox
                images={images}
                currentIndex={currentImageIndex}
                isOpen={showLightbox}
                onClose={() => setShowLightbox(false)}
                onNext={() => {
                    setCurrentImageIndex((prev) =>
                        prev === images.length - 1 ? 0 : prev + 1
                    );
                }}
                onPrevious={() => {
                    setCurrentImageIndex((prev) =>
                        prev === 0 ? images.length - 1 : prev - 1
                    );
                }}
                title={pinory.name}
            />
        </div>
    );
}
