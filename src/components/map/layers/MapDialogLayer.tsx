/**
 * MapDialogLayer
 * 
 * UI layer that manages all dialog/modal displays:
 * - LocationNoteForm (add/edit)
 * - NoteDetailsView (view note details)
 * - FriendLocationDetailsView (view friend's note)
 * - CreateJourneyDialog (create journey)
 * - MemoryLaneView (timeline view)
 * - RouteDisplay (route on map)
 */

import React from 'react';
import mapboxgl from 'mapbox-gl';
import type { Pinory } from '@/lib/types';
import { LocationNoteForm } from '../location-note-form';
import { NoteDetailsView } from '../note-details-view';
import { FriendLocationDetailsView } from '../friend-location-details-view';
import { CreateJourneyDialog } from '@/components/journey/create-journey-dialog';
import { MemoryLaneView } from '@/components/timeline/memory-lane-view';
import { RouteDisplay } from '@/components/timeline/route-display';

interface MapDialogLayerProps {
  // Location form (add new note)
  readonly showLocationForm: boolean;
  readonly clickedLocation: { lng: number; lat: number; address?: string } | null;
  readonly onCloseLocationForm: () => void;
  readonly onSubmitLocationForm: (data: any) => Promise<void>;

  // Edit form
  readonly showEditForm: boolean;
  readonly editingNote: Pinory | null;
  readonly onCloseEditForm: () => void;
  readonly onSubmitEditForm: (data: any) => Promise<void>;

  // Note details view
  readonly showDetailsDialog: boolean;
  readonly selectedPinory: Pinory | null;
  readonly onCloseDetails: () => void;
  readonly onEditNote: () => void;
  readonly onDeleteNoteFromDetails: () => void;

  // Friend location details
  readonly showFriendDetailsDialog: boolean;
  readonly selectedFriendPinory: Pinory | null;
  readonly onCloseFriendDetails: () => void;
  readonly onAddToFavorites: () => Promise<void>;

  // Journey dialog
  readonly showJourneyDialog: boolean;
  readonly onCloseJourney: () => void;
  readonly onJourneySuccess: () => void;

  // Memory Lane
  readonly showMemoryLane: boolean;
  readonly onCloseMemoryLane: () => void;
  readonly onShowRoute: (notes: Pinory[], sortBy: string) => void;

  // Route display
  readonly showRoute: boolean;
  readonly routeNotes: Pinory[];
  readonly routeSortBy: 'time' | 'custom';
  readonly mapForRoute: mapboxgl.Map | null;
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
  onCloseDetails,
  onEditNote,
  onDeleteNoteFromDetails,
  showFriendDetailsDialog,
  selectedFriendPinory,
  onCloseFriendDetails,
  onAddToFavorites,
  showJourneyDialog,
  onCloseJourney,
  onJourneySuccess,
  showMemoryLane,
  onCloseMemoryLane,
  onShowRoute,
  showRoute,
  routeNotes,
  routeSortBy,
  mapForRoute,
  onCloseRoute,
}: MapDialogLayerProps) {
  return (
    <>
      {/* Location form for adding new note */}
      {clickedLocation && showLocationForm && (
        <LocationNoteForm
          isOpen={showLocationForm}
          onClose={onCloseLocationForm}
          location={clickedLocation}
          onSubmit={onSubmitLocationForm}
        />
      )}

      {/* Edit form for existing note */}
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

      {/* Note details view */}
      {selectedPinory && showDetailsDialog && (
        <NoteDetailsView
          isOpen={showDetailsDialog}
          onClose={onCloseDetails}
          note={selectedPinory}
          onEdit={onEditNote}
          onDelete={onDeleteNoteFromDetails}
        />
      )}

      {/* Friend location details view */}
      {selectedFriendPinory && showFriendDetailsDialog && (
        <FriendLocationDetailsView
          isOpen={showFriendDetailsDialog}
          locationNote={selectedFriendPinory}
          onClose={onCloseFriendDetails}
          onAddToFavorites={onAddToFavorites}
        />
      )}

      {/* Create journey dialog */}
      <CreateJourneyDialog
        isOpen={showJourneyDialog}
        onClose={onCloseJourney}
        onSuccess={onJourneySuccess}
      />

      {/* Memory Lane view */}
      <MemoryLaneView
        isOpen={showMemoryLane}
        onClose={onCloseMemoryLane}
        onShowRoute={onShowRoute}
      />

      {/* Route display */}
      {showRoute && routeNotes.length >= 2 && (
        <RouteDisplay
          map={mapForRoute}
          notes={routeNotes}
          sortBy={routeSortBy}
          onClose={onCloseRoute}
        />
      )}
    </>
  );
}
