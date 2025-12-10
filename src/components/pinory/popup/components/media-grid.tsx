"use client";

import { Play } from "lucide-react";
import { isValidImageUrl, ImageDisplay } from "@/lib/image-utils";
import { cn } from "@/lib/utils";

// Helper function to check if a URL is a video
const isVideoUrl = (url: string): boolean => {
    const videoExtensions = [".mp4", ".webm", ".mov", ".avi", ".mkv"];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some((ext) => lowerUrl.includes(ext));
};

// Media Item Component with video indicator
interface MediaItemProps {
    readonly src: string;
    readonly className?: string;
    readonly showOverlay?: boolean;
    readonly overlayCount?: number;
}

function MediaItem({
    src,
    className,
    showOverlay,
    overlayCount,
}: MediaItemProps) {
    const isVideo = isVideoUrl(src);

    return (
        <div className={cn("relative overflow-hidden bg-secondary", className)}>
            {isVideo ? (
                <>
                    <video
                        src={src}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                    />
                    {/* Video Play Indicator */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                        </div>
                    </div>
                    {/* Video Duration Badge */}
                    <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/70 backdrop-blur-sm">
                        <span className="text-white text-[10px] font-medium">
                            0:00
                        </span>
                    </div>
                </>
            ) : isValidImageUrl(src) ? (
                <ImageDisplay
                    src={src}
                    alt=""
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <span className="text-lg text-muted-foreground">📷</span>
                </div>
            )}
            {showOverlay && overlayCount && overlayCount > 0 && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-white text-lg font-bold">
                        +{overlayCount}
                    </span>
                </div>
            )}
        </div>
    );
}

// Smart Media Grid Component - Apple Journal style layout
interface MediaGridProps {
    readonly images: string[];
}

export function MediaGrid({ images }: MediaGridProps) {
    const count = images.length;

    if (count === 0) return null;

    // 1 image: Full width with 4:3 aspect ratio
    if (count === 1) {
        return (
            <div className="p-1">
                <MediaItem
                    src={images[0]}
                    className="aspect-[4/3] rounded-lg"
                />
            </div>
        );
    }

    // 2 images: Two equal columns
    if (count === 2) {
        return (
            <div className="grid grid-cols-2 gap-1 p-1">
                {images.map((img) => (
                    <MediaItem
                        key={img}
                        src={img}
                        className="aspect-square rounded-lg"
                    />
                ))}
            </div>
        );
    }

    // 3 images: Hero left + 2 stacked right
    if (count === 3) {
        return (
            <div className="grid grid-cols-2 gap-1 p-1">
                {/* Hero image - spans 2 rows */}
                <MediaItem
                    src={images[0]}
                    className="aspect-square rounded-lg row-span-2"
                />
                {/* Right column - 2 stacked images */}
                <MediaItem
                    src={images[1]}
                    className="aspect-[2/1] rounded-lg"
                />
                <MediaItem
                    src={images[2]}
                    className="aspect-[2/1] rounded-lg"
                />
            </div>
        );
    }

    // 4 images: Hero left + 3 right (1 top, 2 bottom)
    if (count === 4) {
        return (
            <div className="grid grid-cols-2 gap-1 p-1">
                {/* Hero image - spans 2 rows */}
                <div className="row-span-2">
                    <MediaItem
                        src={images[0]}
                        className="aspect-square rounded-lg h-full"
                    />
                </div>
                {/* Right column */}
                <MediaItem
                    src={images[1]}
                    className="aspect-[2/1] rounded-lg"
                />
                <div className="grid grid-cols-2 gap-1">
                    <MediaItem
                        src={images[2]}
                        className="aspect-square rounded-lg"
                    />
                    <MediaItem
                        src={images[3]}
                        className="aspect-square rounded-lg"
                    />
                </div>
            </div>
        );
    }

    // 5+ images: Hero left + 2x2 grid right with overlay
    return (
        <div className="grid grid-cols-2 gap-1 p-1">
            {/* Hero image - spans 2 rows */}
            <div className="row-span-2">
                <MediaItem
                    src={images[0]}
                    className="aspect-square rounded-lg h-full"
                />
            </div>
            {/* Right column - 2x2 grid */}
            <div className="grid grid-cols-2 gap-1">
                <MediaItem
                    src={images[1]}
                    className="aspect-square rounded-lg"
                />
                <MediaItem
                    src={images[2]}
                    className="aspect-square rounded-lg"
                />
            </div>
            <div className="grid grid-cols-2 gap-1">
                <MediaItem
                    src={images[3]}
                    className="aspect-square rounded-lg"
                />
                <MediaItem
                    src={images[4]}
                    className="aspect-square rounded-lg"
                    showOverlay={count > 5}
                    overlayCount={count - 5}
                />
            </div>
        </div>
    );
}
