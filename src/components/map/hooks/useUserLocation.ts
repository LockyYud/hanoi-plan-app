/**
 * useUserLocation
 * 
 * Custom hook to manage user's current location marker on the map.
 * Creates a Google Maps style location marker with pulse animation.
 * 
 * @param mapRef - Reference to the Mapbox map instance
 * @param mapLoaded - Whether the map has finished loading
 * @param session - Next-auth session object (only show marker when logged in)
 * @returns User location state and update function
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Session } from 'next-auth';
import { getCurrentLocation } from '@/lib/geolocation';
import type { UseUserLocationReturn } from '../types/map.types';

export function useUserLocation(
  mapRef: React.RefObject<mapboxgl.Map | null>,
  mapLoaded: boolean,
  session: Session | null
): UseUserLocationReturn {
  const userLocationMarker = useRef<mapboxgl.Marker | null>(null);
  const [userLocation, setUserLocation] = useState<{ lng: number; lat: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Create user location marker element (Google Maps style)
  const createUserLocationMarker = useCallback((userImage?: string | null) => {
    // Main container with pulse animation
    const markerElement = document.createElement('div');
    markerElement.className = 'user-location-marker';
    markerElement.style.cssText = `
      width: 40px;
      height: 40px;
      position: relative;
      cursor: pointer;
      pointer-events: auto;
    `;

    // Pulse background circle (animated)
    const pulseCircle = document.createElement('div');
    pulseCircle.className = 'user-location-pulse';
    pulseCircle.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 40px;
      height: 40px;
      background: rgba(66, 133, 244, 0.3);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      animation: userLocationPulse 2s infinite ease-out;
    `;

    // Accuracy circle (static, larger)
    const accuracyCircle = document.createElement('div');
    accuracyCircle.className = 'user-location-accuracy';
    accuracyCircle.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 30px;
      height: 30px;
      background: rgba(66, 133, 244, 0.2);
      border: 2px solid rgba(66, 133, 244, 0.5);
      border-radius: 50%;
      transform: translate(-50%, -50%);
    `;

    // Main dot with user avatar or icon
    const mainDot = document.createElement('div');
    mainDot.className = 'user-location-dot';
    mainDot.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 20px;
      height: 20px;
      background: #4285f4;
      border: 3px solid white;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      z-index: 3;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    `;

    // User avatar or default icon inside the dot
    if (userImage) {
      const img = document.createElement('img');
      img.src = userImage;
      img.style.cssText = `
        width: 14px;
        height: 14px;
        border-radius: 50%;
        object-fit: cover;
        display: block;
      `;
      img.onerror = () => {
        // Fallback to blue dot if image fails
        mainDot.style.background = '#4285f4';
      };
      mainDot.appendChild(img);
    }

    // Add CSS animation keyframes to document
    if (!document.querySelector('#user-location-styles')) {
      const style = document.createElement('style');
      style.id = 'user-location-styles';
      style.textContent = `
        @keyframes userLocationPulse {
          0% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(2.5);
            opacity: 0;
          }
        }
        
        .user-location-marker:hover .user-location-dot {
          transform: translate(-50%, -50%) scale(1.2);
          transition: transform 0.2s ease;
        }

        .user-location-marker:hover .user-location-accuracy {
          border-color: rgba(66, 133, 244, 0.8);
          background: rgba(66, 133, 244, 0.3);
          transition: all 0.2s ease;
        }

        .user-location-dot {
          transition: transform 0.2s ease;
        }
      `;
      document.head.appendChild(style);
    }

    // Assemble the marker
    markerElement.appendChild(pulseCircle);
    markerElement.appendChild(accuracyCircle);
    markerElement.appendChild(mainDot);

    // Click handler
    markerElement.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('📍 User location marker clicked');

      // Add click animation
      mainDot.style.transform = 'translate(-50%, -50%) scale(0.8)';
      setTimeout(() => {
        mainDot.style.transform = 'translate(-50%, -50%) scale(1)';
        mainDot.style.transition = 'transform 0.2s ease';
      }, 100);
    });

    return markerElement;
  }, []);

  // Update user location marker
  const updateUserLocation = useCallback(async () => {
    if (!mapRef.current || !session) return;

    try {
      const location = await getCurrentLocation();
      console.log('📍 User location:', location);
      setUserLocation(location);
      setError(null);

      // Check if marker already exists at same location
      if (userLocationMarker.current) {
        const currentLngLat = userLocationMarker.current.getLngLat();
        const distance =
          Math.abs(currentLngLat.lng - location.lng) +
          Math.abs(currentLngLat.lat - location.lat);

        // Only update if location changed significantly (> 0.0001 degrees ~10m)
        if (distance < 0.0001) {
          console.log('📍 User location unchanged, keeping existing marker');
          return;
        }

        // Update existing marker position instead of recreating
        userLocationMarker.current.setLngLat([location.lng, location.lat]);
        console.log('📍 User location marker position updated');
        return;
      }

      // Create new marker only if none exists
      const markerElement = createUserLocationMarker(session?.user?.image);
      userLocationMarker.current = new mapboxgl.Marker({
        element: markerElement,
        anchor: 'center',
        offset: [0, 0],
        pitchAlignment: 'map',
        rotationAlignment: 'map',
      })
        .setLngLat([location.lng, location.lat])
        .addTo(mapRef.current);

      console.log('✅ User location marker created with Google Maps style');
    } catch (err) {
      console.error('❌ Could not get user location:', err);
      setError(err instanceof Error ? err.message : 'Failed to get location');
    }
  }, [mapRef, session, createUserLocationMarker]);

  // Add user location marker when user logs in
  useEffect(() => {
    if (mapLoaded && session) {
      updateUserLocation();
    } else if (!session && userLocationMarker.current) {
      // Remove marker when user logs out
      userLocationMarker.current.remove();
      userLocationMarker.current = null;
      setUserLocation(null);
    }
  }, [mapLoaded, session, updateUserLocation]);

  return {
    userLocation,
    userLocationMarker,
    updateUserLocation,
    error,
  };
}
