/**
 * usePinoryAPI
 * 
 * API hook for Pinory (Location Notes) CRUD operations.
 * Handles all API calls and updates the usePinoryStore.
 * 
 * Separates data fetching from state management.
 */

import { useCallback } from 'react';
import { Session } from 'next-auth';
import { usePinoryStore } from '@/lib/store';
import type { Pinory } from '@/lib/types';

interface PinoryInput {
    id?: string;
    lng: number;
    lat: number;
    address: string;
    content?: string;
    mood?: string;
    images?: string[];
    category?: string;
    placeName?: string;
    visitTime?: string;
    timestamp?: Date;
    coverImageIndex?: number;
    visibility?: string;
}

export function usePinoryAPI(session: Session | null) {
    const { setPinories, addPinory: addToStore, updatePinory: updateInStore, removePinory: removeFromStore } = usePinoryStore();

    /**
     * Fetch all pinories for the current user
     */
    const fetchPinories = useCallback(async () => {
        try {
            // Only fetch if user is logged in
            if (!session) {
                console.log('🚫 Not logged in, skipping pinories fetch');
                setPinories([]);
                return;
            }

            console.log('🔍 Loading pinories for user:', session?.user?.email);

            const response = await fetch('/api/location-notes?includeImages=true', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const notes = await response.json();
                console.log(
                    '🔄 API returned notes:',
                    notes.map((n: Pinory) => ({
                        id: n.id,
                        mood: n.mood,
                        content: n.content?.substring(0, 20),
                        images: n.images?.length || 0,
                    }))
                );

                // Add hasImages flag based on images array
                const notesWithFlags = notes.map((note: Pinory) => ({
                    ...note,
                    hasImages: note.images && note.images.length > 0,
                }));

                setPinories(notesWithFlags);
                console.log('📍 Loaded', notesWithFlags.length, 'pinories');
            } else if (response.status === 401) {
                console.log('🔒 Unauthorized - user session may have expired');
                setPinories([]);
            } else {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }
        } catch (err) {
            console.error('Error loading pinories:', err);
            setPinories([]);
            throw err;
        }
    }, [session, setPinories]);

    /**
     * Create a new pinory
     */
    const createPinory = useCallback(
        async (noteData: PinoryInput) => {
            try {
                console.log('📝 Adding pinory to local state:', noteData);

                // Ensure we have a valid ID from the form's API call
                if (!noteData.id) {
                    console.error('❌ Note ID is missing, cannot add to local state');
                    throw new Error('Note ID is required');
                }

                // Create the note object for local state
                const savedNote: Pinory = {
                    id: noteData.id,
                    lng: noteData.lng,
                    lat: noteData.lat,
                    address: noteData.address,
                    name: noteData.placeName || noteData.address || 'New Location',
                    content: noteData.content || '',
                    mood: noteData.mood,
                    images: noteData.images || [],
                    timestamp: noteData.timestamp || new Date(),
                    hasImages: (noteData.images || []).length > 0,
                };

                // Add to store
                addToStore(savedNote);

                // Dispatch event to update sidebar
                globalThis.dispatchEvent(new CustomEvent('pinoryAdded'));

                console.log('✅ Pinory added to store and sidebar notified');
                return savedNote;
            } catch (err) {
                console.error('❌ Error adding pinory to store:', err);
                throw err;
            }
        },
        [addToStore]
    );

    /**
     * Update an existing pinory
     */
    const updatePinory = useCallback(
        async (noteData: PinoryInput) => {
            try {
                console.log('Editing pinory:', noteData);

                if (!noteData.id) {
                    throw new Error('Note ID is required for editing');
                }

                // Update via API
                const response = await fetch('/api/location-notes', {
                    method: 'PUT',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        id: noteData.id,
                        lng: noteData.lng,
                        lat: noteData.lat,
                        address: noteData.address,
                        content: noteData.content,
                        mood: noteData.mood,
                        categoryIds: noteData.category ? [noteData.category] : [],
                        images: noteData.images || [],
                        placeName: noteData.placeName,
                        visitTime: noteData.visitTime,
                        visibility: noteData.visibility,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to update note');
                }

                const updatedNote = await response.json();

                // Update store
                console.log('📝 Updating note in store:', updatedNote);
                updateInStore(updatedNote.id, updatedNote);

                // Dispatch event to update sidebar
                globalThis.dispatchEvent(new CustomEvent('pinoryUpdated'));

                console.log('✅ Pinory updated and sidebar notified');
                return updatedNote;
            } catch (err) {
                console.error('Error updating pinory:', err);
                throw err;
            }
        },
        [updateInStore]
    );

    /**
     * Delete a pinory
     */
    const deletePinory = useCallback(
        async (noteId: string) => {
            try {
                const response = await fetch(`/api/location-notes?id=${noteId}`, {
                    method: 'DELETE',
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error('Failed to delete');
                }

                console.log('Deleted note:', noteId);

                // Update store
                removeFromStore(noteId);

                // Trigger refresh of sidebar and map markers
                globalThis.dispatchEvent(new CustomEvent('pinoryUpdated'));
            } catch (err) {
                console.error('Error deleting:', err);
                throw new Error('Failed to delete note');
            }
        },
        [removeFromStore]
    );

    return {
        fetchPinories,
        createPinory,
        updatePinory,
        deletePinory,
    };
}
