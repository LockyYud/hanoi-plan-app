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

import React from "react";
import mapboxgl from "mapbox-gl";
import type { Pinory } from "@/lib/types";
import { PinoryPopup } from "@/components/pinory/popup/pinory-popup";
import { LocationPreviewPopup } from "@/components/pinory/popup/location-preview-popup";
import { DirectionPopup } from "@/components/pinory/direction-popup";
import { FriendLocationPopup } from "@/components/friends/pinory/friend-pinory-popup";

interface MapPopupLayerProps {
    // Selected note popup
    readonly selectedPinory: Pinory | null;
    readonly onCloseSelectedNote: () => void;
    readonly onViewNoteDetails: () => void;
    readonly onDeleteNote: () => void;

    // Clicked location popup
    readonly clickedPinory: {
        lng: number;
        lat: number;
        address?: string;
    } | null;
    readonly showPinoryForm: boolean;
    readonly onCloseClickedPinory: () => void;
    readonly onAddPinory: () => void;

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
    readonly onCloseFriendPinory: () => void;
    readonly onViewFriendDetails: () => void;

    // Map ref for popup positioning
    readonly mapRef: React.RefObject<mapboxgl.Map | null>;
}

export function MapPopupLayer({
    selectedPinory,
    onCloseSelectedNote,
    onViewNoteDetails,
    onDeleteNote,
    clickedPinory,
    showPinoryForm,
    onCloseClickedPinory,
    onAddPinory,
    showDirectionPopup,
    directionInfo,
    onCloseDirection,
    selectedFriendPinory,
    isMobile,
    onCloseFriendPinory,
    onViewFriendDetails,
    mapRef,
}: Readonly<MapPopupLayerProps>) {
    return (
        <>
            {/* Selected Note Popup */}
            {selectedPinory && (
                <PinoryPopup
                    pinory={selectedPinory}
                    mapRef={
                        mapRef.current
                            ? (mapRef as React.RefObject<mapboxgl.Map>)
                            : undefined
                    }
                    onClose={onCloseSelectedNote}
                    onViewDetails={onViewNoteDetails}
                    onDelete={onDeleteNote}
                />
            )}

            {/* Clicked Location Popup (only show if no note selected and no form shown) */}
            {clickedPinory && !showPinoryForm && !selectedPinory && (
                <LocationPreviewPopup
                    location={{
                        lng: clickedPinory.lng,
                        lat: clickedPinory.lat,
                        address: clickedPinory.address || "",
                    }}
                    mapRef={
                        mapRef.current
                            ? (mapRef as React.RefObject<mapboxgl.Map>)
                            : undefined
                    }
                    onClose={onCloseClickedPinory}
                    onAddPinory={onAddPinory}
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
                    pinory={selectedFriendPinory}
                    mapRef={
                        mapRef.current
                            ? (mapRef as React.RefObject<mapboxgl.Map>)
                            : undefined
                    }
                    onClose={onCloseFriendPinory}
                    onViewDetails={onViewFriendDetails}
                />
            )}
        </>
    );
}
