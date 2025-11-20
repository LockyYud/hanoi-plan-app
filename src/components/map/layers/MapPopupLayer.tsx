/**
 * MapPopupLayer
 * 
 * UI layer that manages all popup displays:
 * - PinoryPopup (selected note)
 * - PinoryPopup (clicked location)
 * - DirectionPopup (route directions)
 * - FriendLocationPopup (friend's note)
 */

import React from 'react';
import mapboxgl from 'mapbox-gl';
import type { Pinory } from '@/lib/types';
import { PinoryPopup } from '../pinory-popup';
import { DirectionPopup } from '../direction-popup';
import { FriendLocationPopup } from '../friend-location-popup';

interface MapPopupLayerProps {
  // Selected user's own note
  readonly selectedPinory: Pinory | null;
  readonly onCloseSelectedPinory: () => void;
  readonly onViewDetails: () => void;
  readonly onDeleteNote: () => Promise<void>;

  // Clicked location (new note)
  readonly clickedLocation: { lng: number; lat: number; address?: string } | null;
  readonly showLocationForm: boolean;
  readonly onCloseClickedLocation: () => void;
  readonly onAddNote: () => void;

  // Direction popup
  readonly showDirectionPopup: boolean;
  readonly directionInfo: {
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
  } | null;
  readonly onCloseDirections: () => void;

  // Friend location
  readonly selectedFriendPinory: Pinory | null;
  readonly isMobile: boolean;
  readonly onCloseFriendPinory: () => void;
  readonly onViewFriendDetails: () => void;

  // Map ref for all popups
  readonly mapRef: React.RefObject<mapboxgl.Map | null>;
}

export function MapPopupLayer({
  selectedPinory,
  onCloseSelectedPinory,
  onViewDetails,
  onDeleteNote,
  clickedLocation,
  showLocationForm,
  onCloseClickedLocation,
  onAddNote,
  showDirectionPopup,
  directionInfo,
  onCloseDirections,
  selectedFriendPinory,
  isMobile,
  onCloseFriendPinory,
  onViewFriendDetails,
  mapRef,
}: MapPopupLayerProps) {
  return (
    <>
      {/* User's own selected note popup */}
      {selectedPinory && (
        <PinoryPopup
          pinory={selectedPinory}
          mapRef={mapRef.current ? (mapRef as React.RefObject<mapboxgl.Map>) : undefined}
          onClose={onCloseSelectedPinory}
          onViewDetails={onViewDetails}
          onDelete={onDeleteNote}
        />
      )}

      {/* Clicked location popup (for creating new note) */}
      {clickedLocation && !showLocationForm && !selectedPinory && (
        <PinoryPopup
          location={{
            lng: clickedLocation.lng,
            lat: clickedLocation.lat,
            address: clickedLocation.address || '',
          }}
          mapRef={mapRef.current ? (mapRef as React.RefObject<mapboxgl.Map>) : undefined}
          onClose={onCloseClickedLocation}
          onAddNote={onAddNote}
        />
      )}

      {/* Direction popup */}
      {showDirectionPopup && directionInfo && (
        <DirectionPopup
          isVisible={showDirectionPopup}
          destination={directionInfo.destination}
          routeInfo={directionInfo.routeInfo}
          onClose={onCloseDirections}
        />
      )}

      {/* Friend location popup (desktop only) */}
      {selectedFriendPinory && !isMobile && (
        <FriendLocationPopup
          locationNote={selectedFriendPinory}
          mapRef={mapRef.current ? (mapRef as React.RefObject<mapboxgl.Map>) : undefined}
          onClose={onCloseFriendPinory}
          onViewDetails={onViewFriendDetails}
        />
      )}
    </>
  );
}
