"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
    getCurrentLocation,
    openExternalNavigation,
    getRoute,
    addRouteToMap,
    removeRouteFromMap,
    hasActiveRoute,
    formatDuration,
    formatDistance,
} from "@/lib/geolocation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    X,
    MapPin,
    Navigation,
    Eye,
    PenTool,
    Trash2,
    NavigationOff,
    Play,
} from "lucide-react";
import { isValidImageUrl, ImageDisplay } from "@/lib/image-utils";
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
}

function MediaItem({
    src,
    className,
    showOverlay,
    overlayCount,
}: MediaItemProps) {
    const isVideo = isVideoUrl(src);

    return (
        <div
            className={cn("relative overflow-hidden bg-secondary", className)}
        >
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

function MediaGrid({ images }: MediaGridProps) {
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

interface LocationPreview {
    lng: number;
    lat: number;
    address: string;
}

interface PinoryPopupProps {
    readonly pinory?: Pinory;
    readonly location?: LocationPreview;
    readonly onClose: () => void;
    readonly onViewDetails?: () => void; // For notes
    readonly onAddPinory?: () => void; // For locations
    readonly onDelete?: () => void; // For deleting notes
    readonly mapRef?: React.RefObject<mapboxgl.Map>;
}

export function PinoryPopup({
    pinory,
    location,
    onClose,
    onViewDetails,
    onAddPinory,
    onDelete,
    mapRef,
}: PinoryPopupProps) {
    const [isGettingDirections, setIsGettingDirections] = useState(false);
    const [showRouteOptions, setShowRouteOptions] = useState(false);
    const [routeInfo, setRouteInfo] = useState<{
        duration: number;
        distance: number;
    } | null>(null);
    const [hasRoute, setHasRoute] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Determine popup type
    const isNote = !!pinory;

    // Helper functions for notes
    const formatTime = (date: Date) => {
        return new Date(date).toLocaleString("vi-VN", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const handleGetDirections = async (
        destination: {
            lat: number;
            lng: number;
        },
        showOnMap: boolean = false
    ) => {
        console.log(
            "🧭 Getting directions to:",
            destination,
            "Show on map:",
            showOnMap
        );
        setIsGettingDirections(true);

        try {
            toast.loading("Đang lấy vị trí hiện tại...", { id: "directions" });

            const currentLocation = await getCurrentLocation();
            console.log("📍 Current location:", currentLocation);

            toast.success("Đã tìm thấy vị trí của bạn!", { id: "directions" });

            if (showOnMap && mapRef) {
                // Show route on Mapbox map
                console.log("🗺️ Map reference:", mapRef);
                toast.loading("Đang tính toán đường đi...", {
                    id: "directions",
                });

                try {
                    const route = await getRoute(currentLocation, destination);
                    console.log("🗺️ Route calculated:", route);

                    // Try to add route to map
                    try {
                        addRouteToMap(mapRef, route);

                        // Store route info
                        setRouteInfo({
                            duration: route.duration,
                            distance: route.distance,
                        });
                        setHasRoute(true);

                        // Emit route created event with destination info
                        const destinationName = isNote
                            ? "Ghi chú của bạn"
                            : "Vị trí được chọn";
                        const destinationAddress = isNote
                            ? pinory?.address
                            : location?.address || "";

                        globalThis.dispatchEvent(
                            new CustomEvent("showDirections", {
                                detail: {
                                    destination: {
                                        name: destinationName,
                                        address: destinationAddress,
                                        lat: destination.lat,
                                        lng: destination.lng,
                                    },
                                    routeInfo: {
                                        duration: route.duration,
                                        distance: route.distance,
                                    },
                                },
                            })
                        );

                        toast.success(
                            `Đường đi: ${formatDistance(route.distance)} • ${formatDuration(route.duration)}`,
                            {
                                id: "directions",
                            }
                        );
                    } catch (mapError) {
                        console.error(
                            "❌ Error adding route to map:",
                            mapError
                        );

                        // Still show route info even if map display fails
                        setRouteInfo({
                            duration: route.duration,
                            distance: route.distance,
                        });
                        setHasRoute(true);

                        // Emit route created event even if map display fails
                        const destinationName = isNote
                            ? "Ghi chú của bạn"
                            : "Vị trí được chọn";
                        const destinationAddress = isNote
                            ? pinory?.address
                            : location?.address || "";

                        globalThis.dispatchEvent(
                            new CustomEvent("showDirections", {
                                detail: {
                                    destination: {
                                        name: destinationName,
                                        address: destinationAddress,
                                        lat: destination.lat,
                                        lng: destination.lng,
                                    },
                                    routeInfo: {
                                        duration: route.duration,
                                        distance: route.distance,
                                    },
                                },
                            })
                        );

                        toast.success(
                            `Đường đi: ${formatDistance(route.distance)} • ${formatDuration(route.duration)} (Không hiển thị được trên bản đồ)`,
                            {
                                id: "directions",
                            }
                        );
                    }
                } catch (routeError) {
                    console.error("❌ Error calculating route:", routeError);
                    toast.error("Không thể tính toán đường đi", {
                        id: "directions",
                    });

                    // Fallback to external navigation
                    openExternalNavigation(destination, currentLocation);
                }
            } else {
                // Open external navigation app
                console.log(
                    "🗺️ Opening external navigation from",
                    currentLocation,
                    "to",
                    destination
                );
                openExternalNavigation(destination, currentLocation);

                // Close popup after successful navigation
                setTimeout(() => {
                    onClose();
                }, 1000);
            }
        } catch (error) {
            console.error("❌ Error getting directions:", error);
            toast.error("Không thể lấy vị trí hiện tại", {
                description:
                    error instanceof Error
                        ? error.message
                        : "Vui lòng thử lại sau",
                id: "directions",
            });

            // Fallback: open without current location
            console.log(
                "🔄 Fallback: Opening navigation without current location"
            );
            openExternalNavigation(destination);
        } finally {
            setIsGettingDirections(false);
        }
    };

    const handleClearDirections = () => {
        if (mapRef) {
            const success = removeRouteFromMap(mapRef);
            if (success) {
                setRouteInfo(null);
                setShowRouteOptions(false);
                setHasRoute(false);

                // Emit route cleared event
                window.dispatchEvent(new CustomEvent("routeCleared"));

                toast.success("Đã tắt chỉ đường");
            } else {
                toast.error("Không thể tắt chỉ đường");
            }
        }
    };

    // Dynamic positioning with smart arrow placement
    const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
    const [arrowPosition, setArrowPosition] = useState<"top" | "bottom">(
        "bottom"
    );
    const [arrowOffset, setArrowOffset] = useState(50); // Percentage from left
    const popupRef = useRef<HTMLDivElement>(null);
    const lastHeightRef = useRef<number>(280); // Cache last known height

    useEffect(() => {
        if (!mapRef?.current) return;

        const coordinates = pinory
            ? [pinory.lng, pinory.lat]
            : location
              ? [location.lng, location.lat]
              : null;

        if (!coordinates) return;

        const updatePosition = () => {
            if (!mapRef.current) return;

            try {
                // Convert lng/lat to screen coordinates
                const point = mapRef.current.project(
                    coordinates as [number, number]
                );

                const popupWidth = 320; // 80 * 4 (w-80)
                // Get actual popup height if available, use cached height to prevent flickering
                const currentHeight = popupRef.current?.offsetHeight;
                if (currentHeight && currentHeight > 0) {
                    lastHeightRef.current = currentHeight;
                }
                const popupHeight = lastHeightRef.current;

                const arrowSize = 8;
                const margin = 10;
                const markerOffset = 80; // Space for marker

                // Calculate space above and below the point
                const spaceAbove = point.y - margin;
                const spaceBelow = window.innerHeight - point.y - margin;

                let left = point.x - popupWidth / 2;
                let top: number;
                let newArrowPosition: "top" | "bottom";

                // Choose position based on available space
                // Prefer below if there's enough space, otherwise choose the side with more space
                if (spaceBelow >= popupHeight + markerOffset) {
                    // Position below - plenty of space
                    top = point.y + arrowSize + markerOffset;
                    newArrowPosition = "top"; // Arrow points up
                } else if (spaceAbove >= popupHeight + markerOffset) {
                    // Position above - enough space
                    top = point.y - popupHeight - arrowSize - markerOffset;
                    newArrowPosition = "bottom"; // Arrow points down
                } else if (spaceBelow > spaceAbove) {
                    // More space below
                    top = point.y + arrowSize + markerOffset;
                    newArrowPosition = "top";
                } else {
                    // More space above
                    top = point.y - popupHeight - arrowSize - markerOffset;
                    newArrowPosition = "bottom";
                }

                // Adjust horizontal position and calculate arrow offset
                left = Math.max(
                    margin,
                    Math.min(left, window.innerWidth - popupWidth - margin)
                );

                // Calculate arrow offset as percentage (where arrow should point)
                const targetX = point.x;
                const arrowOffsetPx = Math.max(
                    arrowSize,
                    Math.min(targetX - left, popupWidth - arrowSize)
                );
                const newArrowOffset = (arrowOffsetPx / popupWidth) * 100;

                const style: React.CSSProperties = {
                    position: "absolute",
                    left,
                    top,
                    transform: "none",
                    zIndex: 50,
                };

                setPopupStyle(style);
                setArrowPosition(newArrowPosition);
                setArrowOffset(newArrowOffset);
            } catch (error) {
                console.error("Error calculating popup position:", error);
            }
        };

        // Update position initially and after a short delay to get actual height
        updatePosition();
        const timeoutId = setTimeout(updatePosition, 100);

        // Update position when map moves
        const map = mapRef.current;
        map.on("move", updatePosition);
        map.on("zoom", updatePosition);

        return () => {
            clearTimeout(timeoutId);
            map.off("move", updatePosition);
            map.off("zoom", updatePosition);
        };
    }, [mapRef, pinory, location]);

    // Detect mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(globalThis.innerWidth < 768); // md breakpoint
        };
        checkMobile();
        globalThis.addEventListener("resize", checkMobile);
        return () => globalThis.removeEventListener("resize", checkMobile);
    }, []);

    // Check if route exists when popup opens
    useEffect(() => {
        if (mapRef) {
            const routeExists = hasActiveRoute(mapRef);
            setHasRoute(routeExists);
            console.log("🔍 Route status check:", routeExists);
        }
    }, [mapRef]);

    // MOBILE: Simple bottom sheet
    if (isMobile) {
        return;
    }

    // DESKTOP: Original floating popup
    return (
        <div
            ref={popupRef}
            className="w-80 z-20 pointer-events-none transition-opacity duration-200"
            style={{
                ...popupStyle,
                opacity: popupStyle.left ? 1 : 0, // Fade in when positioned
            }}
        >
            {/* Smart Arrow - adapts position and direction */}
            {arrowPosition === "bottom" ? (
                // Arrow pointing down (popup above point)
                <div
                    className="absolute top-full transform -translate-x-1/2"
                    style={{ left: `${arrowOffset}%` }}
                >
                    <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-blue-500 filter drop-shadow-sm"></div>
                </div>
            ) : (
                // Arrow pointing up (popup below point)
                <div
                    className="absolute bottom-full transform -translate-x-1/2"
                    style={{ left: `${arrowOffset}%` }}
                >
                    <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-blue-500 filter drop-shadow-sm"></div>
                </div>
            )}

            <Card className="shadow-2xl border border-border/50 rounded-2xl overflow-hidden bg-card/95 backdrop-blur-md pointer-events-auto">
                <div className="p-4 space-y-3">
                    {isNote ? (
                        /* Note Content */
                        <>
                            {/* Header with note info */}
                            <div className="flex items-center gap-2 pb-3 border-b border-border/30">
                                <span className="text-2xl flex-shrink-0">
                                    {pinory?.mood || "📍"}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-foreground">
                                        {pinory?.name}
                                    </div>
                                    {pinory && (
                                        <div className="text-xs text-muted-foreground">
                                            {formatTime(pinory.timestamp)}
                                        </div>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onClose}
                                    className="text-white bg-red-600/90 hover:bg-red-700 rounded-xl w-9 h-9 p-0 backdrop-blur-sm border-2 border-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 flex-shrink-0"
                                >
                                    <X className="h-4 w-4" strokeWidth={2} />
                                </Button>
                            </div>

                            {/* Note Type Label */}
                            <div className="flex items-center gap-2">
                                <p className="text-sm text-gray-600 flex items-start gap-1">
                                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>{pinory.address}</span>
                                </p>
                            </div>

                            {/* Note content - main focus */}
                            {pinory && pinory.content && (
                                <div className="text-sm text-foreground leading-relaxed">
                                    {pinory.content}
                                </div>
                            )}

                            {/* Images - Smart Media Grid */}
                            {pinory?.images && pinory.images.length > 0 && (
                                <MediaGrid images={pinory.images} />
                            )}

                            {/* Route info display */}
                            {routeInfo && (
                                <div className="text-xs text-brand-accent text-center p-3 bg-brand/20 rounded-xl border border-brand/30 shadow-lg font-semibold">
                                    📍 {formatDistance(routeInfo.distance)} • ⏱️{" "}
                                    {formatDuration(routeInfo.duration)}
                                </div>
                            )}

                            {/* Action buttons for notes - all in one row */}
                            <div className="flex gap-2 pt-2 border-t border-border/30">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 bg-secondary hover:bg-accent text-foreground border-border"
                                    onClick={onViewDetails}
                                >
                                    <Eye
                                        className="h-4 w-4 mr-1"
                                        strokeWidth={1.5}
                                    />
                                    Chi tiết
                                </Button>

                                {hasRoute ? (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 border-red-800"
                                        onClick={handleClearDirections}
                                    >
                                        <NavigationOff
                                            className="h-3 w-3 mr-1"
                                            strokeWidth={1.5}
                                        />
                                        Tắt đường
                                    </Button>
                                ) : !showRouteOptions ? (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 bg-brand hover:bg-brand-hover text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                                        onClick={() =>
                                            pinory &&
                                            handleGetDirections(
                                                {
                                                    lat: pinory.lat,
                                                    lng: pinory.lng,
                                                },
                                                true
                                            )
                                        }
                                        disabled={isGettingDirections}
                                    >
                                        <Navigation
                                            className="h-3 w-3 mr-1"
                                            strokeWidth={2}
                                        />
                                        Chỉ đường
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white border-green-600"
                                            onClick={() =>
                                                pinory &&
                                                handleGetDirections(
                                                    {
                                                        lat: pinory.lat,
                                                        lng: pinory.lng,
                                                    },
                                                    true
                                                )
                                            }
                                            disabled={isGettingDirections}
                                        >
                                            <Navigation
                                                className={`h-3 w-3 mr-1 ${isGettingDirections ? "animate-spin" : ""}`}
                                                strokeWidth={1.5}
                                            />
                                            Bản đồ
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                                            onClick={() =>
                                                pinory &&
                                                handleGetDirections(
                                                    {
                                                        lat: pinory.lat,
                                                        lng: pinory.lng,
                                                    },
                                                    false
                                                )
                                            }
                                            disabled={isGettingDirections}
                                        >
                                            <Navigation
                                                className={`h-3 w-3 mr-1 ${isGettingDirections ? "animate-spin" : ""}`}
                                                strokeWidth={1.5}
                                            />
                                            Mở app
                                        </Button>
                                    </>
                                )}

                                {onDelete && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="px-3 bg-secondary hover:bg-red-900/30 text-red-400 border-border hover:border-red-800"
                                        onClick={onDelete}
                                        title="Xóa ghi chú"
                                    >
                                        <Trash2
                                            className="h-4 w-4"
                                            strokeWidth={1.5}
                                        />
                                    </Button>
                                )}
                            </div>
                        </>
                    ) : (
                        /* Location Content */
                        <>
                            {/* Header with location info */}
                            <div className="flex items-center gap-2 pb-3 border-b border-border/30">
                                <span className="text-2xl flex-shrink-0">
                                    📍
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-foreground truncate">
                                        {location?.address}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onClose}
                                    className="text-white bg-red-600/90 hover:bg-red-700 rounded-xl w-9 h-9 p-0 backdrop-blur-sm border-2 border-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 flex-shrink-0"
                                >
                                    <X className="h-4 w-4" strokeWidth={2} />
                                </Button>
                            </div>

                            {/* Location Type Label */}
                            <div className="flex items-center gap-2">
                                <MapPin
                                    className="h-4 w-4 text-muted-foreground"
                                    strokeWidth={1.5}
                                />
                                <span className="text-sm text-muted-foreground">
                                    Địa điểm mới
                                </span>
                            </div>

                            {/* Location address */}
                            <div className="flex items-start gap-2">
                                <MapPin
                                    className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0"
                                    strokeWidth={1.5}
                                />
                                <span className="text-sm text-foreground break-words leading-relaxed">
                                    {location?.address}
                                </span>
                            </div>

                            {/* Coordinates */}
                            <div className="text-xs text-muted-foreground">
                                {location?.lat.toFixed(6)},{" "}
                                {location?.lng.toFixed(6)}
                            </div>

                            {/* Route info display */}
                            {routeInfo && (
                                <div className="text-xs text-brand-accent text-center p-3 bg-brand/20 rounded-xl border border-brand/30 shadow-lg font-semibold">
                                    📍 {formatDistance(routeInfo.distance)} • ⏱️{" "}
                                    {formatDuration(routeInfo.duration)}
                                </div>
                            )}

                            {/* Action buttons for locations */}
                            <div className="flex gap-2 pt-2 border-t border-border/30">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 bg-secondary hover:bg-accent text-foreground border-border"
                                    onClick={onAddPinory}
                                >
                                    <PenTool
                                        className="h-4 w-4 mr-1"
                                        strokeWidth={1.5}
                                    />
                                    Thêm ghi chú
                                </Button>

                                {hasRoute ? (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 border-red-800"
                                        onClick={handleClearDirections}
                                    >
                                        <NavigationOff
                                            className="h-3 w-3 mr-1"
                                            strokeWidth={1.5}
                                        />
                                        Tắt đường
                                    </Button>
                                ) : !showRouteOptions ? (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 bg-brand hover:bg-brand-hover text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                                        onClick={() =>
                                            location &&
                                            handleGetDirections(
                                                {
                                                    lat: location.lat,
                                                    lng: location.lng,
                                                },
                                                true
                                            )
                                        }
                                        disabled={isGettingDirections}
                                    >
                                        <Navigation
                                            className="h-3 w-3 mr-1"
                                            strokeWidth={2}
                                        />
                                        Chỉ đường
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white border-green-600"
                                            onClick={() =>
                                                location &&
                                                handleGetDirections(
                                                    {
                                                        lat: location.lat,
                                                        lng: location.lng,
                                                    },
                                                    true
                                                )
                                            }
                                            disabled={isGettingDirections}
                                        >
                                            <Navigation
                                                className={`h-3 w-3 mr-1 ${isGettingDirections ? "animate-spin" : ""}`}
                                                strokeWidth={1.5}
                                            />
                                            Bản đồ
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                                            onClick={() =>
                                                location &&
                                                handleGetDirections(
                                                    {
                                                        lat: location.lat,
                                                        lng: location.lng,
                                                    },
                                                    false
                                                )
                                            }
                                            disabled={isGettingDirections}
                                        >
                                            <Navigation
                                                className={`h-3 w-3 mr-1 ${isGettingDirections ? "animate-spin" : ""}`}
                                                strokeWidth={1.5}
                                            />
                                            Mở app
                                        </Button>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
}
