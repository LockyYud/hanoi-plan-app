"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { isValidImageUrl, ImageDisplay } from "@/lib/image-utils";
import Image from "next/image";

/**
 * ImageLightbox - Unified lightbox component
 *
 * Supports two modes:
 * 1. Uncontrolled: Pass initialIndex and component manages its own state
 * 2. Controlled: Pass currentIndex, onNext, onPrevious for external control
 */
interface ImageLightboxProps {
    readonly images: string[];
    /** Initial index for uncontrolled mode */
    readonly initialIndex?: number;
    /** Current index for controlled mode */
    readonly currentIndex?: number;
    readonly isOpen: boolean;
    readonly onClose: () => void;
    /** Callback for next image (controlled mode) */
    readonly onNext?: () => void;
    /** Callback for previous image (controlled mode) */
    readonly onPrevious?: () => void;
    readonly title?: string;
}

export function ImageLightbox({
    images,
    initialIndex = 0,
    currentIndex: controlledIndex,
    isOpen,
    onClose,
    onNext,
    onPrevious,
    title,
}: Readonly<ImageLightboxProps>) {
    // Determine if controlled mode (external control via onNext/onPrevious)
    const isControlled =
        controlledIndex !== undefined &&
        onNext !== undefined &&
        onPrevious !== undefined;

    // Internal state for uncontrolled mode
    const [internalIndex, setInternalIndex] = useState(initialIndex);

    // Use controlled or internal index
    const currentIndex = isControlled ? controlledIndex : internalIndex;

    const [imageLoaded, setImageLoaded] = useState(false);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [imageDimensions, setImageDimensions] = useState<{
        width: number;
        height: number;
    } | null>(null);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);

    // Reset state when lightbox opens/closes (uncontrolled mode only)
    useEffect(() => {
        if (isOpen && !isControlled) {
            setInternalIndex(initialIndex);
            setImageLoaded(false);
            setImageDimensions(null);
        }
    }, [isOpen, initialIndex, isControlled]);

    // Reset loading state when image changes
    useEffect(() => {
        setImageLoaded(false);
        setIsTransitioning(true);
        setImageDimensions(null);
        const timer = setTimeout(() => setIsTransitioning(false), 300);
        return () => clearTimeout(timer);
    }, [currentIndex]);

    // Navigation handlers - use controlled or internal
    const goToPrevious = () => {
        if (isControlled && onPrevious) {
            onPrevious();
        } else {
            setInternalIndex((prev: number) =>
                prev > 0 ? prev - 1 : images.length - 1
            );
        }
    };

    const goToNext = () => {
        if (isControlled && onNext) {
            onNext();
        } else {
            setInternalIndex((prev: number) =>
                prev < images.length - 1 ? prev + 1 : 0
            );
        }
    };

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            switch (e.key) {
                case "Escape":
                    onClose();
                    break;
                case "ArrowLeft":
                    goToPrevious();
                    break;
                case "ArrowRight":
                    goToNext();
                    break;
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
            // Prevent body scroll when lightbox is open
            document.body.style.overflow = "hidden";
            return () => {
                document.removeEventListener("keydown", handleKeyDown);
                document.body.style.overflow = "unset";
            };
        }
    }, [isOpen, currentIndex, isControlled, onNext, onPrevious]);

    if (!isOpen || images.length === 0) return null;

    const currentImage = images[currentIndex];

    // Swipe handlers for mobile
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe && images.length > 1) {
            goToNext();
        }
        if (isRightSwipe && images.length > 1) {
            goToPrevious();
        }

        setTouchStart(0);
        setTouchEnd(0);
    };

    // Calculate container dimensions based on image aspect ratio
    const getContainerStyle = () => {
        // Default size while loading
        if (!imageDimensions || !imageLoaded) {
            return {
                width: "auto",
                height: "auto",
                maxWidth: "90vw",
                maxHeight: "90vh",
            };
        }

        const { width, height } = imageDimensions;
        const aspectRatio = width / height;

        // Available space for image (subtract padding and caption)
        const maxWidth = Math.min(window.innerWidth * 0.9, 1200);
        const maxHeight = window.innerHeight * 0.9;
        const captionHeight = 100; // Approximate caption height
        const padding = 48; // Total padding (24px * 2)

        const availableHeight = maxHeight - captionHeight;
        const availableWidth = maxWidth - padding;

        let containerWidth: number;
        let containerHeight: number;

        if (aspectRatio > availableWidth / availableHeight) {
            // Width-constrained (landscape)
            containerWidth = Math.min(availableWidth + padding, maxWidth);
            containerHeight =
                (containerWidth - padding) / aspectRatio + captionHeight;
        } else {
            // Height-constrained (portrait)
            containerHeight = Math.min(
                availableHeight + captionHeight,
                maxHeight
            );
            containerWidth =
                (containerHeight - captionHeight) * aspectRatio + padding;
        }

        return {
            width: `${Math.min(containerWidth, maxWidth)}px`,
            height: `${Math.min(containerHeight, maxHeight)}px`,
            maxWidth: "90vw",
            maxHeight: "90vh",
        };
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Xem ảnh toàn màn hình"
            className="fixed inset-0 bg-white/10 backdrop-blur-xl z-[9999] flex items-center justify-center animate-in fade-in duration-300"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
            onKeyDown={(e) => {
                if (e.key === "Escape") {
                    onClose();
                }
            }}
            tabIndex={-1}
        >
            {/* Main Container with white background */}
            <div
                className="relative bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden transition-all duration-300 pointer-events-none"
                style={getContainerStyle()}
            >
                {/* Image Container */}
                <div
                    className="relative flex-1 flex items-center justify-center p-6 bg-white overflow-hidden min-h-[400px] pointer-events-auto"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Loading skeleton */}
                    {!imageLoaded && (
                        <div className="absolute inset-6 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse rounded" />
                    )}

                    <div
                        className={`relative flex items-center justify-center transition-opacity duration-500 ${
                            isTransitioning ? "opacity-0" : "opacity-100"
                        }`}
                    >
                        {isValidImageUrl(currentImage) ? (
                            <>
                                <ImageDisplay
                                    src={currentImage}
                                    alt={`Ảnh ${currentIndex + 1}`}
                                    className={`w-auto h-auto max-w-full max-h-full object-contain transition-opacity duration-500 ${
                                        imageLoaded
                                            ? "opacity-100"
                                            : "opacity-0"
                                    }`}
                                />
                                <Image
                                    src={currentImage}
                                    alt=""
                                    width={1}
                                    height={1}
                                    className="hidden"
                                    onLoad={(e) => {
                                        const img =
                                            e.target as HTMLImageElement;
                                        setImageDimensions({
                                            width: img.naturalWidth,
                                            height: img.naturalHeight,
                                        });
                                        setImageLoaded(true);
                                    }}
                                    priority
                                />
                            </>
                        ) : (
                            <div className="flex items-center justify-center text-gray-400">
                                <div className="text-center">
                                    <div className="text-4xl mb-2">📷</div>
                                    <div>Không thể tải ảnh</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Caption at bottom */}
                <div className="bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0 pointer-events-auto">
                    <h3 className="text-gray-900 font-semibold text-lg">
                        {title || "Ảnh"}
                    </h3>
                    <p className="text-gray-500 text-sm mt-1">
                        Item {currentIndex + 1} of {images.length}
                    </p>
                </div>
            </div>

            {/* Close button - positioned over the white container */}
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClose();
                }}
                className="absolute bg-gray-600/80 hover:bg-gray-700 text-white p-2 rounded z-[200] transition-colors pointer-events-auto"
                aria-label="Đóng lightbox"
                style={{
                    top: "max(1rem, calc((100vh - 90vh) / 2 + 1rem))",
                    right: "max(1rem, calc((100vw - 90vw) / 2 + 1rem))",
                }}
            >
                <X className="h-5 w-5" strokeWidth={2} />
            </button>

            {/* Navigation buttons - desktop only, positioned independently */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            goToPrevious();
                        }}
                        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 bg-gray-600/80 hover:bg-gray-700 text-white p-3 rounded transition-colors z-[200] items-center justify-center pointer-events-auto"
                        aria-label="Ảnh trước"
                        disabled={isTransitioning}
                    >
                        <ChevronLeft className="h-6 w-6" strokeWidth={2} />
                    </button>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            goToNext();
                        }}
                        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 bg-gray-600/80 hover:bg-gray-700 text-white p-3 rounded transition-colors z-[200] items-center justify-center pointer-events-auto"
                        aria-label="Ảnh tiếp theo"
                        disabled={isTransitioning}
                    >
                        <ChevronRight className="h-6 w-6" strokeWidth={2} />
                    </button>
                </>
            )}
        </div>
    );
}
