/**
 * Map Geocoding Utilities
 * 
 * Utilities for geocoding operations (address ↔ coordinates conversion)
 */

import mapboxgl from 'mapbox-gl';

/**
 * Reverse geocoding - Convert coordinates to address
 * @param lng - Longitude
 * @param lat - Latitude
 * @returns Address string or coordinates as fallback
 */
export async function reverseGeocode(
  lng: number,
  lat: number
): Promise<string> {
  try {
    const accessToken =
      mapboxgl.accessToken || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    if (!accessToken) {
      throw new Error('Mapbox access token not available');
    }

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${accessToken}&language=vi,en&country=vn`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const address = data.features?.[0]?.place_name;

    if (address) {
      return address;
    }

    // Fallback to coordinates
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    // Return coordinates as fallback
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

/**
 * Forward geocoding - Convert address to coordinates
 * @param address - Address string to geocode
 * @returns Coordinates or null if not found
 */
export async function forwardGeocode(
  address: string
): Promise<{ lng: number; lat: number } | null> {
  try {
    const accessToken =
      mapboxgl.accessToken || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    if (!accessToken) {
      throw new Error('Mapbox access token not available');
    }

    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${accessToken}&language=vi,en&country=vn`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const coordinates = data.features?.[0]?.center;

    if (coordinates?.length === 2) {
      return {
        lng: coordinates[0],
        lat: coordinates[1],
      };
    }

    return null;
  } catch (error) {
    console.error('Forward geocoding failed:', error);
    return null;
  }
}
