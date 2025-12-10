"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    X,
    MapPin,
    Navigation,
    Eye,
    Trash2,
    NavigationOff,
} from "lucide-react";
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
import type { Pinory } from "@/lib/types";
import { MediaGrid } from "./components/media-grid";

interface PinoryPopupProps {
    readonly pinory: Pinory;
    readonly onClose: () => void;
    readonly onViewDetails?: () => void;
    readonly onDelete?: () => void;
    readonly mapRef?: React.RefObject<mapboxgl.Map>;
}

export function PinoryPopup({
    pinory,
    onClose,
    onViewDetails,
    onDelete,
    mapRef,
}: PinoryPopupProps) {
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
            coordinates: { lng: pinory.lng, lat: pinory.lat },
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

    // Helper function to format time
    const formatTime = (date: Date) => {
        return new Date(date).toLocaleString("vi-VN", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

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
            name: pinory.name || "Ghi chú của bạn",
            address: pinory.address || "",
            lat: pinory.lat,
            lng: pinory.lng,
        });
    };

    // Mobile: Don't render (use bottom sheet instead)
    if (isMobile) {
        return null;
    }

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
                    {/* Header with pinory info */}
                    <div className="flex items-center gap-2 pb-3 border-b border-border/30">
                        <span className="text-2xl flex-shrink-0">
                            {pinory.mood || "📍"}
                        </span>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground">
                                {pinory.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {formatTime(pinory.timestamp)}
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

                    {/* Address */}
                    <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-600 flex items-start gap-1">
                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{pinory.address}</span>
                        </p>
                    </div>

                    {/* Content */}
                    {pinory.content && (
                        <div className="text-sm text-foreground leading-relaxed">
                            {pinory.content}
                        </div>
                    )}

                    {/* Images - Smart Media Grid */}
                    {pinory.images && pinory.images.length > 0 && (
                        <MediaGrid images={pinory.images} />
                    )}

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
                            onClick={onViewDetails}
                        >
                            <Eye className="h-4 w-4 mr-1" strokeWidth={1.5} />
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

                        {onDelete && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="px-3 bg-secondary hover:bg-red-900/30 text-red-400 border-border hover:border-red-800"
                                onClick={onDelete}
                                title="Xóa ghi chú"
                            >
                                <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                            </Button>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}
