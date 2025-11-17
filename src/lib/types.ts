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

export interface PlaceFilter {
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

// Friend System Types
// LocationNote has been merged into Place model
// For backwards compatibility, LocationNote is now just an alias for Place
export type LocationNote = Place

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
    contentType: 'location_note' | 'journey' | 'media'
    visibility: ShareVisibility
    sharedWith: string[]
    createdAt: Date
}

export interface Reaction {
    id: string
    userId: string
    contentId: string
    contentType: 'location_note' | 'journey' | 'media'
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
    locationNotesCount: number
    journeysCount: number
}

export interface ActivityFeedItem {
    id: string
    type: 'location_note' | 'journey' | 'media'
    user: User
    content: LocationNote | Journey | Media
    reactions: Reaction[]
    createdAt: Date
}
