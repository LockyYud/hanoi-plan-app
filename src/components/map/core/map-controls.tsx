"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Layers, Menu, Navigation, ZoomIn, ZoomOut } from "lucide-react";
import { useUIStore } from "@/lib/store";
import { getCurrentLocation } from "@/lib/geolocation";
import { toast } from "sonner";
import mapboxgl from "mapbox-gl";
import { cn } from "@/lib/utils";

interface MapControlsProps {
    readonly mapRef: React.RefObject<mapboxgl.Map | null>;
}

export function MapControls({ mapRef }: MapControlsProps) {
    const { sidebarOpen, setSidebarOpen } = useUIStore();
    const [isLocating, setIsLocating] = useState(false);
    const [mapStyle, setMapStyle] = useState<"streets" | "satellite">(
        "streets"
    );

    const handleToggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const handleLocateMe = useCallback(async () => {
        if (!mapRef.current) return;

        setIsLocating(true);
        try {
            toast.loading("Đang lấy vị trí...", { id: "locate" });

            const location = await getCurrentLocation();

            mapRef.current.flyTo({
                center: [location.lng, location.lat],
                zoom: 16,
                duration: 1500,
            });

            toast.success("Đã tìm thấy vị trí của bạn!", { id: "locate" });
        } catch (error) {
            console.error("Error getting location:", error);
            toast.error("Không thể lấy vị trí hiện tại", {
                description:
                    error instanceof Error ? error.message : "Vui lòng thử lại",
                id: "locate",
            });
        } finally {
            setIsLocating(false);
        }
    }, [mapRef]);

    const handleZoomIn = () => {
        if (mapRef.current) {
            mapRef.current.zoomIn({ duration: 300 });
        }
    };

    const handleZoomOut = () => {
        if (mapRef.current) {
            mapRef.current.zoomOut({ duration: 300 });
        }
    };

    const handleToggleStyle = () => {
        if (!mapRef.current) return;

        const newStyle =
            mapStyle === "streets"
                ? "mapbox://styles/mapbox/satellite-streets-v12"
                : "mapbox://styles/mapbox/streets-v12";

        mapRef.current.setStyle(newStyle);
        setMapStyle(mapStyle === "streets" ? "satellite" : "streets");

        toast.success(
            `Đã chuyển sang chế độ ${mapStyle === "streets" ? "vệ tinh" : "đường phố"}`,
            { duration: 1500 }
        );
    };

    return (
        <>
            {/* Toggle Sidebar Button - Top Left (Only shown when sidebar is closed) */}
            {!sidebarOpen && (
                <div className="absolute top-4 left-4 z-10">
                    <Button
                        size="sm"
                        onClick={handleToggleSidebar}
                        className="h-10 w-10 p-0 rounded-xl shadow-lg bg-brand hover:bg-brand-hover text-white transition-all duration-300"
                        title="Mở sidebar"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                </div>
            )}

            {/* Map Controls - Right Side */}
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                {/* Zoom Controls */}
                <div className="flex flex-col gap-1 bg-background/95 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-border">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleZoomIn}
                        className="h-10 w-10 p-0 hover:bg-accent rounded-none border-b border-border"
                        title="Phóng to"
                    >
                        <ZoomIn className="h-5 w-5 text-foreground" />
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleZoomOut}
                        className="h-10 w-10 p-0 hover:bg-accent rounded-none"
                        title="Thu nhỏ"
                    >
                        <ZoomOut className="h-5 w-5 text-foreground" />
                    </Button>
                </div>

                {/* Locate Me */}
                <Button
                    size="sm"
                    onClick={handleLocateMe}
                    disabled={isLocating}
                    className="h-10 w-10 p-0 rounded-xl shadow-lg bg-background/95 hover:bg-accent backdrop-blur-sm border border-border"
                    title="Vị trí của tôi"
                >
                    <Navigation
                        className={cn(
                            "h-5 w-5 text-blue-600 dark:text-blue-400",
                            isLocating && "animate-spin"
                        )}
                    />
                </Button>

                {/* Map Style Toggle */}
                <Button
                    size="sm"
                    onClick={handleToggleStyle}
                    className="h-10 w-10 p-0 rounded-xl shadow-lg bg-background/95 hover:bg-accent backdrop-blur-sm border border-border"
                    title={
                        mapStyle === "streets"
                            ? "Chế độ vệ tinh"
                            : "Chế độ đường phố"
                    }
                >
                    <Layers className="h-5 w-5 text-foreground" />
                </Button>
            </div>
        </>
    );
}
