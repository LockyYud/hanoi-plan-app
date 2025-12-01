/**
 * MapDialogLayer
 *
 * UI layer component that manages all map dialogs:
 * - PinoryForm (add/edit)
 * - NoteDetailsView
 * - FriendLocationDetailsView
 * - CreateJourneyDialog
 * - MemoryLaneView
 * - RouteDisplay
 */

import React from "react";
import type { Pinory } from "@/lib/types";
import { PinoryForm } from "@/components/pinory/form/pinory-form";
import { PinoryDetailsView } from "@/components/pinory/details/pinory-details-view";
import { FriendPinoryDetailsView } from "@/components/friends/pinory/friend-pinory-details-view";
import { CreateJourneyDialog } from "@/components/journey/create-journey-dialog";
import { MemoryLaneView } from "@/components/timeline/memory-lane-view";
import { RouteDisplay } from "@/components/timeline/route-display";

interface MapDialogLayerProps {
    // Location form (add mode)
    readonly showLocationForm: boolean;
    readonly clickedLocation: {
        lng: number;
        lat: number;
        address?: string;
    } | null;
    readonly onCloseLocationForm: () => void;
    readonly onSubmitLocationForm: (data: any) => void;

    // Location form (edit mode)
    readonly showEditForm: boolean;
    readonly editingPinory: Pinory | null;
    readonly onCloseEditForm: () => void;
    readonly onSubmitEditForm: (data: any) => void;

    // Note details dialog
    readonly showDetailsDialog: boolean;
    readonly selectedPinory: Pinory | null;
    readonly onCloseDetailsDialog: () => void;
    readonly onEditPinory: () => void;
    readonly onDeletePinory: () => void;

    // Friend location details dialog
    readonly showFriendDetailsDialog: boolean;
    readonly selectedFriendPinory: Pinory | null;
    readonly onCloseFriendDetailsDialog: () => void;
    readonly onAddToFavorites: () => void;

    // Journey dialog
    readonly showJourneyDialog: boolean;
    readonly onCloseJourneyDialog: () => void;
    readonly onJourneySuccess: () => void;

    // Memory Lane
    readonly showMemoryLane: boolean;
    readonly onCloseMemoryLane: () => void;
    readonly onShowRoute: (notes: Pinory[], sortBy: string) => void;

    // Route display
    readonly showRoute: boolean;
    readonly routeNotes: Pinory[];
    readonly routeSortBy: string;
    readonly mapInstance: mapboxgl.Map | null;
    readonly onCloseRoute: () => void;
}

export function MapDialogLayer({
    showLocationForm,
    clickedLocation,
    onCloseLocationForm,
    onSubmitLocationForm,
    showEditForm,
    editingPinory,
    onCloseEditForm,
    onSubmitEditForm,
    showDetailsDialog,
    selectedPinory,
    onCloseDetailsDialog,
    onEditPinory,
    onDeletePinory,
    showFriendDetailsDialog,
    selectedFriendPinory,
    onCloseFriendDetailsDialog,
    onAddToFavorites,
    showJourneyDialog,
    onCloseJourneyDialog,
    onJourneySuccess,
    showMemoryLane,
    onCloseMemoryLane,
    onShowRoute,
    showRoute,
    routeNotes,
    routeSortBy,
    mapInstance,
    onCloseRoute,
}: Readonly<MapDialogLayerProps>) {
    return (
        <>
            {/* Add Location Note Form */}
            {clickedLocation && showLocationForm && (
                <PinoryForm
                    isOpen={showLocationForm}
                    onClose={onCloseLocationForm}
                    location={clickedLocation}
                    onSubmit={onSubmitLocationForm}
                />
            )}

            {/* Edit Location Note Form */}
            {editingPinory && showEditForm && (
                <PinoryForm
                    isOpen={showEditForm}
                    onClose={onCloseEditForm}
                    location={{
                        lng: editingPinory.lng,
                        lat: editingPinory.lat,
                        address: editingPinory.address,
                    }}
                    existingPinory={{
                        id: editingPinory.id,
                        content: editingPinory.content || "",
                        images: editingPinory.images,
                        placeName:
                            editingPinory.placeName || editingPinory.name,
                        visitTime: editingPinory.visitTime,
                        category: editingPinory.categoryId || undefined,
                        coverImageIndex: editingPinory.coverImageIndex,
                        visibility: editingPinory.visibility,
                    }}
                    onSubmit={onSubmitEditForm}
                />
            )}

            {/* Note Details Dialog */}
            {selectedPinory && showDetailsDialog && (
                <PinoryDetailsView
                    isOpen={showDetailsDialog}
                    onClose={onCloseDetailsDialog}
                    pinory={selectedPinory}
                    onEdit={onEditPinory}
                    onDelete={onDeletePinory}
                />
            )}

            {/* Friend Location Details Dialog */}
            {selectedFriendPinory && showFriendDetailsDialog && (
                <FriendPinoryDetailsView
                    isOpen={showFriendDetailsDialog}
                    pinory={selectedFriendPinory}
                    onClose={onCloseFriendDetailsDialog}
                    onAddToFavorites={onAddToFavorites}
                />
            )}

            {/* Create Journey Dialog */}
            <CreateJourneyDialog
                isOpen={showJourneyDialog}
                onClose={onCloseJourneyDialog}
                onSuccess={onJourneySuccess}
            />

            {/* Memory Lane View */}
            <MemoryLaneView
                isOpen={showMemoryLane}
                onClose={onCloseMemoryLane}
                onShowRoute={onShowRoute}
            />

            {/* Route Display */}
            {showRoute && routeNotes.length >= 2 && (
                <RouteDisplay
                    map={mapInstance}
                    notes={routeNotes}
                    sortBy={routeSortBy as "time" | "custom"}
                    onClose={onCloseRoute}
                />
            )}
        </>
    );
}
