import { create } from "zustand"
import { persist } from "zustand/middleware"
import { Place, Group, MapBounds, PlaceFilter } from "@/lib/types"

export interface LocationNote {
    id: string
    lng: number
    lat: number
    address: string
    content: string
    mood?: string
    timestamp: Date
    images?: string[]
    hasImages?: boolean
    categorySlug?: string // Category slug for filtering
}

export interface Category {
    id: string
    name: string
    slug: string
    icon?: string
    color?: string
    isDefault: boolean
    userId?: string
}

interface PlaceStore {
    selectedPlace: Place | null
    setSelectedPlace: (place: Place | null) => void

    selectedNote: LocationNote | null
    setSelectedNote: (note: LocationNote | null) => void

    places: Place[]
    setPlaces: (places: Place[]) => void
    addPlace: (place: Place) => void
    updatePlace: (id: string, updates: Partial<Place>) => void
    removePlace: (id: string) => void

    filter: PlaceFilter
    setFilter: (filter: Partial<PlaceFilter>) => void
    clearFilter: () => void
}

interface MapStore {
    center: [number, number]
    zoom: number
    bounds: MapBounds | null
    setCenter: (center: [number, number]) => void
    setZoom: (zoom: number) => void
    setBounds: (bounds: MapBounds | null) => void
}

interface GroupStore {
    currentGroup: Group | null
    setCurrentGroup: (group: Group | null) => void

    groups: Group[]
    setGroups: (groups: Group[]) => void
    addGroup: (group: Group) => void
    updateGroup: (id: string, updates: Partial<Group>) => void
    removeGroup: (id: string) => void
}

interface UIStore {
    sidebarOpen: boolean
    setSidebarOpen: (open: boolean) => void

    mapLoaded: boolean
    setMapLoaded: (loaded: boolean) => void

    loading: boolean
    setLoading: (loading: boolean) => void

    error: string | null
    setError: (error: string | null) => void
}

interface CategoryStore {
    categories: Category[]
    setCategories: (categories: Category[]) => void
    addCategory: (category: Category) => void
    updateCategory: (id: string, updates: Partial<Category>) => void
    removeCategory: (id: string) => void
    isLoadingCategories: boolean
    setIsLoadingCategories: (loading: boolean) => void
    fetchCategories: (session: any) => Promise<void>
}

export const usePlaceStore = create<PlaceStore>((set) => ({
    selectedPlace: null,
    setSelectedPlace: (place) => set({ selectedPlace: place }),

    selectedNote: null,
    setSelectedNote: (note) => set({ selectedNote: note }),

    places: [],
    setPlaces: (places) => set({ places }),
    addPlace: (place) => set((state) => ({ places: [...state.places, place] })),
    updatePlace: (id, updates) => set((state) => ({
        places: state.places.map(p => p.id === id ? { ...p, ...updates } : p)
    })),
    removePlace: (id) => set((state) => ({
        places: state.places.filter(p => p.id !== id)
    })),

    filter: {},
    setFilter: (filter) => set((state) => ({ filter: { ...state.filter, ...filter } })),
    clearFilter: () => set({ filter: {} })
}))

export const useMapStore = create<MapStore>()(
    persist(
        (set) => ({
            center: [105.8542, 21.0285], // Hanoi center
            zoom: 12,
            bounds: null,
            setCenter: (center) => set({ center }),
            setZoom: (zoom) => set({ zoom }),
            setBounds: (bounds) => set({ bounds })
        }),
        {
            name: "map-storage",
            partialize: (state) => ({ center: state.center, zoom: state.zoom })
        }
    )
)

export const useGroupStore = create<GroupStore>((set) => ({
    currentGroup: null,
    setCurrentGroup: (group) => set({ currentGroup: group }),

    groups: [],
    setGroups: (groups) => set({ groups }),
    addGroup: (group) => set((state) => ({ groups: [...state.groups, group] })),
    updateGroup: (id, updates) => set((state) => ({
        groups: state.groups.map(g => g.id === id ? { ...g, ...updates } : g)
    })),
    removeGroup: (id) => set((state) => ({
        groups: state.groups.filter(g => g.id !== id)
    }))
}))

export const useUIStore = create<UIStore>((set) => ({
    sidebarOpen: true,
    setSidebarOpen: (open) => set({ sidebarOpen: open }),

    mapLoaded: false,
    setMapLoaded: (loaded) => set({ mapLoaded: loaded }),

    loading: false,
    setLoading: (loading) => set({ loading }),

    error: null,
    setError: (error) => set({ error })
}))

export const useCategoryStore = create<CategoryStore>((set, get) => ({
    categories: [],
    setCategories: (categories) => set({ categories }),
    addCategory: (category) => set((state) => ({
        categories: [...state.categories, category]
    })),
    updateCategory: (id, updates) => set((state) => ({
        categories: state.categories.map(c => c.id === id ? { ...c, ...updates } : c)
    })),
    removeCategory: (id) => set((state) => ({
        categories: state.categories.filter(c => c.id !== id)
    })),
    isLoadingCategories: false,
    setIsLoadingCategories: (loading) => set({ isLoadingCategories: loading }),

    // Fetch categories only if not authenticated or if categories are empty
    fetchCategories: async (session) => {
        // Don't fetch if already loading
        if (get().isLoadingCategories) {
            console.log("⏳ Categories already loading, skipping");
            return;
        }

        // Don't fetch if no session
        if (!session) {
            console.log("🚫 No session, clearing categories");
            set({ categories: [], isLoadingCategories: false });
            return;
        }

        // Don't fetch if categories already loaded
        if (get().categories.length > 0) {
            console.log("✅ Categories already loaded, skipping fetch");
            return;
        }

        try {
            set({ isLoadingCategories: true });
            console.log("🔄 Fetching categories...");

            const response = await fetch("/api/categories", {
                credentials: "include",
            });

            if (response.ok) {
                const categoriesData = await response.json();
                console.log("📂 Categories fetched:", categoriesData.length, "items");
                set({ categories: categoriesData, isLoadingCategories: false });
            } else {
                console.error("Failed to fetch categories:", response.status);
                set({ categories: [], isLoadingCategories: false });
            }
        } catch (error) {
            console.error("❌ Error fetching categories:", error);
            set({ categories: [], isLoadingCategories: false });
        }
    }
}))
