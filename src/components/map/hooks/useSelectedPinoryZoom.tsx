/**
 * useSelectedPinoryZoom
 *
 * Custom hook that automatically zooms to a pinory when it's selected.
 * Works for both marker clicks and sidebar selections.
 *
 * Uses smart vertical offset to ensure popup has enough space to display
 * without overflowing the viewport edges.
 */

import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import type { Pinory } from "@/lib/types";

interface UseSelectedPinoryZoomParams {
    mapRef: React.RefObject<mapboxgl.Map | null>;
    mapLoaded: boolean;
    selectedPinory: Pinory | null;
    minZoomLevel?: number;
    duration?: number;
}

// Popup positioning constants (should match use-popup-position.ts)
const ESTIMATED_POPUP_HEIGHT = 380; // Average popup height in pixels
const MARKER_OFFSET = 80; // Space between marker and popup
const SAFETY_MARGIN = 20; // Extra margin from viewport edge

export function useSelectedPinoryZoom({
    mapRef,
    mapLoaded,
    selectedPinory,
    minZoomLevel = 15,
    duration = 1000,
}: UseSelectedPinoryZoomParams) {
    useEffect(() => {
        // Only zoom if we have a map, it's loaded, and a pinory is selected
        if (!mapRef.current || !mapLoaded || !selectedPinory) {
            return;
        }

        const map = mapRef.current;
        const currentZoom = map.getZoom();

        // Calculate space needed for popup
        const popupSpaceNeeded =
            ESTIMATED_POPUP_HEIGHT + MARKER_OFFSET + SAFETY_MARGIN;

        // Calculate available space if marker were at viewport center
        const viewportHeight = window.innerHeight;
        const viewportCenter = viewportHeight / 2;
        const spaceBelowIfCentered = viewportCenter - SAFETY_MARGIN;

        // Determine popup direction based on available space
        // This mirrors the logic in use-popup-position.ts
        const hasEnoughSpaceBelow = spaceBelowIfCentered >= popupSpaceNeeded;

        // Calculate vertical offset based on where popup will appear:
        // - If popup goes BELOW marker → offset marker UP (negative y)
        // - If popup goes ABOVE marker → offset marker DOWN (positive y)
        const verticalOffset = hasEnoughSpaceBelow
            ? -(popupSpaceNeeded / 2) // Popup below → marker up
            : popupSpaceNeeded / 2; // Popup above → marker down

        // Zoom to the selected pinory location with smart offset
        map.flyTo({
            center: [selectedPinory.lng, selectedPinory.lat],
            zoom: Math.max(currentZoom, minZoomLevel),
            duration,
            offset: [0, verticalOffset],
        });
    }, [mapRef, mapLoaded, selectedPinory, minZoomLevel, duration]);
}
