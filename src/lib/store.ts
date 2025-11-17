import { create } from "zustand"
import { persist } from "zustand/middleware"
import { Place, Group, MapBounds, PlaceFilter, Friendship, FriendWithStats, LocationNote as LocationNoteType, ActivityFeedItem } from "@/lib/types"

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
    categoryId: string | null // Category ID for associating with category
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

    showMemoryLane: boolean
    setShowMemoryLane: (show: boolean) => void
}

interface MemoryLaneStore {
    routeNotes: LocationNote[]
    setRouteNotes: (notes: LocationNote[]) => void
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

interface FriendStore {
    friends: FriendWithStats[]
    setFriends: (friends: FriendWithStats[]) => void
    addFriend: (friend: FriendWithStats) => void
    removeFriend: (friendshipId: string) => void

    friendRequests: Friendship[]
    setFriendRequests: (requests: Friendship[]) => void
    addFriendRequest: (request: Friendship) => void
    removeFriendRequest: (requestId: string) => void

    friendLocationNotes: LocationNoteType[]
    setFriendLocationNotes: (notes: LocationNoteType[]) => void

    activityFeed: ActivityFeedItem[]
    setActivityFeed: (feed: ActivityFeedItem[]) => void

    showFriendsLayer: boolean
    setShowFriendsLayer: (show: boolean) => void

    selectedFriendId: string | null
    setSelectedFriendId: (friendId: string | null) => void

    loading: boolean
    setLoading: (loading: boolean) => void

    fetchFriends: () => Promise<void>
    fetchFriendRequests: () => Promise<void>
    fetchFriendLocationNotes: (friendId?: string) => Promise<void>
    fetchActivityFeed: (type?: string) => Promise<void>

    sendFriendRequest: (targetUserId: string) => Promise<void>
    acceptFriendRequest: (requestId: string) => Promise<void>
    rejectFriendRequest: (requestId: string) => Promise<void>
    unfriend: (friendshipId: string) => Promise<void>
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

    friendLocationNotes: [],
    setFriendLocationNotes: (notes) => set({ friendLocationNotes: notes }),

    activityFeed: [],
    setActivityFeed: (feed) => set({ activityFeed: feed }),

    showFriendsLayer: false,
    setShowFriendsLayer: (show) => set({ showFriendsLayer: show }),

    selectedFriendId: null,
    setSelectedFriendId: (friendId) => set({ selectedFriendId: friendId }),

    loading: false,
    setLoading: (loading) => set({ loading }),

    fetchFriends: async () => {
        try {
            set({ loading: true })
            const response = await fetch("/api/friends", {
                credentials: "include"
            })
            console.log("Fetching friends...")
            if (response.ok) {
                const data = await response.json()
                console.log("Response status:", data)
                set({ friends: data.friends, loading: false })
            } else {
                console.error("Failed to fetch friends:", response.status)
                set({ loading: false })
            }
        } catch (error) {
            console.error("Error fetching friends:", error)
            set({ loading: false })
        }
    },

    fetchFriendRequests: async () => {
        try {
            const response = await fetch("/api/friends/requests?type=received", {
                credentials: "include"
            })

            if (response.ok) {
                const data = await response.json()
                set({ friendRequests: data.requests })
            } else {
                console.error("Failed to fetch friend requests:", response.status)
            }
        } catch (error) {
            console.error("Error fetching friend requests:", error)
        }
    },

    fetchFriendLocationNotes: async (friendId?: string) => {
        try {
            set({ loading: true })
            const url = friendId
                ? `/api/location-notes?type=friends&friendId=${friendId}`
                : "/api/location-notes?type=friends"

            const response = await fetch(url, {
                credentials: "include"
            })

            if (response.ok) {
                const data = await response.json()
                // API trả về array trực tiếp, không có property locationNotes
                set({ friendLocationNotes: Array.isArray(data) ? data : [], loading: false })
            } else {
                console.error("Failed to fetch friend location notes:", response.status)
                set({ friendLocationNotes: [], loading: false })
            }
        } catch (error) {
            console.error("Error fetching friend location notes:", error)
            set({ friendLocationNotes: [], loading: false })
        }
    },

    fetchActivityFeed: async (type = "all") => {
        try {
            set({ loading: true })
            const response = await fetch(`/api/feed?type=${type}&limit=50`, {
                credentials: "include"
            })

            if (response.ok) {
                const data = await response.json()
                set({ activityFeed: data.feed, loading: false })
            } else {
                console.error("Failed to fetch activity feed:", response.status)
                set({ loading: false })
            }
        } catch (error) {
            console.error("Error fetching activity feed:", error)
            set({ loading: false })
        }
    },

    sendFriendRequest: async (targetUserId: string) => {
        try {
            const response = await fetch("/api/friends", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetUserId }),
                credentials: "include"
            })

            if (response.ok) {
                const data = await response.json()
                console.log("Friend request sent:", data)
            } else {
                const error = await response.json()
                throw new Error(error.error || "Failed to send friend request")
            }
        } catch (error) {
            console.error("Error sending friend request:", error)
            throw error
        }
    },

    acceptFriendRequest: async (requestId: string) => {
        try {
            const response = await fetch(`/api/friends/accept/${requestId}`, {
                method: "POST",
                credentials: "include"
            })

            if (response.ok) {
                // Remove from requests, add to friends
                get().removeFriendRequest(requestId)
                await get().fetchFriends()
            } else {
                const error = await response.json()
                throw new Error(error.error || "Failed to accept friend request")
            }
        } catch (error) {
            console.error("Error accepting friend request:", error)
            throw error
        }
    },

    rejectFriendRequest: async (requestId: string) => {
        try {
            const response = await fetch(`/api/friends/reject/${requestId}`, {
                method: "POST",
                credentials: "include"
            })

            if (response.ok) {
                get().removeFriendRequest(requestId)
            } else {
                const error = await response.json()
                throw new Error(error.error || "Failed to reject friend request")
            }
        } catch (error) {
            console.error("Error rejecting friend request:", error)
            throw error
        }
    },

    unfriend: async (friendshipId: string) => {
        try {
            const response = await fetch(`/api/friends?friendshipId=${friendshipId}`, {
                method: "DELETE",
                credentials: "include"
            })

            if (response.ok) {
                get().removeFriend(friendshipId)
            } else {
                const error = await response.json()
                throw new Error(error.error || "Failed to unfriend")
            }
        } catch (error) {
            console.error("Error unfriending:", error)
            throw error
        }
    }
}))
