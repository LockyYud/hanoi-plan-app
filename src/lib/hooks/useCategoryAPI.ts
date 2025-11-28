/**
 * useCategoryAPI
 * 
 * API hook for Category operations.
 * Handles all API calls and updates the useCategoryStore.
 * 
 * Separates data fetching from state management.
 */

import { useCallback } from 'react';
import { Session } from 'next-auth';
import { useCategoryStore } from '@/lib/store';

export function useCategoryAPI() {
    const { setCategories, setIsLoadingCategories, categories } = useCategoryStore();

    /**
     * Fetch categories only if not already loaded
     */
    const fetchCategories = useCallback(
        async (session: Session | null) => {
            // Don't fetch if already loading
            if (useCategoryStore.getState().isLoadingCategories) {
                console.log('⏳ Categories already loading, skipping');
                return;
            }

            // Don't fetch if no session
            if (!session) {
                console.log('🚫 No session, clearing categories');
                setCategories([]);
                setIsLoadingCategories(false);
                return;
            }

            // Don't fetch if categories already loaded
            if (categories.length > 0) {
                console.log('✅ Categories already loaded, skipping fetch');
                return;
            }

            try {
                setIsLoadingCategories(true);
                console.log('🔄 Fetching categories...');

                const response = await fetch('/api/categories', {
                    credentials: 'include',
                });

                if (response.ok) {
                    const categoriesData = await response.json();
                    console.log('📂 Categories fetched:', categoriesData.length, 'items');
                    setCategories(categoriesData);
                } else {
                    console.error('Failed to fetch categories:', response.status);
                    setCategories([]);
                }
            } catch (error) {
                console.error('❌ Error fetching categories:', error);
                setCategories([]);
            } finally {
                setIsLoadingCategories(false);
            }
        },
        [categories.length, setCategories, setIsLoadingCategories]
    );

    return {
        fetchCategories,
    };
}
