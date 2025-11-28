"use client";

import { memo, useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// Random rotations for natural look
const ROTATIONS = [
    "rotate-0",
    "rotate-1",
    "-rotate-1",
    "rotate-2",
    "-rotate-2",
    "rotate-3",
    "-rotate-3",
];

interface ClusterMarkerProps {
    pointCount: number;
    onClick: () => void;
    imageUrls?: string[]; // Array of image URLs from locations in cluster
    rotationInterval?: number; // Interval in ms to rotate images (default: 3000)
}

export const ClusterMarker = memo(
    ({
        pointCount,
        onClick,
        imageUrls = [],
        rotationInterval = 3000,
    }: ClusterMarkerProps) => {
        // Random rotation for natural look
        const randomRotation = useMemo(() => {
            return ROTATIONS[Math.floor(Math.random() * ROTATIONS.length)];
        }, []);

        // State for current image index
        const [currentImageIndex, setCurrentImageIndex] = useState(0);

        // Auto-rotate images if there are multiple images
        useEffect(() => {
            if (imageUrls.length <= 1) return;

            const interval = setInterval(() => {
                setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length);
            }, rotationInterval);

            return () => clearInterval(interval);
        }, [imageUrls.length, rotationInterval]);

        // Get current image
        const selectedImage = useMemo(() => {
            if (imageUrls.length === 0) return null;
            return imageUrls[currentImageIndex];
        }, [imageUrls, currentImageIndex]);

        // Size configuration based on point count
        const getSizeConfig = (count: number) => {
            if (count < 10)
                return {
                    container: "w-16 h-20",
                    image: "w-14 h-14",
                    imagePx: 56,
                    border: "border-2",
                    badge: "w-6 h-6 text-xs",
                };
            if (count < 50)
                return {
                    container: "w-20 h-24",
                    image: "w-18 h-18",
                    imagePx: 72,
                    border: "border-2",
                    badge: "w-7 h-7 text-sm",
                };
            if (count < 100)
                return {
                    container: "w-24 h-28",
                    image: "w-22 h-22",
                    imagePx: 88,
                    border: "border-2",
                    badge: "w-8 h-8 text-base",
                };
            return {
                container: "w-28 h-32",
                image: "w-26 h-26",
                imagePx: 104,
                border: "border-2",
                badge: "w-9 h-9 text-lg",
            };
        };

        const config = getSizeConfig(pointCount);

        const handleClick = (e: React.MouseEvent) => {
            e.stopPropagation();
            onClick();
        };

        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
            }
        };

        return (
            <button
                type="button"
                tabIndex={0}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                aria-label={`Cluster of ${pointCount} markers. Click to expand.`}
                className={cn(
                    "relative cursor-pointer transition-all duration-300 ease-out group",
                    "hover:scale-110 hover:z-20",
                    "transform-gpu",
                    "border-0 p-0 bg-transparent",
                    "focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] focus:ring-offset-2",
                    randomRotation,
                    config.container
                )}
                style={{
                    filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.25))",
                }}
            >
                {/* Photo container with thin border */}
                <div
                    className={cn(
                        "relative bg-white rounded-sm overflow-hidden",
                        "transition-all duration-300 group-hover:shadow-2xl",
                        "border border-neutral-200",
                        config.border,
                        config.image
                    )}
                >
                    {/* Photo image or placeholder */}
                    {selectedImage ? (
                        <Image
                            src={selectedImage}
                            alt={`Cluster of ${pointCount} locations`}
                            width={config.imagePx}
                            height={config.imagePx}
                            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                        />
                    ) : (
                        // Fallback gradient background if no images
                        <div
                            className="w-full h-full bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400"
                            style={{
                                backgroundSize: "200% 200%",
                                animation: "gradientShift 3s ease infinite",
                            }}
                        />
                    )}

                    {/* Count badge in top-right corner */}
                    <div
                        className={cn(
                            "absolute -top-1.5 -right-1.5",
                            "rounded-full border-2 border-white",
                            "flex items-center justify-center",
                            "shadow-xl group-hover:scale-110 transition-transform duration-300",
                            "bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] text-white font-bold",
                            config.badge
                        )}
                    >
                        <span className="leading-none drop-shadow-sm">
                            {pointCount}
                        </span>
                    </div>

                    {/* Image pagination dots - only show if multiple images */}
                    {imageUrls.length > 1 && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                            {imageUrls.slice(0, 5).map((url, idx) => (
                                <div
                                    key={`${url}-${idx}`}
                                    className={cn(
                                        "w-1 h-1 rounded-full transition-all duration-300",
                                        currentImageIndex === idx
                                            ? "bg-white w-2"
                                            : "bg-white/50"
                                    )}
                                />
                            ))}
                            {imageUrls.length > 5 && (
                                <div className="w-1 h-1 rounded-full bg-white/30" />
                            )}
                        </div>
                    )}

                    {/* Subtle gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                    {/* Pulse ring animation */}
                    <div
                        className="absolute -inset-2 rounded-sm bg-[#FF6B6B]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{
                            animation: "clusterPulse 2s ease-in-out infinite",
                        }}
                    />
                </div>

                <style>{`
                @keyframes clusterPulse {
                    0% {
                        transform: scale(1);
                        opacity: 0.4;
                    }
                    50% {
                        transform: scale(1.1);
                        opacity: 0.2;
                    }
                    100% {
                        transform: scale(1);
                        opacity: 0.4;
                    }
                }
                @keyframes gradientShift {
                    0% {
                        background-position: 0% 50%;
                    }
                    50% {
                        background-position: 100% 50%;
                    }
                    100% {
                        background-position: 0% 50%;
                    }
                }
            `}</style>
            </button>
        );
    }
);

ClusterMarker.displayName = "ClusterMarker";
