/**
 * MapControlsLayer
 * 
 * UI layer that renders all map controls:
 * - MapControls (zoom, location, etc)
 * - FloatingActionButton (create note, journey)
 * - FriendsLayerControl (toggle friends layer)
 */

import React from 'react';
import mapboxgl from 'mapbox-gl';
import { MapControls } from '../map-controls';
import { FloatingActionButton } from '../floating-action-button';
import { FriendsLayerControl } from '../friends-layer-control';

interface MapControlsLayerProps {
  readonly mapRef: React.RefObject<mapboxgl.Map | null>;
  readonly onCreateNote: (location: { lng: number; lat: number; address?: string }) => void;
  readonly onCreateJourney: () => void;
}

export function MapControlsLayer({
  mapRef,
  onCreateNote,
  onCreateJourney,
}: MapControlsLayerProps) {
  return (
    <>
      <MapControls mapRef={mapRef} />
      <FriendsLayerControl />
      <FloatingActionButton
        onCreateNote={onCreateNote}
        onCreateJourney={onCreateJourney}
      />
    </>
  );
}
