"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
    getCurrentLocation,
    openExternalNavigation,
    getRoute,
} from "@/lib/geolocation";
import type { DirectionsDestination } from "../types";

interface UseDirectionsOptions {
    /** Toast ID for loading/success/error messages */
    toastId?: string;
    /** Callback after successful route calculation */
    onRouteCalculated?: (route: any) => void;
    /** Whether to open external navigation app */
    openExternal?: boolean;
}

interface UseDirectionsReturn {
    isGettingDirections: boolean;
    handleGetDirections: (destination: DirectionsDestination) => Promise<void>;
}

/**
 * Custom hook for handling directions functionality
 * Includes geolocation, route calculation, and external navigation
 */
export function useDirections(
    options: UseDirectionsOptions = {}
): UseDirectionsReturn {
    const {
        toastId = "directions",
        onRouteCalculated,
        openExternal = true,
    } = options;

    const [isGettingDirections, setIsGettingDirections] = useState(false);

    const handleGetDirections = useCallback(
        async (destination: DirectionsDestination) => {
            setIsGettingDirections(true);

            try {
                toast.loading("Đang lấy vị trí hiện tại...", { id: toastId });

                const currentLocation = await getCurrentLocation();

                toast.loading("Đang tính toán tuyến đường...", { id: toastId });

                // Calculate route using Mapbox Directions API
                const destinationCoords = {
                    lat: destination.lat,
                    lng: destination.lng,
                };
                const route = await getRoute(currentLocation, destinationCoords, {
                    profile: "driving",
                });

                console.log("🗺️ Route calculated:", route);

                // Dispatch event to show direction popup on map
                globalThis.dispatchEvent(
                    new CustomEvent("showDirections", {
                        detail: {
                            destination: {
                                name: destination.name,
                                address: destination.address,
                                lat: destination.lat,
                                lng: destination.lng,
                            },
                            routeInfo: {
                                duration: route.duration, // in seconds
                                distance: route.distance, // in meters
                            },
                            route: route, // Pass full route object for drawing on map
                        },
                    })
                );

                toast.success("Đã tìm thấy tuyến đường!", { id: toastId });

                // Callback with route data
                onRouteCalculated?.(route);

                // Open external navigation app for actual navigation
                if (openExternal) {
                    openExternalNavigation(destinationCoords, currentLocation);
                }
            } catch (error) {
                console.error("❌ Error getting directions:", error);
                toast.error("Không thể tính toán tuyến đường", {
                    description:
                        error instanceof Error
                            ? error.message
                            : "Vui lòng thử lại sau",
                    id: toastId,
                });

                // Fallback: open without current location
                if (openExternal) {
                    openExternalNavigation({
                        lat: destination.lat,
                        lng: destination.lng,
                    });
                }
            } finally {
                setIsGettingDirections(false);
            }
        },
        [toastId, onRouteCalculated, openExternal]
    );

    return {
        isGettingDirections,
        handleGetDirections,
    };
}
