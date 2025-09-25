"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft,
    ChevronRight,
    X,
    ZoomIn,
    ZoomOut,
    Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isValidImageUrl, ImageDisplay } from "@/lib/image-utils";

interface ImageLightboxProps {
    images: string[];
    initialIndex?: number;
    isOpen: boolean;
    onClose: () => void;
}

export function ImageLightbox({
    images,
    initialIndex = 0,
    isOpen,
    onClose,
}: ImageLightboxProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    // Reset state when lightbox opens/closes
    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
            setZoom(1);
            setPosition({ x: 0, y: 0 });
        }
    }, [isOpen, initialIndex]);

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
                case "=":
                case "+":
                    handleZoomIn();
                    break;
                case "-":
                    handleZoomOut();
                    break;
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, currentIndex]);

    const goToPrevious = () => {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
        resetZoom();
    };

    const goToNext = () => {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
        resetZoom();
    };

    const handleZoomIn = () => {
        setZoom((prev) => Math.min(prev * 1.5, 4));
    };

    const handleZoomOut = () => {
        setZoom((prev) => Math.max(prev / 1.5, 0.5));
    };

    const resetZoom = () => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    };

    const handleDownload = async () => {
        const currentImage = images[currentIndex];
        if (!currentImage) return;

        try {
            const response = await fetch(currentImage);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `image-${currentIndex + 1}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error downloading image:", error);
        }
    };

    // Mouse drag handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoom > 1) {
            setIsDragging(true);
            setDragStart({
                x: e.clientX - position.x,
                y: e.clientY - position.y,
            });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && zoom > 1) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y,
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    if (!isOpen || images.length === 0) return null;

    const currentImage = images[currentIndex];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-0 overflow-hidden">
                <div className="relative w-full h-full flex items-center justify-center">
                    {/* Close button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="absolute top-4 right-4 z-20 h-10 w-10 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all duration-200"
                    >
                        <X className="h-5 w-5" />
                    </Button>

                    {/* Image counter */}
                    <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
                        {currentIndex + 1} / {images.length}
                    </div>

                    {/* Controls */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-2 bg-black/50 rounded-full px-4 py-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleZoomOut}
                            disabled={zoom <= 0.5}
                            className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
                        >
                            <ZoomOut className="h-4 w-4" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetZoom}
                            className="h-8 px-3 text-white hover:bg-white/20 rounded-full text-xs"
                        >
                            {Math.round(zoom * 100)}%
                        </Button>

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleZoomIn}
                            disabled={zoom >= 4}
                            className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
                        >
                            <ZoomIn className="h-4 w-4" />
                        </Button>

                        <div className="w-px h-4 bg-white/30 mx-1" />

                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDownload}
                            className="h-8 w-8 p-0 text-white hover:bg-white/20 rounded-full"
                        >
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Navigation buttons */}
                    {images.length > 1 && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={goToPrevious}
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 h-12 w-12 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all duration-200"
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={goToNext}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 h-12 w-12 p-0 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all duration-200"
                            >
                                <ChevronRight className="h-6 w-6" />
                            </Button>
                        </>
                    )}

                    {/* Main image */}
                    <div
                        className="relative w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        {isValidImageUrl(currentImage) ? (
                            <ImageDisplay
                                src={currentImage}
                                alt={`Image ${currentIndex + 1}`}
                                className="max-w-full max-h-full object-contain transition-transform duration-200"
                                style={{
                                    transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                                    cursor:
                                        zoom > 1
                                            ? isDragging
                                                ? "grabbing"
                                                : "grab"
                                            : "default",
                                }}
                                priority
                            />
                        ) : (
                            <div className="flex items-center justify-center text-white/70">
                                <div className="text-center">
                                    <div className="text-4xl mb-2">📷</div>
                                    <div>Không thể tải ảnh</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Thumbnail strip */}
                    {images.length > 1 && (
                        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-20 flex gap-2 bg-black/50 rounded-lg p-2 max-w-[90vw] overflow-x-auto">
                            {images.map((image, index) => (
                                <button
                                    key={index}
                                    onClick={() => {
                                        setCurrentIndex(index);
                                        resetZoom();
                                    }}
                                    className={cn(
                                        "relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 flex-shrink-0",
                                        currentIndex === index
                                            ? "border-white"
                                            : "border-transparent hover:border-white/50"
                                    )}
                                >
                                    {isValidImageUrl(image) ? (
                                        <ImageDisplay
                                            src={image}
                                            alt={`Thumbnail ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-white/20 flex items-center justify-center">
                                            <span className="text-xs">📷</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
