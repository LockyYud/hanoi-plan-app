/**
 * Map Types - Shared TypeScript types for map components
 */

import mapboxgl from 'mapbox-gl';
import type { Pinory } from '@/lib/types';

/**
 * Map initialization return type
 */
export interface UseMapInitializationReturn {
  mapRef: React.RefObject<mapboxgl.Map | null>;
  containerRef: React.RefObject<HTMLDivElement>;
  mapLoaded: boolean;
  mapError: string | null;
  hasMapboxToken: boolean;
}

/**
 * Map bounds tracking return type
 */
export interface UseMapBoundsReturn {
  mapBounds: mapboxgl.LngLatBounds | null;
  currentZoom: number;
}

/**
 * Location coordinates
 */
export interface LocationCoords {
  lng: number;
  lat: number;
  address?: string;
}

/**
 * Map interactions return type
 */
export interface UseMapInteractionsReturn {
  clickedLocation: LocationCoords | null;
  setClickedLocation: (location: LocationCoords | null) => void;
  clickedLocationMarker: React.RefObject<mapboxgl.Marker | null>;
}

/**
 * Location notes return type
 */
export interface UseLocationNotesReturn {
  locationNotes: Pinory[];
  loading: boolean;
  error: string | null;
  loadLocationNotes: () => Promise<void>;
  addLocationNote: (noteData: any) => Promise<void>;
  updateLocationNote: (noteData: any) => Promise<void>;
  deleteLocationNote: (noteId: string) => Promise<void>;
}

/**
 * User location return type
 */
export interface UseUserLocationReturn {
  userLocation: { lng: number; lat: number } | null;
  userLocationMarker: React.RefObject<mapboxgl.Marker | null>;
  updateUserLocation: () => Promise<void>;
  error: string | null;
}

/**
 * Friend locations return type
 */
export interface UseFriendLocationsReturn {
  friendMarkers: Map<string, mapboxgl.Marker>;
  selectedFriendPinory: Pinory | null;
  setSelectedFriendPinory: (pinory: Pinory | null) => void;
  showFriendDetailsDialog: boolean;
  setShowFriendDetailsDialog: (show: boolean) => void;
}

/**
 * Map markers return type
 */
export interface UseMapMarkersReturn {
  clusters: Array<any>;
  markersRef: React.RefObject<Map<string, mapboxgl.Marker>>;
}

/**
 * Route display return type
 */
export interface UseRouteDisplayReturn {
  showRoute: boolean;
  routeNotes: Pinory[];
  routeSortBy: string;
  setRouteInfo: (notes: Pinory[], sortBy: string) => void;
  clearRoute: () => void;
}
