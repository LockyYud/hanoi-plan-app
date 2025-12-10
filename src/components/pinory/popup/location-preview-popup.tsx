"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, MapPin, Navigation, NavigationOff, PenTool } from "lucide-react";
import {
    usePopupPosition,
    useDirections,
} from "@/components/pinory/base/hooks";
import {
    hasActiveRoute,
    removeRouteFromMap,
    formatDuration,
    formatDistance,
} from "@/lib/geolocation";
import { toast } from "sonner";

interface LocationPreview {
    lng: number;
    lat: number;
    address: string;
}

interface LocationPreviewPopupProps {
    readonly location: LocationPreview;
    readonly onClose: () => void;
    readonly onAddPinory: () => void;
    readonly mapRef?: React.RefObject<mapboxgl.Map>;
}

export function LocationPreviewPopup({
    location,
    onClose,
    onAddPinory,
    mapRef,
}: LocationPreviewPopupProps) {
    const [hasRoute, setHasRoute] = useState(false);
    const [routeInfo, setRouteInfo] = useState<{
        duration: number;
        distance: number;
    } | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);

    // Use shared hooks
    const { popupStyle, arrowPosition, arrowOffset, isPositioned } =
        usePopupPosition({
            mapRef,
            coordinates: { lng: location.lng, lat: location.lat },
            popupWidth: 320,
        });

    const { isGettingDirections, handleGetDirections } = useDirections({
        openExternal: false,
        onRouteCalculated: (route) => {
            setRouteInfo({
                duration: route.duration,
                distance: route.distance,
            });
            setHasRoute(true);
        },
    });

    // Detect mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(globalThis.innerWidth < 768);
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
        }
    }, [mapRef]);

    const handleClearDirections = () => {
        if (mapRef) {
            const success = removeRouteFromMap(mapRef);
            if (success) {
                setRouteInfo(null);
                setHasRoute(false);
                globalThis.dispatchEvent(new CustomEvent("routeCleared"));
                toast.success("Đã tắt chỉ đường");
            } else {
                toast.error("Không thể tắt chỉ đường");
            }
        }
    };

    const onGetDirections = () => {
        handleGetDirections({
            name: "Vị trí được chọn",
            address: location.address,
            lat: location.lat,
            lng: location.lng,
        });
    };

    // MOBILE: Mini Bottom Sheet UI
    if (isMobile) {
        return (
            <>
                {/* Backdrop */}
                <button
                    type="button"
                    className="fixed inset-0 bg-black/40 z-40 cursor-default transition-opacity duration-300"
                    onClick={onClose}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") {
                            onClose();
                        }
                    }}
                    onTouchMove={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    style={{
                        touchAction: "none",
                        willChange: "opacity",
                    }}
                    aria-label="Đóng"
                />

                {/* Mini Bottom Sheet */}
                <div
                    className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-[24px] shadow-2xl"
                    style={{
                        touchAction: "none",
                    }}
                    onTouchMove={(e) => {
                        e.stopPropagation();
                    }}
                >
                    {/* Drag Handle - swipe down to close */}
                    <button
                        type="button"
                        className="w-full py-2.5 flex justify-center cursor-grab active:cursor-grabbing"
                        onTouchStart={(e) => {
                            const startY = e.touches[0].clientY;
                            const handleMove = (moveEvent: TouchEvent) => {
                                const deltaY =
                                    moveEvent.touches[0].clientY - startY;
                                if (deltaY > 50) {
                                    onClose();
                                    document.removeEventListener(
                                        "touchmove",
                                        handleMove
                                    );
                                }
                            };
                            const handleEnd = () => {
                                document.removeEventListener(
                                    "touchmove",
                                    handleMove
                                );
                                document.removeEventListener(
                                    "touchend",
                                    handleEnd
                                );
                            };
                            document.addEventListener("touchmove", handleMove);
                            document.addEventListener("touchend", handleEnd);
                        }}
                        aria-label="Kéo xuống để đóng"
                    >
                        <div className="w-10 h-1 bg-muted rounded-full"></div>
                    </button>

                    <div className="px-4 pb-6 space-y-3">
                        {/* Header */}
                        <div className="flex items-center gap-3">
                            <span className="text-2xl flex-shrink-0">📍</span>
                            <div className="flex-1 min-w-0">
                                <div className="text-base font-medium text-foreground line-clamp-2">
                                    {location.address || "Địa điểm mới"}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    {location.lat.toFixed(6)},{" "}
                                    {location.lng.toFixed(6)}
                                </div>
                            </div>
                        </div>

                        {/* Route info display */}
                        {routeInfo && (
                            <div className="text-sm text-brand-accent text-center p-3 bg-brand/20 rounded-xl border border-brand/30 font-semibold">
                                📍 {formatDistance(routeInfo.distance)} • ⏱️{" "}
                                {formatDuration(routeInfo.duration)}
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-3 pt-2">
                            <Button
                                size="lg"
                                variant="outline"
                                className="flex-1 bg-secondary hover:bg-accent text-foreground border-border h-12 rounded-xl"
                                onClick={onAddPinory}
                            >
                                <PenTool
                                    className="h-5 w-5 mr-2"
                                    strokeWidth={1.5}
                                />
                                Thêm ghi chú
                            </Button>

                            {hasRoute ? (
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="flex-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 border-red-800 h-12 rounded-xl"
                                    onClick={handleClearDirections}
                                >
                                    <NavigationOff
                                        className="h-5 w-5 mr-2"
                                        strokeWidth={1.5}
                                    />
                                    Tắt đường
                                </Button>
                            ) : (
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="flex-1 bg-brand hover:bg-brand-hover text-white border-0 shadow-lg h-12 rounded-xl"
                                    onClick={onGetDirections}
                                    disabled={isGettingDirections}
                                >
                                    <Navigation
                                        className={`h-5 w-5 mr-2 ${isGettingDirections ? "animate-spin" : ""}`}
                                        strokeWidth={2}
                                    />
                                    Chỉ đường
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // DESKTOP: Popup UI
    return (
        <div
            ref={popupRef}
            className="w-80 z-20 pointer-events-none transition-opacity duration-200"
            style={{
                ...popupStyle,
                opacity: isPositioned ? 1 : 0,
            }}
        >
            {/* Smart Arrow */}
            {arrowPosition === "bottom" ? (
                <div
                    className="absolute top-full transform -translate-x-1/2"
                    style={{ left: `${arrowOffset}%` }}
                >
                    <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-blue-500 filter drop-shadow-sm" />
                </div>
            ) : (
                <div
                    className="absolute bottom-full transform -translate-x-1/2"
                    style={{ left: `${arrowOffset}%` }}
                >
                    <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-blue-500 filter drop-shadow-sm" />
                </div>
            )}

            <Card className="shadow-2xl border border-border/50 rounded-2xl overflow-hidden bg-card/95 backdrop-blur-md pointer-events-auto">
                <div className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-2 pb-3 border-b border-border/30">
                        <span className="text-2xl flex-shrink-0">📍</span>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">
                                {location.address}
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
                            {location.address}
                        </span>
                    </div>

                    {/* Coordinates */}
                    <div className="text-xs text-muted-foreground">
                        {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </div>

                    {/* Route info display */}
                    {routeInfo && (
                        <div className="text-xs text-brand-accent text-center p-3 bg-brand/20 rounded-xl border border-brand/30 shadow-lg font-semibold">
                            📍 {formatDistance(routeInfo.distance)} • ⏱️{" "}
                            {formatDuration(routeInfo.duration)}
                        </div>
                    )}

                    {/* Action buttons */}
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
                        ) : (
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 bg-brand hover:bg-brand-hover text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                                onClick={onGetDirections}
                                disabled={isGettingDirections}
                            >
                                <Navigation
                                    className={`h-3 w-3 mr-1 ${isGettingDirections ? "animate-spin" : ""}`}
                                    strokeWidth={2}
                                />
                                Chỉ đường
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}
