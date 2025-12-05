/**
 * MapControlsLayer
 *
 * UI layer component that renders all map controls including:
 * - MapControls (zoom, locate, style toggle)
 * - FloatingActionButton (create note, journey)
 * - PinoriesLayerControl (my pinories list)
 * - FriendsLayerControl (toggle friends layer)
 * - ProfileControl (user profile & settings)
 */

import React from "react";
import mapboxgl from "mapbox-gl";
import { MapControls } from "../core/map-controls";
import { FloatingActionButton } from "@/components/pinory/floating-action-button";
import { PinoriesLayerControl } from "@/components/pinory/pinories-layer-control";
import { FriendsLayerControl } from "@/components/friends/friends-layer-control";
import { ProfileControl } from "@/components/layout/profile-control";

interface MapControlsLayerProps {
    readonly mapRef: React.RefObject<mapboxgl.Map | null>;
    readonly onCreateNote: (location: {
        lng: number;
        lat: number;
        address?: string;
    }) => void;
    readonly onCreateJourney: () => void;
}

export function MapControlsLayer({
    mapRef,
    onCreateNote,
    onCreateJourney,
}: Readonly<MapControlsLayerProps>) {
    return (
        <>
            {/* Right side controls - Zoom, locate, style, profile */}
            <MapControls mapRef={mapRef} />
            <ProfileControl />

            {/* Left side controls - Pinories and Friends */}
            <PinoriesLayerControl />
            <FriendsLayerControl />

            {/* Center bottom - Floating action button */}
            <FloatingActionButton
                onCreateNote={onCreateNote}
                onCreateJourney={onCreateJourney}
            />
        </>
    );
}
