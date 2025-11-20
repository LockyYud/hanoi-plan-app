/**
 * useLocationNotes
 * 
 * Custom hook to manage location notes (Pinory) - CRUD operations and API integration.
 * Handles loading, creating, updating, and deleting location notes.
 * 
 * @param session - Next-auth session object
 * @param mapLoaded - Whether the map has finished loading
 * @returns Location notes state and CRUD functions
 */

import { useState, useEffect, useCallback } from 'react';
import { Session } from 'next-auth';
import { flushSync } from 'react-dom';
import type { Pinory } from '@/lib/types';
import type { UseLocationNotesReturn } from '../types/map.types';

export function useLocationNotes(
    session: Session | null,
    mapLoaded: boolean
): UseLocationNotesReturn {
    const [locationNotes, setLocationNotes] = useState<Pinory[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load location notes from API
    const loadLocationNotes = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Only fetch if user is logged in
            if (!session) {
                console.log('🚫 Not logged in, skipping location notes fetch');
                setLocationNotes([]);
                return;
            }

            console.log('🔍 Loading location notes for user:', session?.user?.email);

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

                setLocationNotes(notesWithFlags);
                console.log('📍 Loaded', notesWithFlags.length, 'location notes');
            } else if (response.status === 401) {
                console.log('🔒 Unauthorized - user session may have expired');
                setLocationNotes([]);
            } else {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }
        } catch (err) {
            console.error('Error loading location notes:', err);
            setError(err instanceof Error ? err.message : 'Failed to load notes');
            setLocationNotes([]);
        } finally {
            setLoading(false);
        }
    }, [session]);

    // Add new location note
    const addLocationNote = useCallback(
        async (noteData: {
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
        }) => {
            try {
                console.log('📝 Adding location note to local state:', noteData);

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

                // Add to local state immediately for instant UI update
                console.log(
                    '📍 Adding note to local state for immediate marker display:',
                    {
                        id: savedNote.id,
                        content: savedNote.content?.substring(0, 20),
                        coordinates: [savedNote.lng, savedNote.lat],
                    }
                );

                // Use flushSync to ensure immediate state update
                flushSync(() => {
                    setLocationNotes((prev) => {
                        const updated = [...prev, savedNote];
                        console.log('📍 Updated locationNotes count:', updated.length);
                        return updated;
                    });
                });

                // Dispatch event to update sidebar
                globalThis.dispatchEvent(new CustomEvent('locationNoteAdded'));

                console.log('✅ Location note added to local state and sidebar notified');
            } catch (err) {
                console.error('❌ Error adding location note to local state:', err);
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                throw new Error(`Failed to add note: ${errorMessage}`);
            }
        },
        []
    );

    // Update location note
    const updateLocationNote = useCallback(
        async (noteData: {
            category?: string;
            content?: string;
            placeName?: string;
            visitTime?: string;
            mood?: string;
            id?: string;
            lng: number;
            lat: number;
            address: string;
            timestamp?: Date;
            images?: string[];
            coverImageIndex?: number;
            visibility?: string;
        }) => {
            try {
                console.log('Editing location note:', noteData);

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

                // Update local state
                console.log('📝 Updating note in local state:', updatedNote);
                setLocationNotes((prev) =>
                    prev.map((note) => (note.id === updatedNote.id ? updatedNote : note))
                );

                // Dispatch event to update sidebar
                globalThis.dispatchEvent(new CustomEvent('locationNoteUpdated'));

                console.log('✅ Location note updated and sidebar notified');
            } catch (err) {
                console.error('Error updating location note:', err);
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                throw new Error(`Failed to update note: ${errorMessage}`);
            }
        },
        []
    );

    // Delete location note
    const deleteLocationNote = useCallback(async (noteId: string) => {
        try {
            const response = await fetch(`/api/location-notes?id=${noteId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to delete');
            }

            console.log('Deleted note:', noteId);

            // Update local state to remove the deleted note
            setLocationNotes((prev) => prev.filter((note) => note.id !== noteId));

            // Trigger refresh of sidebar and map markers
            globalThis.dispatchEvent(new CustomEvent('locationNoteUpdated'));
        } catch (err) {
            console.error('Error deleting:', err);
            throw new Error('Failed to delete note');
        }
    }, []);

    // Load notes when map is ready and session exists
    useEffect(() => {
        if (mapLoaded) {
            loadLocationNotes();
        }
    }, [mapLoaded, session, loadLocationNotes]);

    return {
        locationNotes,
        loading,
        error,
        loadLocationNotes,
        addLocationNote,
        updateLocationNote,
        deleteLocationNote,
    };
}
