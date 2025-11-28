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
} from "lucide-react";
import { isValidImageUrl, ImageDisplay } from "@/lib/image-utils";
import type { Pinory } from "@/lib/types";

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

            <Card className="shadow-2xl border border-neutral-700/50 rounded-2xl overflow-hidden bg-gradient-to-br from-neutral-900/95 to-neutral-800/95 backdrop-blur-md pointer-events-auto">
                <div className="p-4 space-y-3">
                    {isNote ? (
                        /* Note Content */
                        <>
                            {/* Header with note info */}
                            <div className="flex items-center gap-2 pb-3 border-b border-neutral-700/30">
                                <span className="text-2xl flex-shrink-0">
                                    {pinory?.mood || "📍"}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-white">
                                        {pinory?.name}
                                    </div>
                                    {pinory && (
                                        <div className="text-xs text-neutral-300">
                                            {formatTime(pinory.timestamp)}
                                        </div>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onClose}
                                    className="text-white bg-gradient-to-br from-red-600/90 to-red-700/90 hover:from-red-700 hover:to-red-800 rounded-xl w-9 h-9 p-0 backdrop-blur-sm border-2 border-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 flex-shrink-0"
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
                                <div className="text-sm text-[#EDEDED] leading-relaxed">
                                    {pinory.content}
                                </div>
                            )}

                            {/* Images - Smart Adaptive Layout */}
                            {pinory?.images && pinory.images.length > 0 && (
                                <div>
                                    {/* 1 ảnh: Full width, aspect ratio 4:3 */}
                                    {pinory.images.length === 1 && (
                                        <div className="w-full aspect-[4/3] bg-neutral-900 rounded-lg border border-neutral-700 overflow-hidden">
                                            {isValidImageUrl(
                                                pinory.images[0]
                                            ) ? (
                                                <ImageDisplay
                                                    src={pinory.images[0]}
                                                    alt="Ảnh ghi chú"
                                                    className="w-full h-full object-cover bg-neutral-950"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <span className="text-lg text-[#A0A0A0]">
                                                        📷
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 2 ảnh: 2 cột bằng nhau */}
                                    {pinory.images.length === 2 && (
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {pinory.images.map(
                                                (image, index) => (
                                                    <div
                                                        key={index}
                                                        className="aspect-square bg-neutral-900 rounded-lg border border-neutral-700 overflow-hidden"
                                                    >
                                                        {isValidImageUrl(
                                                            image
                                                        ) ? (
                                                            <ImageDisplay
                                                                src={image}
                                                                alt={`Ảnh ${index + 1}`}
                                                                className="w-full h-full object-cover bg-neutral-950"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <span className="text-lg text-[#A0A0A0]">
                                                                    📷
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}

                                    {/* 3 ảnh: Hero trái + 2 ảnh stack phải */}
                                    {pinory.images.length === 3 && (
                                        <div className="grid grid-cols-2 gap-1.5 h-40">
                                            {/* Hero image bên trái */}
                                            <div className="row-span-2 bg-neutral-900 rounded-lg border border-neutral-700 overflow-hidden">
                                                {isValidImageUrl(
                                                    pinory.images[0]
                                                ) ? (
                                                    <ImageDisplay
                                                        src={pinory.images[0]}
                                                        alt="Ảnh 1"
                                                        className="w-full h-full object-cover bg-neutral-950"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="text-lg text-[#A0A0A0]">
                                                            📷
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            {/* 2 ảnh stack bên phải */}
                                            <div className="flex flex-col gap-1.5">
                                                {pinory.images
                                                    .slice(1, 3)
                                                    .map((image, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex-1 bg-neutral-900 rounded-lg border border-neutral-700 overflow-hidden"
                                                        >
                                                            {isValidImageUrl(
                                                                image
                                                            ) ? (
                                                                <ImageDisplay
                                                                    src={image}
                                                                    alt={`Ảnh ${index + 2}`}
                                                                    className="w-full h-full object-cover bg-neutral-950"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <span className="text-lg text-[#A0A0A0]">
                                                                        📷
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 4 ảnh: Hero trái + 1 ảnh trên + 2 ảnh dưới (phải) */}
                                    {pinory.images.length === 4 && (
                                        <div className="grid grid-cols-2 gap-1.5 h-44">
                                            {/* Hero image bên trái */}
                                            <div className="row-span-2 bg-neutral-900 rounded-lg border border-neutral-700 overflow-hidden">
                                                {isValidImageUrl(
                                                    pinory.images[0]
                                                ) ? (
                                                    <ImageDisplay
                                                        src={pinory.images[0]}
                                                        alt="Ảnh 1"
                                                        className="w-full h-full object-cover bg-neutral-950"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="text-lg text-[#A0A0A0]">
                                                            📷
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            {/* Cột phải: 1 ảnh trên + 2 ảnh dưới */}
                                            <div className="flex flex-col gap-1.5">
                                                {/* Ảnh trên */}
                                                <div className="h-1/2 bg-neutral-900 rounded-lg border border-neutral-700 overflow-hidden">
                                                    {isValidImageUrl(
                                                        pinory.images[1]
                                                    ) ? (
                                                        <ImageDisplay
                                                            src={
                                                                pinory.images[1]
                                                            }
                                                            alt="Ảnh 2"
                                                            className="w-full h-full object-cover bg-neutral-950"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <span className="text-lg text-[#A0A0A0]">
                                                                📷
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                {/* 2 ảnh dưới */}
                                                <div className="h-1/2 grid grid-cols-2 gap-1.5">
                                                    {pinory.images
                                                        .slice(2, 4)
                                                        .map((image, index) => (
                                                            <div
                                                                key={index}
                                                                className="bg-neutral-900 rounded-lg border border-neutral-700 overflow-hidden"
                                                            >
                                                                {isValidImageUrl(
                                                                    image
                                                                ) ? (
                                                                    <ImageDisplay
                                                                        src={
                                                                            image
                                                                        }
                                                                        alt={`Ảnh ${index + 3}`}
                                                                        className="w-full h-full object-cover bg-neutral-950"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center">
                                                                        <span className="text-lg text-[#A0A0A0]">
                                                                            📷
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 5+ ảnh: Hero trái + 2x2 grid phải với "+X" overlay */}
                                    {pinory.images.length >= 5 && (
                                        <div className="grid grid-cols-2 gap-1.5 h-44">
                                            {/* Hero image bên trái */}
                                            <div className="row-span-2 bg-neutral-900 rounded-lg border border-neutral-700 overflow-hidden">
                                                {isValidImageUrl(
                                                    pinory.images[0]
                                                ) ? (
                                                    <ImageDisplay
                                                        src={pinory.images[0]}
                                                        alt="Ảnh 1"
                                                        className="w-full h-full object-cover bg-neutral-950"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="text-lg text-[#A0A0A0]">
                                                            📷
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            {/* 2x2 grid bên phải */}
                                            <div className="grid grid-cols-2 grid-rows-2 gap-1.5">
                                                {pinory.images
                                                    .slice(1, 5)
                                                    .map((image, index) => (
                                                        <div
                                                            key={index}
                                                            className="relative bg-neutral-900 rounded-lg border border-neutral-700 overflow-hidden"
                                                        >
                                                            {isValidImageUrl(
                                                                image
                                                            ) ? (
                                                                <ImageDisplay
                                                                    src={image}
                                                                    alt={`Ảnh ${index + 2}`}
                                                                    className="w-full h-full object-cover bg-neutral-950"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center">
                                                                    <span className="text-lg text-[#A0A0A0]">
                                                                        📷
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {/* Overlay "+X" trên ảnh cuối nếu có nhiều hơn 5 ảnh */}
                                                            {index === 3 &&
                                                                pinory.images &&
                                                                pinory.images
                                                                    .length >
                                                                    5 && (
                                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                                                        <span className="text-white font-semibold text-sm">
                                                                            +
                                                                            {pinory
                                                                                .images
                                                                                .length -
                                                                                5}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Route info display */}
                            {routeInfo && (
                                <div className="text-xs text-[#FFD6A5] text-center p-3 bg-gradient-to-r from-[#FF6B6B]/20 to-[#FF8E53]/20 rounded-xl border border-[#FF6B6B]/30 shadow-lg font-semibold">
                                    📍 {formatDistance(routeInfo.distance)} • ⏱️{" "}
                                    {formatDuration(routeInfo.duration)}
                                </div>
                            )}

                            {/* Action buttons for notes - all in one row */}
                            <div className="flex gap-2 pt-2 border-t border-neutral-700/30">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-[#EDEDED] border-neutral-600"
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
                                        className="flex-1 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] hover:from-[#FF5555] hover:to-[#FF7A3D] text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
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
                                        className="px-3 bg-neutral-800 hover:bg-red-900/30 text-red-400 border-neutral-600 hover:border-red-800"
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
                            <div className="flex items-center gap-2 pb-3 border-b border-neutral-700/30">
                                <span className="text-2xl flex-shrink-0">
                                    📍
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-white truncate">
                                        {location?.address}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onClose}
                                    className="text-white bg-gradient-to-br from-red-600/90 to-red-700/90 hover:from-red-700 hover:to-red-800 rounded-xl w-9 h-9 p-0 backdrop-blur-sm border-2 border-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 flex-shrink-0"
                                >
                                    <X className="h-4 w-4" strokeWidth={2} />
                                </Button>
                            </div>

                            {/* Location Type Label */}
                            <div className="flex items-center gap-2">
                                <MapPin
                                    className="h-4 w-4 text-[#A0A0A0]"
                                    strokeWidth={1.5}
                                />
                                <span className="text-sm text-[#A0A0A0]">
                                    Địa điểm mới
                                </span>
                            </div>

                            {/* Location address */}
                            <div className="flex items-start gap-2">
                                <MapPin
                                    className="h-4 w-4 text-[#A0A0A0] mt-0.5 flex-shrink-0"
                                    strokeWidth={1.5}
                                />
                                <span className="text-sm text-[#EDEDED] break-words leading-relaxed">
                                    {location?.address}
                                </span>
                            </div>

                            {/* Coordinates */}
                            <div className="text-xs text-[#A0A0A0]">
                                {location?.lat.toFixed(6)},{" "}
                                {location?.lng.toFixed(6)}
                            </div>

                            {/* Route info display */}
                            {routeInfo && (
                                <div className="text-xs text-[#FFD6A5] text-center p-3 bg-gradient-to-r from-[#FF6B6B]/20 to-[#FF8E53]/20 rounded-xl border border-[#FF6B6B]/30 shadow-lg font-semibold">
                                    📍 {formatDistance(routeInfo.distance)} • ⏱️{" "}
                                    {formatDuration(routeInfo.duration)}
                                </div>
                            )}

                            {/* Action buttons for locations */}
                            <div className="flex gap-2 pt-2 border-t border-neutral-700/30">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-[#EDEDED] border-neutral-600"
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
                                        className="flex-1 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] hover:from-[#FF5555] hover:to-[#FF7A3D] text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
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
