/**
 * useRouteDisplay
 * 
 * Custom hook to manage route display and Memory Lane functionality.
 * Handles route rendering, sorting, and cleanup on the map.
 * 
 * @param mapRef - Reference to the Mapbox map instance
 * @param mapLoaded - Whether the map has finished loading
 * @returns Route state and control functions
 */

import { useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import type { Pinory } from '@/lib/types';
import type { UseRouteDisplayReturn } from '../types/map.types';

export function useRouteDisplay(
  mapRef: React.RefObject<mapboxgl.Map | null>,
  mapLoaded: boolean
): UseRouteDisplayReturn {
  const [showRoute, setShowRoute] = useState(false);
  const [routeNotes, setRouteNotes] = useState<Pinory[]>([]);
  const [routeSortBy, setRouteSortBy] = useState<string>('time');

  // Set route information
  const setRouteInfo = useCallback(
    (notes: Pinory[], sortBy: string) => {
      if (!mapRef.current || !mapLoaded) return;

      setRouteNotes(notes);
      setRouteSortBy(sortBy);
      setShowRoute(true);

      console.log('🛣️ Route display:', {
        notesCount: notes.length,
        sortBy,
      });
    },
    [mapRef, mapLoaded]
  );

  // Clear route
  const clearRoute = useCallback(() => {
    setShowRoute(false);
    setRouteNotes([]);
    setRouteSortBy('time');

    console.log('🛣️ Route cleared');
  }, []);

  return {
    showRoute,
    routeNotes,
    routeSortBy,
    setRouteInfo,
    clearRoute,
  };
}
