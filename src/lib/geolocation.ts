import mapboxgl from 'mapbox-gl';

export interface UserLocation {
    lat: number;
    lng: number;
    accuracy?: number;
}

export interface RouteOptions {
    profile?: 'driving' | 'walking' | 'cycling';
    avoid?: string[];
}

/**
 * Get user's current location using browser geolocation API
 */
export const getCurrentLocation = (): Promise<UserLocation> => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation is not supported by this browser"));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                });
            },
            (error) => {
                let message = "Unable to get location";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = "Location access denied by user";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = "Location information unavailable";
                        break;
                    case error.TIMEOUT:
                        message = "Location request timed out";
                        break;
                }
                reject(new Error(message));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000, // 5 minutes
            }
        );
    });
};

/**
 * Get route from Mapbox Directions API
 */
export const getRoute = async (
    start: UserLocation,
    end: UserLocation,
    options: RouteOptions = {}
): Promise<any> => {
    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    if (!accessToken) {
        throw new Error("Mapbox access token not found");
    }

    const { profile = 'driving' } = options;
    const coordinates = `${start.lng},${start.lat};${end.lng},${end.lat}`;

    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinates}`;
    const params = new URLSearchParams({
        access_token: accessToken,
        geometries: 'geojson',
        overview: 'full',
        steps: 'true',
        language: 'vi', // Vietnamese language
        annotations: 'distance,duration',
        continue_straight: 'true',
    });

    try {
        const response = await fetch(`${url}?${params}`);

        if (!response.ok) {
            throw new Error(`Mapbox Directions API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.routes || data.routes.length === 0) {
            throw new Error("No route found");
        }

        console.log('🗺️ Mapbox route data:', data.routes[0]);
        return data.routes[0]; // Return the first (best) route
    } catch (error) {
        console.error("❌ Error fetching Mapbox route:", error);
        throw error;
    }
};

/**
 * Add route to Mapbox map
 */
export const addRouteToMap = (mapRef: any, route: any, sourceId: string = 'route') => {
    // Get the actual map instance
    const map = mapRef?.current || mapRef;

    if (!map || typeof map.getSource !== 'function') {
        console.error('❌ Invalid map reference passed to addRouteToMap:', map);
        throw new Error('Invalid Mapbox map instance');
    }

    console.log('🗺️ Adding route to map:', { map: !!map, route: !!route, sourceId });

    // Remove existing route if any
    if (map.getSource(sourceId)) {
        try {
            map.removeLayer(`${sourceId}-layer`);
            map.removeSource(sourceId);
            console.log('🧹 Removed existing route layer');
        } catch (error) {
            console.warn('⚠️ Could not remove existing route:', error);
        }
    }

    // Validate route geometry
    if (!route.geometry || !route.geometry.coordinates) {
        console.error('❌ Invalid route geometry:', route);
        throw new Error('Route geometry is missing or invalid');
    }

    // Add route source
    map.addSource(sourceId, {
        type: 'geojson',
        data: {
            type: 'Feature',
            properties: {},
            geometry: route.geometry
        }
    });

    // Add route layer
    map.addLayer({
        id: `${sourceId}-layer`,
        type: 'line',
        source: sourceId,
        layout: {
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': '#3b82f6', // Blue color
            'line-width': 8,
            'line-opacity': 0.8
        }
    });

    // Fit map to route bounds
    try {
        const coordinates = route.geometry.coordinates;
        const bounds = new mapboxgl.LngLatBounds();

        coordinates.forEach((coord: [number, number]) => {
            bounds.extend(coord);
        });

        map.fitBounds(bounds, {
            padding: 50,
            duration: 1000 // Smooth animation
        });

        console.log('✅ Route added to Mapbox map successfully');
    } catch (error) {
        console.error('❌ Error fitting bounds:', error);
    }
};

/**
 * Format duration from seconds to human readable
 */
export const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes} phút`;
};

/**
 * Format distance from meters to human readable
 */
export const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
        return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
};

/**
 * Remove route from Mapbox map
 */
export const removeRouteFromMap = (mapRef: any, sourceId: string = 'route') => {
    // Get the actual map instance
    const map = mapRef?.current || mapRef;

    if (!map || typeof map.getSource !== 'function') {
        console.error('❌ Invalid map reference passed to removeRouteFromMap:', map);
        return false;
    }

    console.log('🧹 Removing route from map:', { sourceId });

    try {
        // Remove layer first, then source
        if (map.getLayer(`${sourceId}-layer`)) {
            map.removeLayer(`${sourceId}-layer`);
            console.log('✅ Route layer removed');
        }

        if (map.getSource(sourceId)) {
            map.removeSource(sourceId);
            console.log('✅ Route source removed');
        }

        return true;
    } catch (error) {
        console.error('❌ Error removing route from map:', error);
        return false;
    }
};

/**
 * Check if route exists on map
 */
export const hasActiveRoute = (mapRef: any, sourceId: string = 'route'): boolean => {
    const map = mapRef?.current || mapRef;

    if (!map || typeof map.getSource !== 'function') {
        return false;
    }

    return !!map.getSource(sourceId);
};

/**
 * Open external navigation app with directions using Mapbox Navigation
 */
export const openExternalNavigation = (destination: UserLocation, userLocation?: UserLocation) => {
    const destCoords = `${destination.lng},${destination.lat}`; // Mapbox uses lng,lat order

    // Try to detect mobile platform
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/i.test(navigator.userAgent);

        if (isIOS) {
            // iOS - try Apple Maps first with proper coordinate format
            const appleUrl = userLocation
                ? `maps://maps.apple.com/?saddr=${userLocation.lat},${userLocation.lng}&daddr=${destination.lat},${destination.lng}&dirflg=d`
                : `maps://maps.apple.com/?daddr=${destination.lat},${destination.lng}&dirflg=d`;

            // Try opening Apple Maps
            window.location.href = appleUrl;

            // Fallback to Google Maps after short delay if Apple Maps fails
            setTimeout(() => {
                const googleFallback = userLocation
                    ? `https://maps.google.com/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`
                    : `https://maps.google.com/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;
                window.open(googleFallback, '_blank');
            }, 1000);

        } else if (isAndroid) {
            // Android - Google Maps with geo intent
            const geoUrl = userLocation
                ? `geo:${destination.lat},${destination.lng}?q=${destination.lat},${destination.lng}&mode=d&origin=${userLocation.lat},${userLocation.lng}`
                : `geo:${destination.lat},${destination.lng}?q=${destination.lat},${destination.lng}&mode=d`;

            try {
                window.location.href = geoUrl;
            } catch (error) {
                // Fallback to Google Maps web
                const googleUrl = userLocation
                    ? `https://maps.google.com/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`
                    : `https://maps.google.com/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;
                window.open(googleUrl, '_blank');
            }
        } else {
            // Other mobile - Google Maps web
            const googleUrl = userLocation
                ? `https://maps.google.com/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`
                : `https://maps.google.com/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;
            window.open(googleUrl, '_blank');
        }
    } else {
        // Desktop - Google Maps web (as Mapbox doesn't have web directions interface)
        const googleUrl = userLocation
            ? `https://maps.google.com/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`
            : `https://maps.google.com/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;
        window.open(googleUrl, '_blank');
    }

    // Log for debugging
    console.log('🗺️ Mapbox navigation coordinates:', destCoords);
    console.log('📱 Platform detected:', { isMobile, isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent), isAndroid: /Android/i.test(navigator.userAgent) });
};
