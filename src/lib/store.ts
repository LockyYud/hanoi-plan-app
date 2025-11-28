import { create } from "zustand"
import { persist } from "zustand/middleware"
import { Group, MapBounds, PinoryFilter, Friendship, FriendWithStats, Pinory, ActivityFeedItem } from "@/lib/types"

// Legacy type alias for backward compatibility
/** @deprecated Use Pinory instead */
export type LocationNote = Pinory

export interface Category {
    id: string
    name: string
    slug: string
    icon?: string
    color?: string
    isDefault: boolean
    userId?: string
}

interface PinoryStore {

    selectedPinory: Pinory | null
    setSelectedPinory: (pinory: Pinory | null) => void

    pinories: Pinory[]
    setPinories: (pinories: Pinory[]) => void
    addPinory: (pinory: Pinory) => void
    updatePinory: (id: string, updates: Partial<Pinory>) => void
    removePinory: (id: string) => void

    filter: PinoryFilter
    setFilter: (filter: Partial<PinoryFilter>) => void
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

    showMemoryLane: boolean
    setShowMemoryLane: (show: boolean) => void
}

interface MemoryLaneStore {
    routeNotes: Pinory[]
    setRouteNotes: (notes: Pinory[]) => void
    routeSortBy: "time" | "custom"
    setRouteSortBy: (sortBy: "time" | "custom") => void
    showRoute: boolean
    setShowRoute: (show: boolean) => void
    clearRoute: () => void
}

interface CategoryStore {
    categories: Category[]
    setCategories: (categories: Category[]) => void
    addCategory: (category: Category) => void
    updateCategory: (id: string, updates: Partial<Category>) => void
    removeCategory: (id: string) => void
    isLoadingCategories: boolean
    setIsLoadingCategories: (loading: boolean) => void
}

export const usePinoryStore = create<PinoryStore>((set) => ({
    selectedPinory: null,
    setSelectedPinory: (pinory) => set({ selectedPinory: pinory }),

    pinories: [],
    setPinories: (places) => set({ pinories: places }),
    addPinory: (place) => set((state) => ({ pinories: [...state.pinories, place] })),
    updatePinory: (id, updates) => set((state) => ({
        pinories: state.pinories.map(p => p.id === id ? { ...p, ...updates } : p)
    })),
    removePinory: (id) => set((state) => ({
        pinories: state.pinories.filter(p => p.id !== id)
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
    sidebarOpen: false,
    setSidebarOpen: (open) => set({ sidebarOpen: open }),

    mapLoaded: false,
    setMapLoaded: (loaded) => set({ mapLoaded: loaded }),

    loading: false,
    setLoading: (loading) => set({ loading }),

    error: null,
    setError: (error) => set({ error }),

    showMemoryLane: false,
    setShowMemoryLane: (show) => set({ showMemoryLane: show })
}))

export const useMemoryLaneStore = create<MemoryLaneStore>((set) => ({
    routeNotes: [],
    setRouteNotes: (notes) => set({ routeNotes: notes }),
    routeSortBy: "time",
    setRouteSortBy: (sortBy) => set({ routeSortBy: sortBy }),
    showRoute: false,
    setShowRoute: (show) => set({ showRoute: show }),
    clearRoute: () => set({ routeNotes: [], showRoute: false })
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
}))

interface FriendStore {
    friends: FriendWithStats[]
    setFriends: (friends: FriendWithStats[]) => void
    addFriend: (friend: FriendWithStats) => void
    removeFriend: (friendshipId: string) => void

    friendRequests: Friendship[]
    setFriendRequests: (requests: Friendship[]) => void
    addFriendRequest: (request: Friendship) => void
    removeFriendRequest: (requestId: string) => void

    friendPinories: Pinory[]
    setFriendPinories: (pinories: Pinory[]) => void

    activityFeed: ActivityFeedItem[]
    setActivityFeed: (feed: ActivityFeedItem[]) => void

    showFriendsLayer: boolean
    setShowFriendsLayer: (show: boolean) => void

    selectedFriendId: string | null
    setSelectedFriendId: (friendId: string | null) => void

    loading: boolean
    setLoading: (loading: boolean) => void
}

export const useFriendStore = create<FriendStore>((set, get) => ({
    friends: [],
    setFriends: (friends) => set({ friends }),
    addFriend: (friend) => set((state) => ({
        friends: [...state.friends, friend]
    })),
    removeFriend: (friendshipId) => set((state) => ({
        friends: state.friends.filter(f => f.friendshipId !== friendshipId)
    })),

    friendRequests: [],
    setFriendRequests: (requests) => set({ friendRequests: requests }),
    addFriendRequest: (request) => set((state) => ({
        friendRequests: [...state.friendRequests, request]
    })),
    removeFriendRequest: (requestId) => set((state) => ({
        friendRequests: state.friendRequests.filter(r => r.id !== requestId)
    })),

    friendPinories: [],
    setFriendPinories: (pinories) => set({ friendPinories: pinories }),

    activityFeed: [],
    setActivityFeed: (feed) => set({ activityFeed: feed }),

    showFriendsLayer: false,
    setShowFriendsLayer: (show) => set({ showFriendsLayer: show }),

    selectedFriendId: null,
    setSelectedFriendId: (friendId) => set({ selectedFriendId: friendId }),

    loading: false,
    setLoading: (loading) => set({ loading }),
}))
