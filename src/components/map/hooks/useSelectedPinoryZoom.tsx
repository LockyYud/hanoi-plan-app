/**
 * useSelectedPinoryZoom
 *
 * Custom hook that automatically zooms to a pinory when it's selected.
 * Works for both marker clicks and sidebar selections.
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

    // Get current zoom level
    const currentZoom = map.getZoom();

    // Zoom to the selected pinory location
    map.flyTo({
      center: [selectedPinory.lng, selectedPinory.lat],
      zoom: Math.max(currentZoom, minZoomLevel), // Zoom to at least minZoomLevel
      duration,
    });
  }, [mapRef, mapLoaded, selectedPinory, minZoomLevel, duration]);
}
