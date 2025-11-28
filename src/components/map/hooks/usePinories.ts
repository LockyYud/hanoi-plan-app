/**
 * useLocationNotes
 * 
 * Custom hook to manage location notes (Pinory) - wrapper around usePinoryAPI and store.
 * Provides backward compatibility with existing code while using the new API hooks.
 * 
 * @param session - Next-auth session object
 * @param mapLoaded - Whether the map has finished loading
 * @returns Location notes state and CRUD functions
 */

import { useEffect } from 'react';
import { Session } from 'next-auth';
import { usePinoryStore } from '@/lib/store';
import { usePinoryAPI } from '@/lib/hooks';
import type { UsePinoriesReturn } from '../types/map.types';

export function usePinories(
    session: Session | null,
    mapLoaded: boolean
): UsePinoriesReturn {
    const { pinories } = usePinoryStore();

    // Use API hook for all operations
    const {
        fetchPinories: loadPinories,
        createPinory: addPinory,
        updatePinory,
        deletePinory,
    } = usePinoryAPI(session);

    // Load notes when map is ready and session exists
    useEffect(() => {
        if (mapLoaded) {
            loadPinories();
        }
    }, [mapLoaded, session, loadPinories]);

    return {
        pinories,
        loading: false, // Loading state now managed by API hook internally
        error: null, // Error state now managed by API hook internally
        loadPinories,
        addPinory,
        updatePinory,
        deletePinory,
    };
}
