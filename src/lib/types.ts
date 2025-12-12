import {
    CategoryType,
    SourceType,
    VisibilityType,
    GroupRole,
    ItineraryStatus,
    ShareVisibility,
    FriendshipStatus,
    ReactionType,
    RecommendationStatus
} from "@prisma/client"

export interface Place {
    id: string
    name: string
    address: string
    ward?: string
    district?: string
    lat: number
    lng: number
    priceLevel?: number
    category: CategoryType
    openHours?: any
    phone?: string
    website?: string
    source: SourceType
    osmId?: string
    createdBy: string
    createdAt: Date
    updatedAt: Date
    // Personal note fields (merged from LocationNote)
    rating?: number
    note?: string
    visibility: ShareVisibility
    visitDate?: Date
    // Relations
    tags: PlaceTag[]
    favorites: Favorite[]
    media: Media[]
    creator?: User
    mood?: string
}

export interface PlaceTag {
    id: string
    placeId: string
    tag: string
}

export interface Favorite {
    userId: string
    placeId: string
    rating?: number
    comment?: string
    createdAt: Date
}

export interface Media {
    id: string
    placeId?: string
    userId: string
    groupId?: string
    url: string
    visibility: VisibilityType
    createdAt: Date
}

export interface Group {
    id: string
    name: string
    ownerId: string
    startTime: Date
    endTime: Date
    budgetMin?: number
    budgetMax?: number
    vibeTags: string[]
    areaPref: string[]
    createdAt: Date
    members: GroupMember[]
    votes: GroupVote[]
    itineraries: Itinerary[]
}

export interface GroupMember {
    groupId: string
    userId: string
    role: GroupRole
    user: User
}

export interface GroupVote {
    groupId: string
    placeId: string
    userId: string
    vote: number
}

export interface Itinerary {
    id: string
    groupId: string
    title: string
    status: ItineraryStatus
    score?: number
    createdAt: Date
    stops: ItineraryStop[]
    share?: Share
}

export interface ItineraryStop {
    id: string
    itineraryId: string
    seq: number
    placeId: string
    arriveTime?: Date
    departTime?: Date
    travelMinutes?: number
    place: Place
}

export interface Share {
    id: string
    itineraryId: string
    publicSlug: string
    expiresAt?: Date
}

export interface User {
    id: string
    email: string
    name?: string
    avatarUrl?: string
    createdAt: Date
}

// Journey types (personal travel journal)
export interface Journey {
    id: string
    title: string
    description?: string
    userId: string
    startDate?: Date
    endDate?: Date
    coverImage?: string
    isPublic: boolean
    visibility: ShareVisibility
    createdAt: Date
    updatedAt: Date
    stops: JourneyStop[]
}

export interface JourneyStop {
    id: string
    journeyId: string
    placeId: string
    sequence: number
    note?: string
    createdAt: Date
    place: Place
}

export interface RoutePreferences {
    maxStops: number
    minStops: number
    maxTravelTime: number
    preferredCategories: CategoryType[]
    avoidCategories: CategoryType[]
    maxBudgetPerPerson: number
    minBudgetPerPerson: number
    startLocation?: { lat: number; lng: number }
    endLocation?: { lat: number; lng: number }
}

export interface RouteScore {
    totalScore: number
    categoryMatch: number
    distancePenalty: number
    timePenalty: number
    budgetFit: number
    userSatisfaction: number
    fairnessScore: number
}

export interface MapBounds {
    north: number
    south: number
    east: number
    west: number
}

export interface PinoryFilter {
    category?: string[] // Changed to string[] to support category slugs
    priceLevel?: number[]
    district?: string[]
    tags?: string[]
    openAt?: Date
    query?: string
    bounds?: MapBounds
}

export interface GroupPreferences {
    timeWindow: {
        start: Date
        end: Date
    }
    budget: {
        min: number
        max: number
    }
    vibeTags: string[]
    areaPref: string[]
    maxTravelTime: number
    preferredCategories: CategoryType[]
}

export const CATEGORIES = [
    "cafe",
    "food",
    "bar",
    "rooftop",
    "activity",
    "landmark"
] as const

