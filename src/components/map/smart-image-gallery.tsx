"use client";

import { isValidImageUrl, ImageDisplay } from "@/lib/image-utils";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartImageGalleryProps {
    readonly images: string[];
    readonly noteId?: string;
    readonly onImageClick: (index: number) => void;
    readonly className?: string;
    readonly variant?: "desktop" | "mobile";
}

/**
 * Smart Adaptive Layout Gallery
 * Layout thay đổi thông minh theo số lượng ảnh:
 *
 * | Số ảnh | Layout                                           |
 * |--------|--------------------------------------------------|
 * | 1      | Full width, aspect ratio 4:3                     |
 * | 2      | 2 cột bằng nhau                                  |
 * | 3      | Hero trái + 2 ảnh stack phải                     |
 * | 4      | Hero trái + 1 ảnh trên + 2 ảnh dưới (phải)       |
 * | 5+     | Hero trái + 2x2 grid phải với "+X" overlay       |
 */
export function SmartImageGallery({
    images,
    noteId,
    onImageClick,
    className,
    variant = "desktop",
}: SmartImageGalleryProps) {
    const count = images.length;
    const isMobile = variant === "mobile";

    if (count === 0) return null;

    // Shared image component
    const ImageItem = ({
        src,
        index,
        aspectClass = "aspect-square",
        showOverlay = false,
        overlayCount = 0,
        className: itemClassName,
    }: {
        src: string;
        index: number;
        aspectClass?: string;
        showOverlay?: boolean;
        overlayCount?: number;
        className?: string;
    }) => (
        <button
            type="button"
            className={cn(
                "group relative bg-neutral-900 overflow-hidden transition-all duration-200 cursor-pointer",
                isMobile
                    ? "rounded-lg border border-neutral-700/50"
                    : "rounded-xl border border-neutral-700/50 hover:border-blue-500/50",
                aspectClass,
                itemClassName
            )}
            onClick={() => onImageClick(index)}
            aria-label={`Xem ảnh ${index + 1}`}
        >
            {isValidImageUrl(src) ? (
                <>
                    <ImageDisplay
                        src={src}
                        alt={`Ảnh ${index + 1}`}
                        className={cn(
                            "w-full h-full object-cover bg-neutral-950",
                            !isMobile &&
                                "group-hover:scale-105 transition-transform duration-200"
                        )}
                    />
                    {!isMobile && (
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200" />
                    )}

                    {showOverlay && overlayCount > 0 ? (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
                            <span
                                className={cn(
                                    "font-bold text-white",
                                    isMobile ? "text-2xl" : "text-4xl"
                                )}
                            >
                                +{overlayCount}
                            </span>
                        </div>
                    ) : (
                        !isMobile && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <div className="bg-black/80 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm backdrop-blur-sm">
                                    <Eye className="h-3.5 w-3.5" />
                                    <span>Xem</span>
                                </div>
                            </div>
                        )
                    )}
                </>
            ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    <div className="text-center">
                        <div
                            className={cn(
                                "mb-1",
                                isMobile ? "text-xl" : "text-3xl"
                            )}
                        >
                            📷
                        </div>
                        <div className="text-xs">Ảnh lỗi</div>
                    </div>
                </div>
            )}
        </button>
    );

    // Mobile: Compact spacing
    const gap = isMobile ? "gap-1.5" : "gap-2";

    // Layout 1: Single image - Full width, 4:3 aspect ratio
    if (count === 1) {
        return (
            <div className={cn("w-full", className)}>
                <ImageItem
                    src={images[0]}
                    index={0}
                    aspectClass="aspect-[4/3] w-full"
                />
            </div>
        );
    }

    // Layout 2: Two images - 2 equal columns
    if (count === 2) {
        return (
            <div className={cn("grid grid-cols-2", gap, className)}>
                <ImageItem
                    src={images[0]}
                    index={0}
                    aspectClass="aspect-square"
                />
                <ImageItem
                    src={images[1]}
                    index={1}
                    aspectClass="aspect-square"
                />
            </div>
        );
    }

    // Layout 3: Hero left + 2 stacked images right
    if (count === 3) {
        return (
            <div className={cn("grid grid-cols-3", gap, className)}>
                {/* Hero image - takes 2 columns */}
                <div className="col-span-2 row-span-2">
                    <ImageItem
                        src={images[0]}
                        index={0}
                        aspectClass="aspect-square h-full w-full"
                    />
                </div>
                {/* Right column - 2 stacked images */}
                <div className={cn("flex flex-col", gap)}>
                    <ImageItem
                        src={images[1]}
                        index={1}
                        aspectClass="aspect-square"
                    />
                    <ImageItem
                        src={images[2]}
                        index={2}
                        aspectClass="aspect-square"
                    />
                </div>
            </div>
        );
    }

    // Layout 4: Hero left + 1 top + 2 bottom (right)
    if (count === 4) {
        return (
            <div className={cn("grid grid-cols-3", gap, className)}>
                {/* Hero image - takes 2 columns */}
                <div className="col-span-2 row-span-2">
                    <ImageItem
                        src={images[0]}
                        index={0}
                        aspectClass="aspect-square h-full w-full"
                    />
                </div>
                {/* Right column - 1 top + 2 bottom in grid */}
                <div className={cn("flex flex-col", gap)}>
                    <ImageItem
                        src={images[1]}
                        index={1}
                        aspectClass="aspect-video"
                    />
                    <div className={cn("grid grid-cols-2", gap)}>
                        <ImageItem
                            src={images[2]}
                            index={2}
                            aspectClass="aspect-square"
                        />
                        <ImageItem
                            src={images[3]}
                            index={3}
                            aspectClass="aspect-square"
                        />
                    </div>
                </div>
            </div>
        );
    }

    // Layout 5+: Hero left + 2x2 grid right with "+X" overlay
    const remainingCount = count - 5;

    return (
        <div className={cn("grid grid-cols-3", gap, className)}>
            {/* Hero image - takes 2 columns */}
            <div className="col-span-2 row-span-2">
                <ImageItem
                    src={images[0]}
                    index={0}
                    aspectClass="aspect-square h-full w-full"
                />
            </div>
            {/* Right column - 2x2 grid */}
            <div className={cn("grid grid-cols-2", gap)}>
                <ImageItem
                    src={images[1]}
                    index={1}
                    aspectClass="aspect-square"
                />
                <ImageItem
                    src={images[2]}
                    index={2}
                    aspectClass="aspect-square"
                />
                <ImageItem
                    src={images[3]}
                    index={3}
                    aspectClass="aspect-square"
                />
                <ImageItem
                    src={images[4]}
                    index={4}
                    aspectClass="aspect-square"
                    showOverlay={remainingCount > 0}
                    overlayCount={remainingCount}
                />
            </div>
        </div>
    );
}
