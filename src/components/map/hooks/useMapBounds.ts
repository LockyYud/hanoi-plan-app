/**
 * useMapBounds
 * 
 * Custom hook to track map bounds and zoom level with throttling optimization.
 * Updates bounds and zoom when map moves, with throttling to reduce unnecessary recalculations.
 * 
 * @param mapRef - Reference to the Mapbox map instance
 * @param mapLoaded - Whether the map has finished loading
 * @param onBoundsChange - Optional callback when bounds change (for store updates)
 * @param throttleMs - Throttle time in milliseconds (default: 100ms)
 * @returns Current map bounds and zoom level
 */

import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import type { UseMapBoundsReturn } from '../types/map.types';

const DEFAULT_THROTTLE_MS = 100;

export function useMapBounds(
  mapRef: React.RefObject<mapboxgl.Map | null>,
  mapLoaded: boolean,
  onBoundsChange?: (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => void,
  throttleMs: number = DEFAULT_THROTTLE_MS
): UseMapBoundsReturn {
  const [mapBounds, setMapBounds] = useState<mapboxgl.LngLatBounds | null>(
    null
  );
  const [currentZoom, setCurrentZoom] = useState(0);
  const lastBoundsUpdate = useRef<number>(0);
  const isInitialized = useRef<boolean>(false);
  
  // Stable callback ref to avoid dependency issues
  const onBoundsChangeRef = useRef(onBoundsChange);
  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
  }, [onBoundsChange]);

  useEffect(() => {
    // CRITICAL: Check both mapRef.current and mapLoaded
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;
    
    // Additional safety check: ensure map is fully initialized
    if (!map.getBounds || typeof map.getZoom !== 'function') {
      console.warn('Map methods not available yet');
      return;
    }

    // Set initial bounds ONLY ONCE
    if (!isInitialized.current) {
      const initialBounds = map.getBounds();
      const initialZoom = map.getZoom();
      
      // Verify bounds is valid before setting state
      if (!initialBounds) {
        console.warn('Map bounds not available yet');
        return;
      }
      
      setMapBounds(initialBounds);
      setCurrentZoom(initialZoom);
      isInitialized.current = true;

      // Call initial bounds change callback
      if (onBoundsChangeRef.current && initialBounds) {
        onBoundsChangeRef.current({
          north: initialBounds.getNorth(),
          south: initialBounds.getSouth(),
          east: initialBounds.getEast(),
          west: initialBounds.getWest(),
        });
      }
    }

    // Track moveend events with throttling
    const handleMoveEnd = () => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastBoundsUpdate.current;

      // Throttle updates to reduce cluster recalculations
      if (timeSinceLastUpdate >= throttleMs) {
        const bounds = map.getBounds();
        const zoom = map.getZoom();

        if (bounds) {
          setMapBounds(bounds);
          setCurrentZoom(zoom);
          lastBoundsUpdate.current = now;

          // Call bounds change callback if provided
          if (onBoundsChangeRef.current) {
            onBoundsChangeRef.current({
              north: bounds.getNorth(),
              south: bounds.getSouth(),
              east: bounds.getEast(),
              west: bounds.getWest(),
            });
          }
        }
      }
    };

    // Add event listener
    map.on('moveend', handleMoveEnd);

    // Cleanup
    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [mapRef, mapLoaded, throttleMs]); // REMOVED mapBounds and onBoundsChange from dependencies

  return {
    mapBounds,
    currentZoom,
  };
}
