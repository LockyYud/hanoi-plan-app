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
