/**
 * MapDialogLayer
 * 
 * UI layer component that manages all map dialogs:
 * - LocationNoteForm (add/edit)
 * - NoteDetailsView
 * - FriendLocationDetailsView
 * - CreateJourneyDialog
 * - MemoryLaneView
 * - RouteDisplay
 */

import React from 'react';
import type { Pinory } from '@/lib/types';
import { LocationNoteForm } from '../location-note-form';
import { NoteDetailsView } from '../note-details-view';
import { FriendLocationDetailsView } from '../friend-location-details-view';
import { CreateJourneyDialog } from '@/components/journey/create-journey-dialog';
import { MemoryLaneView } from '@/components/timeline/memory-lane-view';
import { RouteDisplay } from '@/components/timeline/route-display';

interface MapDialogLayerProps {
  // Location form (add mode)
  readonly showLocationForm: boolean;
  readonly clickedLocation: { lng: number; lat: number; address?: string } | null;
  readonly onCloseLocationForm: () => void;
  readonly onSubmitLocationForm: (data: any) => void;

  // Location form (edit mode)
  readonly showEditForm: boolean;
  readonly editingNote: Pinory | null;
  readonly onCloseEditForm: () => void;
  readonly onSubmitEditForm: (data: any) => void;

  // Note details dialog
  readonly showDetailsDialog: boolean;
  readonly selectedPinory: Pinory | null;
  readonly onCloseDetailsDialog: () => void;
  readonly onEditNote: () => void;
  readonly onDeleteNote: () => void;

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
  editingNote,
  onCloseEditForm,
  onSubmitEditForm,
  showDetailsDialog,
  selectedPinory,
  onCloseDetailsDialog,
  onEditNote,
  onDeleteNote,
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
        <LocationNoteForm
          isOpen={showLocationForm}
          onClose={onCloseLocationForm}
          location={clickedLocation}
          onSubmit={onSubmitLocationForm}
        />
      )}

      {/* Edit Location Note Form */}
      {editingNote && showEditForm && (
        <LocationNoteForm
          isOpen={showEditForm}
          onClose={onCloseEditForm}
          location={{
            lng: editingNote.lng,
            lat: editingNote.lat,
            address: editingNote.address,
          }}
          existingNote={{
            id: editingNote.id,
            content: editingNote.content || '',
            mood: editingNote.mood,
            images: editingNote.images,
            placeName: editingNote.placeName || editingNote.name,
            visitTime: editingNote.visitTime,
            category: editingNote.categoryId || undefined,
            coverImageIndex: editingNote.coverImageIndex,
            visibility: editingNote.visibility,
          }}
          onSubmit={onSubmitEditForm}
        />
      )}

      {/* Note Details Dialog */}
      {selectedPinory && showDetailsDialog && (
        <NoteDetailsView
          isOpen={showDetailsDialog}
          onClose={onCloseDetailsDialog}
          note={selectedPinory}
          onEdit={onEditNote}
          onDelete={onDeleteNote}
        />
      )}

      {/* Friend Location Details Dialog */}
      {selectedFriendPinory && showFriendDetailsDialog && (
        <FriendLocationDetailsView
          isOpen={showFriendDetailsDialog}
          locationNote={selectedFriendPinory}
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
          sortBy={routeSortBy as 'time' | 'custom'}
          onClose={onCloseRoute}
        />
      )}
    </>
  );
}
