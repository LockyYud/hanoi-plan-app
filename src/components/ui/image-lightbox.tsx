"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { isValidImageUrl, ImageDisplay } from "@/lib/image-utils";
import Image from "next/image";

/**
 * ImageLightbox - Unified lightbox component với phong cách Instant Film (Polaroid/Instax)
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
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);

    // Reset state when lightbox opens/closes (uncontrolled mode only)
    useEffect(() => {
        if (isOpen && !isControlled) {
            setInternalIndex(initialIndex);
            setImageLoaded(false);
        }
    }, [isOpen, initialIndex, isControlled]);

    // Reset loading state when image changes
    useEffect(() => {
        setImageLoaded(false);
        setIsTransitioning(true);
        const timer = setTimeout(() => setIsTransitioning(false), 300);
        return () => clearTimeout(timer);
    }, [currentIndex]);

    // Navigation handlers - use controlled or internal
    const goToPrevious = useCallback(() => {
        if (isControlled && onPrevious) {
            onPrevious();
        } else {
            setInternalIndex((prev: number) =>
                prev > 0 ? prev - 1 : images.length - 1
            );
        }
    }, [isControlled, onPrevious, images.length]);

    const goToNext = useCallback(() => {
        if (isControlled && onNext) {
            onNext();
        } else {
            setInternalIndex((prev: number) =>
                prev < images.length - 1 ? prev + 1 : 0
            );
        }
    }, [isControlled, onNext, images.length]);

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
    }, [isOpen, goToPrevious, goToNext, onClose]);

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

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Xem ảnh toàn màn hình"
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8 animate-in fade-in duration-300"
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
            {/* Instant Film Frame - Polaroid/Instax Style */}
            <div
                className="relative bg-white flex flex-col w-full max-w-[92vw] sm:max-w-[85vw] md:max-w-[75vw] lg:max-w-[900px] max-h-[90vh] sm:max-h-[88vh]"
                style={{
                    boxShadow:
                        "0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button - góc trên phải của khung */}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onClose();
                    }}
                    className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-white hover:bg-gray-100 text-gray-600 hover:text-gray-900 p-2 sm:p-2.5 rounded-full shadow-lg z-10 transition-all duration-200 active:scale-95"
                    aria-label="Đóng lightbox"
                >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2.5} />
                </button>

                {/* Image Container - với padding kiểu instant film */}
                <div
                    className="relative flex-1 flex items-center justify-center bg-white overflow-hidden"
                    style={{
                        // Padding kiểu Polaroid: đều 3 cạnh trên/trái/phải
                        padding: "clamp(12px, 3vw, 24px)",
                        paddingBottom: "clamp(8px, 2vw, 16px)",
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* Inner frame - viền trong cho ảnh */}
                    <div className="relative w-full h-full flex items-center justify-center bg-gray-50 min-h-[200px] sm:min-h-[280px] md:min-h-[350px] max-h-[55vh] sm:max-h-[58vh] md:max-h-[62vh]">
                        {/* Loading skeleton */}
                        {!imageLoaded && (
                            <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
                                <div className="text-gray-300">
                                    <svg
                                        className="w-12 h-12 sm:w-16 sm:h-16 animate-spin-slow"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        />
                                    </svg>
                                </div>
                            </div>
                        )}

                        <div
                            className={`relative w-full h-full flex items-center justify-center transition-opacity duration-300 ${
                                isTransitioning ? "opacity-0" : "opacity-100"
                            }`}
                        >
                            {isValidImageUrl(currentImage) ? (
                                <>
                                    <ImageDisplay
                                        src={currentImage}
                                        alt={`Ảnh ${currentIndex + 1}`}
                                        className={`max-w-full max-h-full object-contain transition-opacity duration-500 ${
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
                                        onLoad={() => {
                                            setImageLoaded(true);
                                        }}
                                        priority
                                    />
                                </>
                            ) : (
                                <div className="flex items-center justify-center text-gray-400">
                                    <div className="text-center">
                                        <div className="text-4xl sm:text-5xl mb-2">
                                            📷
                                        </div>
                                        <div className="text-sm sm:text-base">
                                            Không thể tải ảnh
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Caption Area - phần dưới lớn hơn kiểu Polaroid */}
                <div
                    className="flex-shrink-0 bg-white flex flex-col justify-center"
                    style={{
                        padding: "clamp(16px, 4vw, 28px)",
                        paddingTop: "clamp(12px, 3vw, 20px)",
                        minHeight: "clamp(70px, 12vh, 100px)",
                    }}
                >
                    {/* Title */}
                    <h3
                        className="text-gray-800 font-medium truncate"
                        style={{
                            fontSize: "clamp(14px, 3.5vw, 18px)",
                            fontFamily:
                                'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
                            letterSpacing: "0.01em",
                        }}
                    >
                        {title || "Ảnh"}
                    </h3>

                    {/* Counter & Navigation dots */}
                    <div className="flex items-center justify-between mt-2">
                        <p
                            className="text-gray-400"
                            style={{
                                fontSize: "clamp(11px, 2.5vw, 13px)",
                                fontFamily:
                                    'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                            }}
                        >
                            {currentIndex + 1} / {images.length}
                        </p>

                        {/* Navigation dots for mobile */}
                        {images.length > 1 && images.length <= 10 && (
                            <div className="flex gap-1.5 sm:gap-2">
                                {images.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            if (!isControlled) {
                                                setInternalIndex(idx);
                                            }
                                        }}
                                        className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-200 ${
                                            idx === currentIndex
                                                ? "bg-gray-700 scale-125"
                                                : "bg-gray-300 hover:bg-gray-400"
                                        }`}
                                        aria-label={`Xem ảnh ${idx + 1}`}
                                        disabled={isControlled}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Swipe hint for mobile */}
                    {images.length > 1 && (
                        <p className="text-gray-300 text-xs mt-2 md:hidden text-center">
                            ← Vuốt để xem ảnh khác →
                        </p>
                    )}
                </div>
            </div>

            {/* Navigation buttons - desktop only */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            goToPrevious();
                        }}
                        className="hidden md:flex absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 p-3 lg:p-4 rounded-full shadow-lg transition-all duration-200 items-center justify-center hover:scale-105 active:scale-95"
                        aria-label="Ảnh trước"
                        disabled={isTransitioning}
                    >
                        <ChevronLeft
                            className="h-5 w-5 lg:h-6 lg:w-6"
                            strokeWidth={2}
                        />
                    </button>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            goToNext();
                        }}
                        className="hidden md:flex absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900 p-3 lg:p-4 rounded-full shadow-lg transition-all duration-200 items-center justify-center hover:scale-105 active:scale-95"
                        aria-label="Ảnh tiếp theo"
                        disabled={isTransitioning}
                    >
                        <ChevronRight
                            className="h-5 w-5 lg:h-6 lg:w-6"
                            strokeWidth={2}
                        />
                    </button>
                </>
            )}
        </div>
    );
}
