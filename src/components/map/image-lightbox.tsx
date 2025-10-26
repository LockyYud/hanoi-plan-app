"use client";

import { useEffect } from "react";
import { X, ChevronRight } from "lucide-react";
import { ImageDisplay } from "@/lib/image-utils";

interface ImageLightboxProps {
    images: string[];
    currentIndex: number;
    isOpen: boolean;
    onClose: () => void;
    onNext: () => void;
    onPrevious: () => void;
}

export function ImageLightbox({
    images,
    currentIndex,
    isOpen,
    onClose,
    onNext,
    onPrevious,
}: ImageLightboxProps) {
    // Handle ESC key
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === "Escape" && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEsc);
            return () => document.removeEventListener("keydown", handleEsc);
        }
    }, [isOpen, onClose]);

    // Handle arrow keys
    useEffect(() => {
        const handleArrowKeys = (event: KeyboardEvent) => {
            if (!isOpen) return;

            if (event.key === "ArrowLeft") {
                onPrevious();
            } else if (event.key === "ArrowRight") {
                onNext();
            }
        };

        if (isOpen && images.length > 1) {
            document.addEventListener("keydown", handleArrowKeys);
            return () =>
                document.removeEventListener("keydown", handleArrowKeys);
        }
    }, [isOpen, images.length, onNext, onPrevious]);

    if (!isOpen || !images.length) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="Xem ảnh toàn màn hình"
            className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={(e) => {
                console.log("Backdrop clicked");
                // Only close if clicking the backdrop itself
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
            <div className="relative max-w-4xl max-h-full animate-in zoom-in-95 duration-300">
                <ImageDisplay
                    src={images[currentIndex]}
                    alt={`Ảnh ${currentIndex + 1}`}
                    className="max-w-full max-h-full object-contain rounded-2xl border-2 border-neutral-700 shadow-2xl"
                />

                {/* Close button - Enhanced */}
                <button
                    onClick={() => {
                        console.log("Close button clicked");
                        onClose();
                    }}
                    className="absolute top-4 right-4 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white p-3 rounded-xl transition-all duration-200 border-2 border-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 z-10"
                    aria-label="Đóng lightbox"
                >
                    <X className="h-5 w-5" strokeWidth={2.5} />
                </button>

                {/* Navigation buttons - Enhanced */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={onPrevious}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] hover:from-[#FF5555] hover:to-[#FF7A3D] text-white p-3 rounded-xl transition-all duration-200 border-2 border-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 z-10"
                            aria-label="Ảnh trước"
                        >
                            <ChevronRight
                                className="h-6 w-6 rotate-180"
                                strokeWidth={2.5}
                            />
                        </button>
                        <button
                            onClick={onNext}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] hover:from-[#FF5555] hover:to-[#FF7A3D] text-white p-3 rounded-xl transition-all duration-200 border-2 border-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 z-10"
                            aria-label="Ảnh tiếp theo"
                        >
                            <ChevronRight
                                className="h-6 w-6"
                                strokeWidth={2.5}
                            />
                        </button>
                    </>
                )}

                {/* Image counter - Enhanced */}
                <div
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-neutral-900/95 to-neutral-800/95 text-white px-5 py-2.5 rounded-xl border border-neutral-600 backdrop-blur-md shadow-xl font-bold"
                    style={{ fontSize: "var(--text-sm)" }}
                >
                    <span className="text-[#FF6B6B]">{currentIndex + 1}</span> /{" "}
                    {images.length}
                </div>
            </div>
        </div>
    );
}
