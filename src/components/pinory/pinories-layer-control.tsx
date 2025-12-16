"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { usePinoryStore, useCategoryStore } from "@/lib/store";
import { usePinoryAPI } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MapPin, X, Search, Filter, Navigation, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import type { Pinory } from "@/lib/types";
import {
    getCurrentLocation,
    openExternalNavigation,
    getRoute,
} from "@/lib/geolocation";
import { toast } from "sonner";

// Custom hook to detect mobile viewport
function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 640);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    return isMobile;
}

// Helper function to check if a URL is a video
const isVideoUrl = (url: string): boolean => {
    const videoExtensions = [".mp4", ".webm", ".mov", ".avi", ".mkv"];
    const lowerUrl = url.toLowerCase();
    return videoExtensions.some((ext) => lowerUrl.includes(ext));
};

// Media Item Component
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
        <div className={cn("relative overflow-hidden bg-secondary", className)}>
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
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                        </div>
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
                    <span className="text-white text-lg font-bold">
                        +{overlayCount}
                    </span>
                </div>
            )}
        </div>
    );
}

// Compact Media Grid for list items
interface MediaGridProps {
    readonly images: string[];
    readonly isHovered?: boolean;
}

function MediaGrid({ images, isHovered }: MediaGridProps) {
    const count = images.length;

    if (count === 0) return null;

    if (count === 1) {
        return (
            <MediaItem
                src={images[0]}
                className="aspect-[16/9] rounded-lg"
                isHovered={isHovered}
            />
        );
    }

    if (count === 2) {
        return (
            <div className="grid grid-cols-2 gap-1">
                {images.map((img) => (
                    <MediaItem
                        key={img}
                        src={img}
                        className="aspect-square rounded-lg"
                        isHovered={isHovered}
                    />
                ))}
            </div>
        );
    }

    // 3+ images
    return (
        <div className="grid grid-cols-2 gap-1">
            <MediaItem
                src={images[0]}
                className="aspect-square rounded-lg row-span-2"
                isHovered={isHovered}
            />
            <MediaItem
                src={images[1]}
                className="aspect-[2/1] rounded-lg"
                isHovered={isHovered}
            />
            <MediaItem
                src={images[2] || images[1]}
                className="aspect-[2/1] rounded-lg"
                showOverlay={count > 3}
                overlayCount={count - 3}
                isHovered={isHovered}
            />
        </div>
    );
}

// Panel Content Component
interface PanelContentProps {
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
    readonly setFilter: (filter: any) => void;
    readonly setSelectedPinory: (pinory: Pinory) => void;
    readonly setIsOpen: (value: boolean) => void;
    readonly handleGetDirections: (place: Pinory) => void;
    readonly isGettingDirections: string | null;
    readonly isMobile: boolean;
}

