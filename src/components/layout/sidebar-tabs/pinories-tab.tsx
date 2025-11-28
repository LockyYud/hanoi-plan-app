"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, Filter, MapPin, X, Navigation, Eye, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Pinory } from "@/lib/types";

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
    readonly isHovered?: boolean;
}

function MediaItem({
    src,
    className,
    showOverlay,
    overlayCount,
    isHovered,
}: MediaItemProps) {
    const isVideo = isVideoUrl(src);

    return (
        <div
            className={cn("relative overflow-hidden bg-neutral-800", className)}
        >
            {isVideo ? (
                <>
                    <video
                        src={src}
                        className={cn(
                            "w-full h-full object-cover transition-transform duration-300",
                            isHovered && "scale-105"
                        )}
                        muted
                        playsInline
                    />
                    {/* Video Play Indicator */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                        </div>
                    </div>
                    {/* Video Duration Badge */}
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm">
                        <span className="text-white text-xs font-medium">
                            0:00
                        </span>
                    </div>
                </>
            ) : (
                <img
                    src={src}
                    alt=""
                    className={cn(
                        "w-full h-full object-cover transition-transform duration-300",
                        isHovered && "scale-105"
                    )}
                />
            )}
            {showOverlay && overlayCount && overlayCount > 0 && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-white text-xl font-bold">
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
    readonly isHovered?: boolean;
}

function MediaGrid({ images, isHovered }: MediaGridProps) {
    const count = images.length;

    if (count === 0) return null;

    // 1 image: Full width with 4:3 aspect ratio
    if (count === 1) {
        return (
            <div className="p-1">
                <MediaItem
                    src={images[0]}
                    className="aspect-[4/3] rounded-xl"
                    isHovered={isHovered}
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
                        className="aspect-square rounded-xl"
                        isHovered={isHovered}
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
                    className="aspect-square rounded-xl row-span-2"
                    isHovered={isHovered}
                />
                {/* Right column - 2 stacked images */}
                <MediaItem
                    src={images[1]}
                    className="aspect-[2/1] rounded-xl"
                    isHovered={isHovered}
                />
                <MediaItem
                    src={images[2]}
                    className="aspect-[2/1] rounded-xl"
                    isHovered={isHovered}
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
                        className="aspect-square rounded-xl h-full"
                        isHovered={isHovered}
                    />
                </div>
                {/* Right column */}
                <MediaItem
                    src={images[1]}
                    className="aspect-[2/1] rounded-xl"
                    isHovered={isHovered}
                />
                <div className="grid grid-cols-2 gap-1">
                    <MediaItem
                        src={images[2]}
                        className="aspect-square rounded-xl"
                        isHovered={isHovered}
                    />
                    <MediaItem
                        src={images[3]}
                        className="aspect-square rounded-xl"
                        isHovered={isHovered}
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
                    className="aspect-square rounded-xl h-full"
                    isHovered={isHovered}
                />
            </div>
            {/* Right column - 2x2 grid */}
            <div className="grid grid-cols-2 gap-1">
                <MediaItem
                    src={images[1]}
                    className="aspect-square rounded-xl"
                    isHovered={isHovered}
                />
                <MediaItem
                    src={images[2]}
                    className="aspect-square rounded-xl"
                    isHovered={isHovered}
                />
            </div>
            <div className="grid grid-cols-2 gap-1">
                <MediaItem
                    src={images[3]}
                    className="aspect-square rounded-xl"
                    isHovered={isHovered}
                />
                <MediaItem
                    src={images[4]}
                    className="aspect-square rounded-xl"
                    showOverlay={count > 5}
                    overlayCount={count - 5}
                    isHovered={isHovered}
                />
            </div>
        </div>
    );
}

interface PinoriesTabProps {
    readonly session: any;
    readonly pinories: Pinory[];
    readonly filter: {
        category?: string[];
        district?: string[];
        query?: string;
    };
    readonly categories: ReadonlyArray<{
        id: string;
        name: string;
        slug: string;
        icon?: string;
        color?: string;
    }>;
    readonly isLoadingPinories: boolean;
    readonly isGettingDirections: string | null;
    readonly showFilterPopover: boolean;
    readonly setFilter: (filter: any) => void;
    readonly setShowFilterPopover: (show: boolean) => void;
    readonly setSelectedPinory: (pinory: Pinory) => void;
    readonly setSidebarOpen: (open: boolean) => void;
    readonly handleGetDirections: (place: Pinory) => void;
}

export function PinoriesTab({
    session,
    pinories,
    filter,
    categories,
    isLoadingPinories,
    isGettingDirections,
    showFilterPopover,
    setFilter,
    setShowFilterPopover,
    setSelectedPinory,
    setSidebarOpen,
    handleGetDirections,
}: PinoriesTabProps) {
    // Helper function to convert CategoryType enum to slug for filtering
    const categoryTypeToSlug = (categoryType: string): string => {
        // If it's already a slug (from location note), return as is
        if (categoryType?.includes("-")) {
            return categoryType;
        }
        // Otherwise convert CategoryType enum to lowercase slug
        return categoryType.toLowerCase();
    };

    const filteredPinories = pinories.filter((pinory) => {
        // Category filtering
        if (filter.category && filter.category.length > 0) {
            // For location notes, use categorySlug if available
            const placeSlug = categoryTypeToSlug(pinory.category || "");
            if (!filter.category.includes(placeSlug)) return false;
        }

        // District filtering
        if (filter.district && !filter.district.includes(pinory.district || ""))
            return false;
        console.log("Pinory:", pinory);
        // Query filtering
        if (
            filter.query &&
            !pinory.name.toLowerCase().includes(filter.query.toLowerCase()) &&
            !pinory.address
                .toLowerCase()
                .includes(filter.query.toLowerCase()) &&
            !pinory.content?.toLowerCase().includes(filter.query.toLowerCase())
        )
            return false;

        return true;
    });

    // Group pinories by month and year
    const groupedPinories = filteredPinories.reduce(
        (acc, pinory) => {
            const date = pinory.createdAt
                ? new Date(pinory.createdAt)
                : new Date();
            const monthYear = `${date.toLocaleString("vi-VN", { month: "long" })} ${date.getFullYear()}`;

            if (!acc[monthYear]) {
                acc[monthYear] = [];
            }
            acc[monthYear].push(pinory);
            return acc;
        },
        {} as Record<string, Pinory[]>
    );

    // Format date for display
    const formatDate = (date: Date | undefined) => {
        if (!date) return "";
        const d = new Date(date);
        return d.toLocaleString("vi-VN", {
            weekday: "long",
            day: "numeric",
            month: "short",
        });
    };

    return (
        <div className="relative h-full flex flex-col bg-[#0A0A0A]">
            {/* Header with Search - Sticky */}
            <div className="sticky top-0 z-20 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-neutral-800/50 p-4">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#A0A0A0] group-hover:text-white transition-colors duration-200" />
                    <Input
                        placeholder="Tìm kiếm kỷ niệm..."
                        value={filter.query || ""}
                        onChange={(e) =>
                            setFilter({ ...filter, query: e.target.value })
                        }
                        className="pl-12 pr-12 h-12 bg-neutral-900/60 border-neutral-800/60 focus:bg-neutral-900 focus:border-neutral-700 focus:ring-2 focus:ring-neutral-700/50 transition-all duration-200 rounded-xl text-white placeholder:text-[#A0A0A0] hover:border-neutral-700"
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFilterPopover(!showFilterPopover)}
                        className={cn(
                            "absolute right-2 top-1/2 transform -translate-y-1/2 h-9 w-9 p-0 rounded-lg transition-all duration-200",
                            showFilterPopover
                                ? "text-white bg-neutral-700"
                                : "text-[#A0A0A0] hover:text-white hover:bg-neutral-800"
                        )}
                        title="Bộ lọc"
                    >
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>

                {/* Filter Popover */}
                {showFilterPopover && (
                    <div className="mt-3 bg-neutral-900 rounded-xl border border-neutral-800 shadow-2xl p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-white">Bộ lọc</h4>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowFilterPopover(false)}
                                className="h-6 w-6 p-0 text-[#A0A0A0] hover:text-white"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Category filters */}
                        {categories.length > 0 && (
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-white">
                                    Danh mục
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map((category) => {
                                        const isActive =
                                            filter.category?.includes(
                                                category.slug
                                            );
                                        return (
                                            <Badge
                                                key={category.id}
                                                variant={
                                                    isActive
                                                        ? "default"
                                                        : "outline"
                                                }
                                                className={cn(
                                                    "cursor-pointer px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                                    isActive
                                                        ? "bg-white text-black"
                                                        : "bg-neutral-800 text-[#A0A0A0] border-neutral-700 hover:bg-neutral-700 hover:text-white"
                                                )}
                                                onClick={() => {
                                                    const currentCategories =
                                                        filter.category || [];
                                                    const newCategories =
                                                        currentCategories.includes(
                                                            category.slug
                                                        )
                                                            ? currentCategories.filter(
                                                                  (c) =>
                                                                      c !==
                                                                      category.slug
                                                              )
                                                            : [
                                                                  ...currentCategories,
                                                                  category.slug,
                                                              ];

                                                    setFilter({
                                                        ...filter,
                                                        category:
                                                            newCategories.length >
                                                            0
                                                                ? newCategories
                                                                : undefined,
                                                    });
                                                }}
                                            >
                                                {category.icon && (
                                                    <span className="mr-1">
                                                        {category.icon}
                                                    </span>
                                                )}
                                                {category.name}
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-2 border-t border-neutral-800">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setFilter({});
                                    setShowFilterPopover(false);
                                }}
                                className="flex-1 h-9 text-xs bg-neutral-800 hover:bg-neutral-700 border-neutral-700 rounded-lg text-white"
                            >
                                Đặt lại
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => setShowFilterPopover(false)}
                                className="flex-1 h-9 text-xs bg-white hover:bg-neutral-200 text-black rounded-lg"
                            >
                                Áp dụng
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-20">
                {isLoadingPinories && (
                    <div className="text-center py-12 text-[#A0A0A0]">
                        <div className="animate-spin h-8 w-8 mx-auto mb-3 border-2 border-white border-t-transparent rounded-full" />
                        <p className="text-sm">Đang tải...</p>
                    </div>
                )}

                {!isLoadingPinories &&
                    Object.keys(groupedPinories).length === 0 && (
                        <div className="text-center py-12 text-[#A0A0A0]">
                            <MapPin className="h-12 w-12 mx-auto mb-3 text-neutral-700" />
                            <p className="text-base mb-1">
                                Chưa có kỷ niệm nào
                            </p>
                            <p className="text-sm">
                                Hãy bắt đầu ghi lại những khoảnh khắc đáng nhớ
                            </p>
                        </div>
                    )}

                {!isLoadingPinories &&
                    Object.keys(groupedPinories).length > 0 && (
                        <div className="space-y-6 py-4">
                            {Object.entries(groupedPinories).map(
                                ([monthYear, items]) => (
                                    <div key={monthYear} className="space-y-4">
                                        {/* Month Header */}
                                        <h2 className="text-2xl font-bold text-white sticky top-0 bg-[#0A0A0A]/80 backdrop-blur-sm py-2 z-10">
                                            {monthYear.split(" ")[0]}
                                        </h2>

                                        {/* Pinories Grid */}
                                        <div className="space-y-4">
                                            {items.map((pinory) => {
                                                const imageCount =
                                                    pinory.images?.length || 0;

                                                return (
                                                    <Card
                                                        key={pinory.id}
                                                        className="group bg-neutral-900/50 border-neutral-800/50 hover:border-neutral-700 transition-all duration-300 cursor-pointer rounded-2xl overflow-hidden"
                                                        onClick={() => {
                                                            setSelectedPinory(
                                                                pinory
                                                            );
                                                            if (
                                                                window.innerWidth <
                                                                768
                                                            ) {
                                                                setSidebarOpen(
                                                                    false
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        {/* Media Section - Smart Adaptive Layout */}
                                                        {imageCount > 0 &&
                                                            pinory.images && (
                                                                <MediaGrid
                                                                    images={
                                                                        pinory.images
                                                                    }
                                                                    isHovered={
                                                                        false
                                                                    }
                                                                />
                                                            )}

                                                        {/* Content Section */}
                                                        <div className="p-4 space-y-2">
                                                            <h3 className="text-lg font-semibold text-white group-hover:text-neutral-200 transition-colors line-clamp-2">
                                                                {pinory.name}
                                                            </h3>

                                                            <div className="flex items-center justify-between text-sm text-[#A0A0A0]">
                                                                <span>
                                                                    {formatDate(
                                                                        pinory.createdAt
                                                                    )}
                                                                </span>
                                                                <button
                                                                    onClick={(
                                                                        e
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        // More options menu
                                                                    }}
                                                                    className="p-1 hover:bg-neutral-800 rounded-lg transition-colors"
                                                                >
                                                                    <svg
                                                                        className="w-5 h-5"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                                                        />
                                                                    </svg>
                                                                </button>
                                                            </div>

                                                            {/* Location info */}
                                                            {pinory.address && (
                                                                <div className="flex items-start gap-2 text-xs text-[#A0A0A0]">
                                                                    <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                                                                    <span className="line-clamp-1">
                                                                        {
                                                                            pinory.address
                                                                        }
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {/* Quick actions */}
                                                            <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="flex-1 h-8 text-xs bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg"
                                                                    onClick={(
                                                                        e
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        handleGetDirections(
                                                                            pinory
                                                                        );
                                                                    }}
                                                                    disabled={
                                                                        isGettingDirections ===
                                                                        pinory.id
                                                                    }
                                                                >
                                                                    <Navigation className="h-3.5 w-3.5 mr-1.5" />
                                                                    Chỉ đường
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="flex-1 h-8 text-xs bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg"
                                                                    onClick={(
                                                                        e
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        setSelectedPinory(
                                                                            pinory
                                                                        );
                                                                    }}
                                                                >
                                                                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                                                                    Chi tiết
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    )}
            </div>
        </div>
    );
}
