import {
    CategoryType,
    SourceType,
    VisibilityType,
    GroupRole,
    ItineraryStatus
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
    tags: PlaceTag[]
    favorites: Favorite[]
    media: Media[]
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
    category?: CategoryType[]
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