function PanelContent({
    pinories,
    filter,
    categories,
    isLoadingPinories,
    setFilter,
    setSelectedPinory,
    setIsOpen,
    handleGetDirections,
    isGettingDirections,
    isMobile,
}: PanelContentProps) {
    const [showFilterPopover, setShowFilterPopover] = useState(false);

    // Helper function to convert CategoryType enum to slug for filtering
    const categoryTypeToSlug = (categoryType: string): string => {
        if (categoryType?.includes("-")) {
            return categoryType;
        }
        return categoryType.toLowerCase();
    };

    const filteredPinories = pinories.filter((pinory) => {
        if (filter.category && filter.category.length > 0) {
            const placeSlug = categoryTypeToSlug(pinory.category || "");
            if (!filter.category.includes(placeSlug)) return false;
        }
        if (filter.district && !filter.district.includes(pinory.district || ""))
            return false;
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

    const formatDate = (date: Date | undefined) => {
        if (!date) return "";
        const d = new Date(date);
        return d.toLocaleString("vi-VN", {
            weekday: "short",
            day: "numeric",
            month: "short",
        });
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div
                className="flex items-center justify-between p-4 border-b"
                style={{ borderColor: "var(--border)" }}
            >
                <h3
                    className="font-bold flex items-center gap-2 text-base"
                    style={{ color: "var(--foreground)" }}
                >
                    <MapPin
                        className="w-5 h-5"
                        style={{ color: "var(--color-primary-500)" }}
                    />
                    My Pinories
                    {pinories.length > 0 && (
                        <span
                            className="text-white text-xs rounded-full px-2 py-0.5 font-bold"
                            style={{
                                backgroundColor: "var(--color-primary-500)",
                            }}
                        >
                            {pinories.length}
                        </span>
                    )}
                </h3>
                <motion.div
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsOpen(false)}
                        className="h-8 w-8"
                        style={{ color: "var(--muted-foreground)" }}
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </motion.div>
            </div>

            {/* Search */}
            <div
                className="p-4 border-b"
                style={{ borderColor: "var(--border)" }}
            >
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search memories..."
                        value={filter.query || ""}
                        onChange={(e) =>
                            setFilter({ ...filter, query: e.target.value })
                        }
                        className="pl-10 pr-10 h-10 bg-secondary border-border"
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFilterPopover(!showFilterPopover)}
                        className={cn(
                            "absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0",
                            showFilterPopover && "bg-accent"
                        )}
                    >
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>

                {/* Filter Popover */}
                <AnimatePresence>
                    {showFilterPopover && categories.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 overflow-hidden"
                        >
                            <div className="p-3 bg-secondary rounded-lg border border-border space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">
                                        Danh mục
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setFilter({});
                                            setShowFilterPopover(false);
                                        }}
                                        className="h-6 text-xs"
                                    >
                                        Đặt lại
                                    </Button>
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
                                                className="cursor-pointer px-2 py-1 text-xs"
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
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {isLoadingPinories && (
                    <div className="text-center py-12 text-muted-foreground">
                        <div className="animate-spin h-8 w-8 mx-auto mb-3 border-2 border-white border-t-transparent rounded-full" />
                        <p className="text-sm">Loading...</p>
                    </div>
                )}

                {!isLoadingPinories &&
                    Object.keys(groupedPinories).length === 0 && (
                        <div className="text-center py-12">
                            <MapPin className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                            <p className="text-base mb-1 text-foreground">
                                Chưa có kỷ niệm nào
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Hãy bắt đầu ghi lại những khoảnh khắc đáng nhớ
                            </p>
                        </div>
                    )}

                {!isLoadingPinories &&
                    Object.keys(groupedPinories).length > 0 && (
                        <div className="space-y-6">
                            {Object.entries(groupedPinories).map(
                                ([monthYear, items]) => (
                                    <div key={monthYear} className="space-y-3">
                                        <h2 className="text-lg font-bold text-foreground sticky -top-4 bg-card/95 backdrop-blur-sm py-2 px-3 -mx-3 z-10 border-b border-border/50">
                                            {monthYear}
                                        </h2>

                                        <div className="space-y-3">
                                            {items.map((pinory, index) => (
                                                <motion.div
                                                    key={pinory.id}
                                                    initial={{
                                                        opacity: 0,
                                                        y: 10,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        y: 0,
                                                    }}
                                                    transition={{
                                                        delay: index * 0.05,
                                                    }}
                                                >
                                                    <Card
                                                        className="group bg-secondary border-border/50 hover:border-border hover:bg-accent transition-all duration-300 cursor-pointer rounded-xl overflow-hidden"
                                                        onClick={() => {
                                                            setSelectedPinory(
                                                                pinory
                                                            );
                                                            if (isMobile) {
                                                                setIsOpen(
                                                                    false
                                                                );
                                                                // Dispatch event to open details view on mobile
                                                                setTimeout(
                                                                    () => {
                                                                        globalThis.dispatchEvent(
                                                                            new CustomEvent(
                                                                                "openPinoryDetails"
                                                                            )
                                                                        );
                                                                    },
                                                                    50
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        {/* Media */}
                                                        {pinory.images &&
                                                            pinory.images
                                                                .length > 0 && (
                                                                <div className="p-2">
                                                                    <MediaGrid
                                                                        images={
                                                                            pinory.images
                                                                        }
                                                                    />
                                                                </div>
                                                            )}

                                                        {/* Content */}
                                                        <div className="p-3 space-y-2">
                                                            <h3 className="text-sm font-semibold text-foreground line-clamp-1">
                                                                {pinory.name}
                                                            </h3>

                                                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                                <span>
                                                                    {formatDate(
                                                                        pinory.createdAt
                                                                    )}
                                                                </span>
                                                                {/* Navigation button - show if no address */}
                                                                {!pinory.address && (
                                                                    <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        className="h-6 w-6 rounded-full hover:bg-secondary transition-colors"
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
                                                                        <Navigation className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                )}
                                                            </div>

                                                            {pinory.address && (
                                                                <div className="flex items-start justify-between gap-2 text-xs text-muted-foreground">
                                                                    <div className="flex items-start gap-1 flex-1 min-w-0">
                                                                        <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                                                        <span className="line-clamp-1">
                                                                            {
                                                                                pinory.address
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                    {/* Navigation button */}
                                                                    <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        className="h-6 w-6 flex-shrink-0 rounded-full hover:bg-secondary transition-colors"
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
                                                                        <Navigation className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </Card>
                                                </motion.div>
                                            ))}
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

export function PinoriesLayerControl() {
    const { data: session } = useSession();
    const { pinories, filter, setFilter, setSelectedPinory } = usePinoryStore();
    const { categories } = useCategoryStore();
    const { fetchPinories } = usePinoryAPI(session);

    const [isOpen, setIsOpen] = useState(false);
    const [isLoadingPinories, setIsLoadingPinories] = useState(false);
    const [isGettingDirections, setIsGettingDirections] = useState<
        string | null
    >(null);
    const isMobile = useIsMobile();

    // Fetch pinories when panel opens
    useEffect(() => {
        if (isOpen && session && pinories.length === 0) {
            setIsLoadingPinories(true);
            fetchPinories().finally(() => setIsLoadingPinories(false));
        }
    }, [isOpen, session, pinories.length, fetchPinories]);

    const handleGetDirections = useCallback(async (place: Pinory) => {
        setIsGettingDirections(place.id);

        try {
            toast.loading("Getting current location...", { id: "directions" });

            const currentLocation = await getCurrentLocation();

            toast.loading("Calculating route...", {
                id: "directions",
            });

            const destination = { lat: place.lat, lng: place.lng };
            const route = await getRoute(currentLocation, destination, {
                profile: "driving",
            });

            globalThis.dispatchEvent(
                new CustomEvent("showDirections", {
                    detail: {
                        destination: {
                            name: place.name || "Selected location",
                            address: place.address || "",
                            lat: place.lat,
                            lng: place.lng,
                        },
                        routeInfo: {
                            duration: route.duration,
                            distance: route.distance,
                        },
                        route: route,
                    },
                })
            );

            toast.success("Route found!", { id: "directions" });

            openExternalNavigation(destination, currentLocation);
        } catch (error) {
            console.error("Error getting directions:", error);
            toast.error("Could not calculate route", {
                description:
                    error instanceof Error
                        ? error.message
                        : "Please try again later",
                id: "directions",
            });

            openExternalNavigation({ lat: place.lat, lng: place.lng });
        } finally {
            setIsGettingDirections(null);
        }
    }, []);

    // Don't render if not authenticated
    if (!session) {
        return null;
    }

    return (
        <>
            {/* Toggle Button - Left side */}
            <div className="absolute top-4 left-4 z-[10]">
                <AnimatePresence mode="wait">
                    {!isOpen && (
                        <motion.div
                            initial={false}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 25,
                            }}
                        >
                            <Button
                                variant="outline"
                                onClick={() => setIsOpen(true)}
                                className="shadow-lg rounded-full h-12 px-4 hover:scale-105 active:scale-95 transition-transform duration-200 border-2 cursor-pointer"
                                style={{
                                    borderColor: "var(--border)",
                                    backgroundColor: "var(--card)",
                                    color: "var(--foreground)",
                                }}
                            >
                                <MapPin
                                    className="w-5 h-5 mr-2"
                                    style={{
                                        color: "var(--color-primary-500)",
                                    }}
                                />
                                <span className="font-semibold">
                                    My Pinories
                                </span>
                                {pinories.length > 0 && (
                                    <span
                                        className="ml-2 text-xs rounded-full px-2 py-0.5 font-bold"
                                        style={{
                                            backgroundColor:
                                                "var(--color-primary-500)",
                                            color: "var(--primary-foreground)",
                                        }}
                                    >
                                        {pinories.length}
                                    </span>
                                )}
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Desktop Panel - Slide in from left */}
            {!isMobile && (
                <AnimatePresence>
                    {isOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                className="fixed inset-0 z-[15]"
                                style={{
                                    backgroundColor: "rgba(0, 0, 0, 0.2)",
                                }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsOpen(false)}
                            />

                            {/* Panel */}
                            <motion.div
                                className="fixed left-0 top-0 h-full w-80 z-[20] border-r"
                                style={{
                                    backgroundColor: "var(--card)",
                                    borderColor: "var(--border)",
                                    boxShadow: "var(--shadow-lg)",
                                }}
                                initial={{ x: "-100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "-100%" }}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30,
                                }}
                            >
                                <PanelContent
                                    pinories={pinories}
                                    filter={filter}
                                    categories={categories}
                                    isLoadingPinories={isLoadingPinories}
                                    setFilter={setFilter}
                                    setSelectedPinory={setSelectedPinory}
                                    setIsOpen={setIsOpen}
                                    handleGetDirections={handleGetDirections}
                                    isGettingDirections={isGettingDirections}
                                    isMobile={isMobile}
                                />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            )}

            {/* Mobile - Full screen bottom sheet */}
            {isMobile && (
                <AnimatePresence>
                    {isOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                className="fixed inset-0 z-[100]"
                                style={{
                                    backgroundColor: "rgba(0, 0, 0, 0.2)",
                                }}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsOpen(false)}
                            />

                            {/* Full screen bottom sheet */}
                            <motion.div
                                className="fixed inset-x-0 bottom-0 top-12 z-[101] rounded-t-2xl border-t overflow-hidden"
                                style={{
                                    backgroundColor: "var(--card)",
                                    borderColor: "var(--border)",
                                    boxShadow:
                                        "0 -4px 20px rgba(0, 0, 0, 0.15)",
                                }}
                                initial={{ y: "100%" }}
                                animate={{ y: 0 }}
                                exit={{ y: "100%" }}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30,
                                }}
                                drag="y"
                                dragConstraints={{ top: 0, bottom: 0 }}
                                dragElastic={{ top: 0, bottom: 0.5 }}
                                onDragEnd={(_, info) => {
                                    if (info.offset.y > 100) {
                                        setIsOpen(false);
                                    }
                                }}
                            >
                                {/* Drag Handle */}
                                <div className="flex justify-center pt-3 pb-1">
                                    <div
                                        className="w-10 h-1 rounded-full"
                                        style={{
                                            backgroundColor:
                                                "var(--muted-foreground)",
                                            opacity: 0.4,
                                        }}
                                    />
                                </div>

                                {/* Content */}
                                <div className="h-full overflow-hidden">
                                    <PanelContent
                                        pinories={pinories}
                                        filter={filter}
                                        categories={categories}
                                        isLoadingPinories={isLoadingPinories}
                                        setFilter={setFilter}
                                        setSelectedPinory={setSelectedPinory}
                                        setIsOpen={setIsOpen}
                                        handleGetDirections={
                                            handleGetDirections
                                        }
                                        isGettingDirections={
                                            isGettingDirections
                                        }
                                        isMobile={isMobile}
                                    />
                                </div>

                                {/* Safe area */}
                                <div className="h-safe-area-inset-bottom" />
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            )}
        </>
    );
}
