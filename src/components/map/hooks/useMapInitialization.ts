/**
 * useMapInitialization
 * 
 * Custom hook to initialize and manage Mapbox map instance.
 * Handles map creation, token validation, error states, and cleanup.
 * 
 * @param initialCenter - Initial map center coordinates [lng, lat]
 * @param initialZoom - Initial zoom level
 * @returns Map refs, loading state, and error state
 */

import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import type { UseMapInitializationReturn } from '../types/map.types';

export function useMapInitialization(
  initialCenter: [number, number],
  initialZoom: number
): UseMapInitializationReturn {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Check if Mapbox token is available and valid
  const hasMapboxToken = Boolean(
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN &&
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN !== 'your-mapbox-token-here'
  );

  useEffect(() => {
    // Don't initialize if container doesn't exist or map already exists
    if (!containerRef.current || mapRef.current) return;

    // Validate token before initialization
    if (!hasMapboxToken) {
      setMapError('Mapbox token không hợp lệ hoặc chưa được cấu hình');
      return;
    }

    try {
      // Set Mapbox access token
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

      // Initialize map
      mapRef.current = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: initialCenter,
        zoom: initialZoom,
        attributionControl: false,
      });

      // Handle map load event
      mapRef.current.on('load', () => {
        setMapLoaded(true);

        // Add custom attribution
        mapRef.current?.addControl(
          new mapboxgl.AttributionControl({
            customAttribution: '© Pinory',
          }),
          'bottom-right'
        );

        // Add navigation control
        mapRef.current?.addControl(
          new mapboxgl.NavigationControl(),
          'top-right'
        );
      });

      // Handle map errors
      mapRef.current.on('error', (error) => {
        console.error('Map error:', error);
        setMapError('Lỗi tải bản đồ. Vui lòng kiểm tra kết nối internet.');
      });
    } catch (error) {
      console.error('Map initialization error:', error);
      setMapError('Không thể khởi tạo bản đồ');
      return;
    }

    // Cleanup on unmount
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [hasMapboxToken, initialCenter, initialZoom]);

  return {
    mapRef,
    containerRef,
    mapLoaded,
    mapError,
    hasMapboxToken,
  };
}
