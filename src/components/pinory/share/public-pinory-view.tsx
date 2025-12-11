"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    MapPin,
    Calendar,
    Tag,
    Eye,
    ArrowRight,
    UserCircle2,
} from "lucide-react";
import Image from "next/image";
import { SmartImageGallery } from "@/components/pinory/details/smart-image-gallery";
import type { Pinory } from "@/lib/types";

interface PublicPinoryViewProps {
    pinory: Pinory;
    shareInfo?: {
        viewCount: number;
        createdAt: Date;
        visibility: string;
    };
}

/**
 * PublicPinoryView - Standalone page view for public shared pinories
 * Used when: Not logged in OR logged in but viewing public share
 * Features: Read-only, CTA to sign up, SEO-friendly
 */
export function PublicPinoryView({ pinory, shareInfo }: PublicPinoryViewProps) {
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
                        <Button
                            variant="default"
                            className="bg-brand hover:bg-brand/90"
                        >
                            Sign up to save
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-8">
                <div className="space-y-6">
                    {/* Creator Info */}
                    {pinory.creator && (
                        <div className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
                            {pinory.creator.avatarUrl ? (
                                <Image
                                    src={pinory.creator.avatarUrl}
                                    alt={
                                        pinory.creator.name ||
                                        pinory.creator.email
                                    }
                                    width={48}
                                    height={48}
                                    className="rounded-full"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                                    <UserCircle2 className="w-8 h-8 text-muted-foreground" />
                                </div>
                            )}
                            <div>
                                <p className="font-semibold text-foreground">
                                    {pinory.creator.name ||
                                        pinory.creator.email}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    shared this location
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Images */}
                    {images.length > 0 && (
                        <div className="rounded-2xl overflow-hidden border border-border">
                            <SmartImageGallery
                                images={images}
                                pinoryId={pinory.id}
                                onImageClick={() => {}}
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
                                <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-500" />
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
                                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                                    {pinory.note || pinory.content}
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

                    {/* CTA Card */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white">
                        <h2 className="text-2xl font-bold mb-2">
                            Create Your Own Pinories
                        </h2>
                        <p className="text-blue-100 mb-6 max-w-md mx-auto">
                            Save your favorite places in Hanoi, share with
                            friends, and plan amazing trips together.
                        </p>
                        <Button
                            variant="secondary"
                            size="lg"
                            className="bg-white text-blue-600 hover:bg-gray-100"
                        >
                            Get Started
                            <ArrowRight className="h-5 w-5 ml-2" />
                        </Button>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-border mt-16 py-8">
                <div className="max-w-4xl mx-auto px-4 text-center text-sm text-muted-foreground">
                    <p>
                        Powered by <span className="font-semibold">Pinory</span>{" "}
                        - Your Hanoi travel companion
                    </p>
                </div>
            </footer>
        </div>
    );
}