export const DISTRICTS = [
    "Ba Đình",
    "Hoàn Kiếm",
    "Tây Hồ",
    "Long Biên",
    "Cầu Giấy",
    "Đống Đa",
    "Hai Bà Trưng",
    "Hoàng Mai",
    "Thanh Xuân",
    "Nam Từ Liêm",
    "Bắc Từ Liêm",
    "Hà Đông"
] as const

export const VIBE_TAGS = [
    "chill",
    "romantic",
    "lively",
    "scenic",
    "cultural",
    "foodie",
    "nightlife",
    "outdoor",
    "historic",
    "modern",
    "local",
    "touristy"
] as const

export const PRICE_LEVELS = [
    { value: 1, label: "₫ (< 100k)", max: 100000 },
    { value: 2, label: "₫₫ (100k - 300k)", max: 300000 },
    { value: 3, label: "₫₫₫ (300k - 500k)", max: 500000 },
    { value: 4, label: "₫₫₫₫ (> 500k)", max: Infinity }
] as const

// Pinory - Unified interface for user-selected locations with notes, images, and memories
// This represents the primary user-facing type for location memories in the app
export interface Pinory {
    // Core identification
    id: string
    name: string // Place name (required)

    // Location data
    lng: number
    lat: number
    address: string
    ward?: string
    district?: string

    // User content
    content?: string // User's note/description
    note?: string // Alias for content
    mood?: string // Emoji or mood indicator

    // Ownership type (for unified clustering)
    pinoryType?: 'user' | 'friend' // Discriminator for rendering logic

    // Media
    images?: string[]
    hasImages?: boolean
    media?: Media[]

    // Categorization
    category?: string // Category ID
    categoryName?: string
    categorySlug?: string
    categoryId?: string | null

    // Place metadata
    placeName?: string // Alias for name
    priceLevel?: number
    rating?: number
    phone?: string
    website?: string

    // Temporal data
    timestamp: Date // When the memory was created
    visitDate?: Date
    visitTime?: string
    createdAt?: Date
    updatedAt?: Date

    // Visibility & ownership
    visibility?: ShareVisibility | string
    userId?: string
    createdBy?: string

    // Additional metadata
    coverImageIndex?: number
    placeType?: "note" | "place" // Distinguishes between user notes and place records

    // Relations
    creator?: User
    tags?: PlaceTag[]
    favorites?: Favorite[]
}

// Unified Clustering Types
export type PinoryType = 'user' | 'friend'

export interface ClusterComposition {
    userCount: number
    friendCount: number
    totalCount: number
    type: 'user-only' | 'friend-only' | 'mixed'
    friendAvatars?: string[] // Avatar URLs for friend pinories in cluster
}

// Friend System Types
// For backwards compatibility - deprecated, use Pinory instead
/** @deprecated Use Pinory instead */
export type LocationNote = Pinory

export interface Friendship {
    id: string
    requesterId: string
    addresseeId: string
    status: FriendshipStatus
    createdAt: Date
    updatedAt: Date
    requester: User
    addressee: User
}

export interface FriendShare {
    id: string
    userId: string
    contentId: string
    contentType: 'pinory' | 'location_note' | 'journey' | 'media' // Added 'pinory'
    visibility: ShareVisibility
    sharedWith: string[]
    createdAt: Date
}

export interface Reaction {
    id: string
    userId: string
    contentId: string
    contentType: 'pinory' | 'location_note' | 'journey' | 'media' // Added 'pinory'
    type: ReactionType
    createdAt: Date
    user: User
}

export interface Recommendation {
    id: string
    fromUserId: string
    toUserId: string
    placeId: string
    message?: string
    status: RecommendationStatus
    createdAt: Date
    fromUser: User
    toUser: User
    place: Place
}

export interface FriendWithStats extends User {
    friendshipId: string
    friendshipStatus: FriendshipStatus
    friendsSince: Date
    pinoriesCount: number // Renamed from locationNotesCount
    locationNotesCount: number // Kept for backward compatibility
    journeysCount: number
}

export interface ActivityFeedItem {
    id: string
    type: 'pinory' | 'location_note' | 'journey' | 'media' // Added 'pinory'
    user: User
    content: Pinory | Journey | Media
    reactions: Reaction[]
    createdAt: Date
}
