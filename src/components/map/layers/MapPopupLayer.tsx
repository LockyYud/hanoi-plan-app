/**
 * MapPopupLayer
 * 
 * UI layer component that manages all map popups:
 * - PinoryPopup (for selected notes)
 * - PinoryPopup (for clicked locations)
 * - DirectionPopup
 * - FriendLocationPopup
 * 
 * Ensures only one popup is shown at a time.
 */

import React from 'react';
import mapboxgl from 'mapbox-gl';
import type { Pinory } from '@/lib/types';
import { PinoryPopup } from '../pinory-popup';
import { DirectionPopup } from '../direction-popup';
import { FriendLocationPopup } from '../friend-location-popup';

interface MapPopupLayerProps {
  // Selected note popup
  readonly selectedPinory: Pinory | null;
  readonly onCloseSelectedNote: () => void;
  readonly onViewNoteDetails: () => void;
  readonly onDeleteNote: () => void;

  // Clicked location popup
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
  readonly onCloseDirection: () => void;

  // Friend location popup
  readonly selectedFriendPinory: Pinory | null;
  readonly isMobile: boolean;
  readonly onCloseFriendLocation: () => void;
  readonly onViewFriendDetails: () => void;

  // Map ref for popup positioning
  readonly mapRef: React.RefObject<mapboxgl.Map | null>;
}

export function MapPopupLayer({
  selectedPinory,
  onCloseSelectedNote,
  onViewNoteDetails,
  onDeleteNote,
  clickedLocation,
  showLocationForm,
  onCloseClickedLocation,
  onAddNote,
  showDirectionPopup,
  directionInfo,
  onCloseDirection,
  selectedFriendPinory,
  isMobile,
  onCloseFriendLocation,
  onViewFriendDetails,
  mapRef,
}: Readonly<MapPopupLayerProps>) {
  return (
    <>
      {/* Selected Note Popup */}
      {selectedPinory && (
        <PinoryPopup
          pinory={selectedPinory}
          mapRef={mapRef.current ? (mapRef as React.RefObject<mapboxgl.Map>) : undefined}
          onClose={onCloseSelectedNote}
          onViewDetails={onViewNoteDetails}
          onDelete={onDeleteNote}
        />
      )}

      {/* Clicked Location Popup (only show if no note selected and no form shown) */}
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

      {/* Direction Popup */}
      {showDirectionPopup && directionInfo && (
        <DirectionPopup
          isVisible={showDirectionPopup}
          destination={directionInfo.destination}
          routeInfo={directionInfo.routeInfo}
          onClose={onCloseDirection}
        />
      )}

      {/* Friend Location Popup (Desktop only) */}
      {selectedFriendPinory && !isMobile && (
        <FriendLocationPopup
          locationNote={selectedFriendPinory}
          mapRef={mapRef.current ? (mapRef as React.RefObject<mapboxgl.Map>) : undefined}
          onClose={onCloseFriendLocation}
          onViewDetails={onViewFriendDetails}
        />
      )}
    </>
  );
}
