/**
 * useMapInteractions
 * 
 * Custom hook to handle map interactions and events.
 * Manages map clicks, clicked location marker, and external events (focus, directions).
 * 
 * @param mapRef - Reference to the Mapbox map instance
 * @param mapLoaded - Whether the map has finished loading
 * @param onLocationClick - Optional callback when a location is clicked
 * @returns Clicked location state and marker ref
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import type { UseMapInteractionsReturn, LocationCoords } from '../types/map.types';
import { reverseGeocode } from '../utils/mapGeocoding';
import { addRouteToMap } from '@/lib/geolocation';

export function useMapInteractions(
  mapRef: React.RefObject<mapboxgl.Map | null>,
  mapLoaded: boolean,
  onLocationClick?: (location: LocationCoords) => void
): UseMapInteractionsReturn {
  const [clickedLocation, setClickedLocation] = useState<LocationCoords | null>(null);
  const clickedLocationMarker = useRef<mapboxgl.Marker | null>(null);

  // Create blue dot marker element
  const createClickedMarkerElement = useCallback(() => {
    const markerElement = document.createElement('div');
    markerElement.className = 'clicked-location-marker';
    markerElement.style.cssText = `
      width: 16px;
      height: 16px;
      background: #3b82f6;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      cursor: pointer;
    `;
    return markerElement;
  }, []);

  // Handle map click
  useEffect(() => {
    // CRITICAL: Check both mapRef.current and mapLoaded
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;
    
    // Additional safety check: ensure map is fully functional
    if (!map.on || typeof map.on !== 'function') {
      console.warn('Map event system not ready yet');
      return;
    }

    const handleMapClick = async (e: mapboxgl.MapMouseEvent) => {
      // Re-check map reference inside async handler
      if (!mapRef.current) {
        console.warn('Map reference lost during click handling');
        return;
      }
      
      const { lng, lat } = e.lngLat;
      console.log('🗺️ Map clicked at:', { lng, lat });

      // Remove previous clicked location marker if exists
      if (clickedLocationMarker.current) {
        clickedLocationMarker.current.remove();
        clickedLocationMarker.current = null;
      }

      // Create new marker at clicked location
      const markerElement = createClickedMarkerElement();
      
      // Safety check before adding marker
      if (!mapRef.current) {
        console.warn('Map reference lost during marker creation');
        return;
      }
      
      clickedLocationMarker.current = new mapboxgl.Marker({
        element: markerElement,
        anchor: 'center',
      })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);

      // Get address using reverse geocoding
      const address = await reverseGeocode(lng, lat);

      const location: LocationCoords = { lng, lat, address };
      setClickedLocation(location);

      // Call optional callback
      if (onLocationClick) {
        onLocationClick(location);
      }
    };

    // Add click event listener
    map.on('click', handleMapClick);

    // Cleanup
    return () => {
      map.off('click', handleMapClick);
    };
  }, [mapRef, mapLoaded, onLocationClick, createClickedMarkerElement]);

  // Handle focus location event from sidebar
  useEffect(() => {
    // CRITICAL: Check both mapRef.current and mapLoaded
    if (!mapRef.current || !mapLoaded) return;

    const map = mapRef.current;
    
    // Additional safety check
    if (!map.flyTo || typeof map.flyTo !== 'function') {
      console.warn('Map navigation methods not ready yet');
      return;
    }

    const handleFocusLocation = (
      event: CustomEvent<{ lat: number; lng: number }>
    ) => {
      // Re-check map reference
      if (!mapRef.current) return;
      
      if (event.detail) {
        const { lat, lng } = event.detail;
        mapRef.current.flyTo({
          center: [lng, lat],
          zoom: 16,
          duration: 1000,
        });
      }
    };

    const handleShowDirections = (
      event: CustomEvent<{
        destination: {
          name: string;
          address: string;
          lat: number;
          lng: number;
        };
        routeInfo: {
          duration: number;
          distance: number;
        };
        route?: any;
      }>
    ) => {
      // Re-check map reference
      if (!mapRef.current) return;
      
      if (event.detail) {
        console.log('🗺️ Map: Showing direction popup:', event.detail);

        // Draw route on map if route data is provided
        if (event.detail.route) {
          try {
            console.log('🗺️ Map: Drawing route on map');
            addRouteToMap(mapRef.current, event.detail.route);
          } catch (error) {
            console.error('❌ Map: Error drawing route:', error);
          }
        }
      }
    };

    globalThis.addEventListener(
      'focusLocation',
      handleFocusLocation as EventListener
    );
    globalThis.addEventListener(
      'showDirections',
      handleShowDirections as EventListener
    );

    return () => {
      globalThis.removeEventListener(
        'focusLocation',
        handleFocusLocation as EventListener
      );
      globalThis.removeEventListener(
        'showDirections',
        handleShowDirections as EventListener
      );
    };
  }, [mapRef, mapLoaded]);

  // Cleanup clicked marker when location is cleared
  useEffect(() => {
    if (!clickedLocation && clickedLocationMarker.current) {
      clickedLocationMarker.current.remove();
      clickedLocationMarker.current = null;
    }
  }, [clickedLocation]);

  return {
    clickedLocation,
    setClickedLocation,
    clickedLocationMarker,
  };
}
