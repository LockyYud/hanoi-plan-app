"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GroupForm } from "@/components/groups/group-form";
import { GroupCard } from "@/components/groups/group-card";
import { RouteGenerator } from "@/components/itinerary/route-generator";
import {
    MapPin,
    Users,
    User,
    Search,
    Filter,
    Plus,
    Eye,
    LogOut,
    X,
    Navigation,
} from "lucide-react";
import {
    useUIStore,
    usePlaceStore,
    useCategoryStore,
    type LocationNote,
} from "@/lib/store";
import { CategoryType, SourceType, VisibilityType } from "@prisma/client";
import { cn } from "@/lib/utils";
import { getCurrentLocation, openExternalNavigation } from "@/lib/geolocation";
import { toast } from "sonner";

// Extended place type that includes location note properties
type ExtendedPlace = {
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    category: string;
    createdAt: Date;
    placeType?: "note" | "place";
    content?: string;
    mood?: string;
    timestamp?: Date;
    images?: string[];
    hasImages?: boolean;
    categorySlug?: string; // For location notes
};

export function Sidebar() {
    const { data: session, status } = useSession();

    // Debug session changes
    useEffect(() => {
        console.log("🔍 Sidebar: Session changed", {
            status,
            hasSession: !!session,
            userId: session?.user?.id,
            userEmail: session?.user?.email,
            timestamp: new Date().toISOString(),
        });
    }, [session, status]);

    const { sidebarOpen } = useUIStore();
    const {
        places,
        filter,
        setFilter,
        setPlaces,
        setSelectedPlace,
        selectedNote,
        setSelectedNote,
    } = usePlaceStore();
    const [activeTab, setActiveTab] = useState<"places" | "groups" | "profile">(
        "places"
    );
    const [mounted, setMounted] = useState(false);
    const [showGroupForm, setShowGroupForm] = useState(false);
    const [isGettingDirections, setIsGettingDirections] = useState<
        string | null
    >(null);
    const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
    const [groups, setGroups] = useState<
        Array<{
            id: string;
            name: string;
            description?: string;
            startTime: Date;
            endTime: Date;
            createdAt: Date;
        }>
    >([]);
    const [showRouteGenerator, setShowRouteGenerator] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [showFilterPopover, setShowFilterPopover] = useState(false);

    // Use categories from store (shared with location-note-form)
    const { categories } = useCategoryStore();

    // Define fetchGroups function
    const fetchGroups = useCallback(async () => {
        try {
            // Don't fetch if user is not authenticated
            if (!session) {
                console.log("🚫 No session, skipping groups fetch");
                setGroups([]);
                return;
            }

            const response = await fetch("/api/groups", {
                credentials: "include", // 🔑 Include session
            });
            const result = await response.json();
            if (result.data) {
                setGroups(result.data);
            }
        } catch (error) {
            console.error("Error fetching groups:", error);
            setGroups([]);
        }
    }, [session]);

    // Categories are now loaded in the provider, no need to fetch here anymore

    // Define fetchPlaces function with useCallback - UNIFIED LOCATION NOTES SYSTEM
    const fetchPlaces = useCallback(async () => {
        try {
            console.log(
                "🔄 fetchPlaces called, session:",
                session ? "exists" : "null",
                "status:",
                status
            );

            // Don't fetch if session is still loading
            if (status === "loading") {
                console.log("⏳ Session still loading, skipping fetch");
                return;
            }

            // Use functional update to check loading state
            setIsLoadingPlaces((currentlyLoading) => {
                if (currentlyLoading) {
                    console.log("⏳ Already fetching, skipping fetch");
                    return true; // Keep current state
                }
                return true; // Start loading
            });

            if (session) {
                // Fetch user's location notes (unified system)
                console.log(
                    "🔍 Fetching location notes for user:",
                    session.user?.email
                );

                const notesResponse = await fetch(
                    "/api/location-notes?includeImages=true",
                    {
                        credentials: "include", // 🔑 Include session
                    }
                );

                if (notesResponse.ok) {
                    const notes = await notesResponse.json();
                    console.log("📍 Location notes:", notes.length, "items");
                    console.log(
                        "📷 Sample note with images:",
                        notes[0]?.images
                    );

                    // Convert location notes to unified place format
                    // Convert location notes to unified place format
                    const locationNotes = notes.map((note: LocationNote) => ({
                        id: note.id,
                        name:
                            note.content?.substring(0, 50) +
                            (note.content?.length > 50 ? "..." : ""),
                        address: note.address,
                        lat: note.lat,
                        lng: note.lng,
                        content: note.content,
                        mood: note.mood,
                        timestamp: note.timestamp,
                        images: note.images || [],
                        hasImages: note.images && note.images.length > 0,
                        category: CategoryType.cafe, // Keep for compatibility but not used for filtering
                        categorySlug: note.categorySlug, // Use categorySlug from note for filtering
                        source: SourceType.manual,
                        visibility: VisibilityType.private,
                        createdBy: session.user?.id || "",
                        createdAt: new Date(note.timestamp),
                        placeType: "note",
                    }));

                    // Sort by creation date (newest first)
                    locationNotes.sort(
                        (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime()
                    );

                    setPlaces(locationNotes);
                    console.log(
                        "📝 Converted",
                        locationNotes.length,
                        "location notes to place format"
                    );
                    console.log("📝 Sample place:", locationNotes[0]);
                } else {
                    console.error(
                        "Failed to fetch location notes:",
                        notesResponse.status
                    );
                    setPlaces([]);
                }
            } else {
                // Clear places when not logged in
                setPlaces([]);
                console.log("🚫 Not logged in, clearing places");
            }
        } catch (error) {
            console.error("❌ Error fetching places:", error);
            console.error(
                "Session at error time:",
                session ? "exists" : "null"
            );
            // Set empty places array as fallback
            setPlaces([]);
        } finally {
            setIsLoadingPlaces(false);
        }
    }, [session, status, setPlaces]); // Simplified dependencies

    // Load initial data
    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch groups when session changes
    useEffect(() => {
        if (mounted) {
            fetchGroups();
        }
    }, [mounted, fetchGroups]);

    // Fetch places when session or status changes
    useEffect(() => {
        if (mounted && (session || status === "unauthenticated")) {
            fetchPlaces();
        }
    }, [mounted, session, status, fetchPlaces]); // Include fetchPlaces but it should be stable now

    // Categories are loaded automatically in the provider, no need for useEffect here

    // Auto-switch to appropriate tab based on session status change
    useEffect(() => {
        // Only switch when session status changes, not when user manually clicks tabs
        if (!session && (activeTab === "places" || activeTab === "groups")) {
            // User logged out, switch to profile tab
            setActiveTab("profile");
        }
        // Remove auto-switch to places when logging in - let user choose their tab
    }, [session, activeTab]);

    // Listen for places updates (location notes)
    useEffect(() => {
        const handlePlacesUpdate = () => {
            if (mounted && session) {
                fetchPlaces();
            }
        };

        // Listen for location notes updates
        window.addEventListener("locationNoteAdded", handlePlacesUpdate);
        window.addEventListener("locationNoteUpdated", handlePlacesUpdate);

        return () => {
            window.removeEventListener("locationNoteAdded", handlePlacesUpdate);
            window.removeEventListener(
                "locationNoteUpdated",
                handlePlacesUpdate
            );
        };
    }, [fetchPlaces, mounted, session]);

    const handleCreateGroup = async (data: {
        name: string;
        description?: string;
        startTime: Date;
        endTime: Date;
    }) => {
        try {
            const response = await fetch("/api/groups", {
                method: "POST",
                credentials: "include", // 🔑 Include session
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                const newGroup = await response.json();
                setGroups((prev) => [newGroup, ...prev]);
                setShowGroupForm(false);
            }
        } catch (error) {
            console.error("Error creating group:", error);
            throw error;
        }
    };

    const handleGetDirections = async (place: ExtendedPlace) => {
        console.log("🧭 Sidebar: Getting directions to place:", place);
        setIsGettingDirections(place.id);

        try {
            toast.loading("Đang lấy vị trí hiện tại...", {
                id: "sidebar-directions",
            });

            const currentLocation = await getCurrentLocation();
            console.log("📍 Sidebar: Current location:", currentLocation);

            toast.success("Đã tìm thấy vị trí của bạn!", {
                id: "sidebar-directions",
            });

            // Open external navigation app
            const destination = { lat: place.lat, lng: place.lng };
            console.log(
                "🗺️ Sidebar: Opening navigation from",
                currentLocation,
                "to",
                destination
            );
            openExternalNavigation(destination, currentLocation);
        } catch (error) {
            console.error("❌ Sidebar: Error getting directions:", error);
            toast.error("Không thể lấy vị trí hiện tại", {
                description:
                    error instanceof Error
                        ? error.message
                        : "Vui lòng thử lại sau",
                id: "sidebar-directions",
            });

            // Fallback: open without current location
            console.log(
                "🔄 Sidebar: Fallback navigation without current location"
            );
            openExternalNavigation({ lat: place.lat, lng: place.lng });
        } finally {
            setIsGettingDirections(null);
        }
    };

    const tabs = [
        ...(session ? [{ id: "places", label: "Địa điểm", icon: MapPin }] : []),
        // Temporarily disable groups tab
        // ...(session ? [{ id: "groups", label: "Nhóm", icon: Users }] : []),
        { id: "profile", label: "Cá nhân", icon: User },
    ];

    // Helper function to convert CategoryType enum to slug for filtering
    const categoryTypeToSlug = (categoryType: string): string => {
        // If it's already a slug (from location note), return as is
        if (categoryType && categoryType.includes("-")) {
            return categoryType;
        }
        // Otherwise convert CategoryType enum to lowercase slug
        return categoryType.toLowerCase();
    };

    const filteredPlaces = places.filter((place) => {
        const extendedPlace = place as ExtendedPlace;

        // Category filtering
        if (filter.category && filter.category.length > 0) {
            // For location notes, use categorySlug if available
            if (extendedPlace.placeType === "note") {
                const noteHasCategory = extendedPlace.categorySlug;

                console.log("🔍 Filter debug (location note):", {
                    placeName: place.name,
                    placeType: extendedPlace.placeType,
                    categorySlug: extendedPlace.categorySlug,
                    filterCategories: filter.category,
                    noteHasCategory,
                });

                // If no category filter is active, show all notes
                if (filter.category.length === 0) {
                    // No category filter applied
                } else if (!noteHasCategory) {
                    // Note has no category but filter is active - hide it
                    console.log("🚫 Filtering out note - no category assigned");
                    return false;
                } else {
                    // Check if note's category matches the filter
                    const categoryMatches = filter.category.includes(
                        extendedPlace.categorySlug!
                    );
                    if (!categoryMatches) {
                        console.log(
                            "🚫 Filtering out note - category doesn't match"
                        );
                        return false;
                    }
                }
            } else {
                // Regular places use normal category filtering
                const placeSlug = categoryTypeToSlug(place.category);
                console.log("🔍 Filter debug (regular place):", {
                    placeName: place.name,
                    placeCategory: place.category,
                    placeSlug,
                    filterCategories: filter.category,
                    includes: filter.category.includes(placeSlug),
                });
                if (!filter.category.includes(placeSlug)) return false;
            }
        }

        // District filtering
        if (filter.district && !filter.district.includes(place.district || ""))
            return false;

        // Query filtering
        if (
            filter.query &&
            !place.name.toLowerCase().includes(filter.query.toLowerCase()) &&
            !place.address.toLowerCase().includes(filter.query.toLowerCase()) &&
            !(
                extendedPlace.content &&
                extendedPlace.content
                    .toLowerCase()
                    .includes(filter.query.toLowerCase())
            )
        )
            return false;

        return true;
    });

    if (!mounted) {
        return null;
    }

    return (
        <div
            className={cn(
                "fixed left-0 top-0 h-full w-80 md:w-80 sm:w-72 xs:w-full bg-gradient-to-br from-[#0a0a0a] via-[#0C0C0C] to-[#0a0a0a] border-r border-neutral-800/50 transition-transform duration-300 z-20 shadow-2xl backdrop-blur-xl",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}
            suppressHydrationWarning
        >
            <div className="flex flex-col h-full">
                {/* Header with enhanced styling */}
                <div className="relative p-6 border-b border-neutral-800/50 bg-gradient-to-r from-neutral-900/30 to-neutral-800/30">
                    {/* Decorative gradient line */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#FF6B6B]/30 to-transparent"></div>

                    <div className="flex items-center justify-center">
                        <img
                            src="/pinory-logo-full.svg"
                            alt="Pinory - Pin Your Story"
                            className="h-12 w-auto opacity-90 hover:opacity-100 transition-opacity duration-300"
                        />
                    </div>
                </div>

                {/* Navigation Tabs - Enhanced */}
                <div
                    className="flex border-b border-neutral-800/50 bg-gradient-to-r from-neutral-900/40 to-neutral-800/40 backdrop-blur-sm"
                    role="tablist"
                    aria-label="Danh mục chính"
                    onKeyDown={(e) => {
                        const tabButtons = tabs.map((tab) => tab.id);
                        const currentIndex = tabButtons.indexOf(activeTab);

                        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                            e.preventDefault();
                            const nextIndex =
                                e.key === "ArrowRight"
                                    ? (currentIndex + 1) % tabButtons.length
                                    : (currentIndex - 1 + tabButtons.length) %
                                      tabButtons.length;
                            setActiveTab(
                                tabButtons[nextIndex] as
                                    | "places"
                                    | "groups"
                                    | "profile"
                            );
                        }
                    }}
                >
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                id={`${tab.id}-tab`}
                                onClick={() =>
                                    setActiveTab(
                                        tab.id as
                                            | "places"
                                            | "groups"
                                            | "profile"
                                    )
                                }
                                role="tab"
                                aria-selected={isActive}
                                aria-controls={`${tab.id}-panel`}
                                tabIndex={isActive ? 0 : -1}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium border-b-2 transition-all duration-300 relative overflow-hidden group",
                                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B6B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0C0C0C]",
                                    "hover:bg-neutral-800/50",
                                    isActive
                                        ? "border-[#FF6B6B] text-[#FF6B6B] bg-neutral-800/70 shadow-lg shadow-[#FF6B6B]/10 z-10"
                                        : "border-transparent text-[#A0A0A0] hover:text-[#EDEDED]"
                                )}
                                style={{
                                    transform: isActive
                                        ? "translateY(-1px)"
                                        : "translateY(0)",
                                }}
                            >
                                {/* Active background gradient */}
                                {isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-b from-[#FF6B6B]/10 via-neutral-800/60 to-neutral-800/80" />
                                )}

                                {/* Hover effect */}
                                {!isActive && (
                                    <div className="absolute inset-0 bg-gradient-to-b from-neutral-700/0 via-neutral-700/0 to-neutral-700/0 group-hover:from-neutral-700/20 group-hover:via-neutral-700/10 group-hover:to-transparent transition-all duration-300" />
                                )}

                                {/* Icon */}
                                <Icon
                                    className={cn(
                                        "h-5 w-5 transition-all duration-300 relative z-10",
                                        isActive
                                            ? "stroke-[2.5]"
                                            : "stroke-2 group-hover:scale-110"
                                    )}
                                />

                                {/* Label */}
                                <span
                                    className={cn(
                                        "transition-all duration-300 relative z-10",
                                        isActive ? "font-bold" : "font-medium"
                                    )}
                                >
                                    {tab.label}
                                </span>

                                {/* Active indicator dot */}
                                {isActive && (
                                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#FF6B6B] rounded-full animate-pulse" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Content */}
                <div
                    className="flex-1 overflow-y-auto"
                    role="tabpanel"
                    id={`${activeTab}-panel`}
                    aria-labelledby={`${activeTab}-tab`}
                >
                    {activeTab === "places" && (
                        <div className="p-5 space-y-5">
                            {/* Search and Filter - Enhanced */}
                            <div className="space-y-3">
                                <div className="relative group">
                                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#A0A0A0] group-hover:text-[#FF6B6B] transition-colors duration-200" />
                                    <Input
                                        placeholder="Tìm kiếm địa điểm..."
                                        value={filter.query || ""}
                                        onChange={(e) =>
                                            setFilter({ query: e.target.value })
                                        }
                                        className="pl-11 pr-11 h-12 bg-gradient-to-r from-neutral-900/60 to-neutral-800/60 border-neutral-700/60 focus:bg-neutral-800 focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B]/20 transition-all duration-200 rounded-xl text-[#EDEDED] placeholder:text-[#A0A0A0] hover:border-neutral-600"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            setShowFilterPopover(
                                                !showFilterPopover
                                            )
                                        }
                                        className={cn(
                                            "absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 rounded-lg transition-all duration-200",
                                            showFilterPopover
                                                ? "text-[#FF6B6B] bg-[#FF6B6B]/20 hover:bg-[#FF6B6B]/30"
                                                : "text-[#A0A0A0] hover:text-[#EDEDED] hover:bg-neutral-700"
                                        )}
                                        title="Bộ lọc nâng cao"
                                    >
                                        <Filter className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            {/* Filter Popover */}
                            {showFilterPopover && (
                                <div className="bg-[#111111] rounded-xl border border-neutral-800 shadow-2xl p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold text-[#EDEDED]">
                                            Bộ lọc nâng cao
                                        </h4>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                setShowFilterPopover(false)
                                            }
                                            className="h-6 w-6 p-0 text-[#A0A0A0] hover:text-[#EDEDED]"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* Filter by type */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[#EDEDED]">
                                            Loại địa điểm
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                {
                                                    label: "Ghi chú",
                                                    value: "note",
                                                    icon: "📝",
                                                },
                                                {
                                                    label: "Có ảnh",
                                                    value: "with-images",
                                                    icon: "📷",
                                                },
                                            ].map((type) => (
                                                <Button
                                                    key={type.value}
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        // TODO: Implement filter logic
                                                        console.log(
                                                            "Filter by:",
                                                            type.value
                                                        );
                                                    }}
                                                    className="h-8 px-3 text-xs bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-[#EDEDED] rounded-lg"
                                                >
                                                    <span className="mr-1">
                                                        {type.icon}
                                                    </span>
                                                    {type.label}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Date range */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-[#EDEDED]">
                                            Thời gian
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                {
                                                    label: "Hôm nay",
                                                    value: "today",
                                                },
                                                {
                                                    label: "Tuần này",
                                                    value: "week",
                                                },
                                                {
                                                    label: "Tháng này",
                                                    value: "month",
                                                },
                                            ].map((period) => (
                                                <Button
                                                    key={period.value}
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        // TODO: Implement date filter
                                                        console.log(
                                                            "Filter by period:",
                                                            period.value
                                                        );
                                                    }}
                                                    className="h-8 text-xs bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-[#EDEDED] rounded-lg"
                                                >
                                                    {period.label}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-2 border-t border-neutral-800">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                // Reset filters
                                                setFilter({});
                                                setShowFilterPopover(false);
                                            }}
                                            className="flex-1 h-8 text-xs bg-neutral-800 hover:bg-neutral-700 border-neutral-600 rounded-lg text-[#EDEDED]"
                                        >
                                            Đặt lại
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                setShowFilterPopover(false)
                                            }
                                            className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                                        >
                                            Áp dụng
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Quick Categories - Enhanced */}
                            {session && categories.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-[#EDEDED] uppercase tracking-wider px-1">
                                        Danh mục
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {categories.map((category) => {
                                            const isActive =
                                                filter.category?.includes(
                                                    category.slug
                                                );
                                            return (
                                                <Badge
                                                    key={category.id}
                                                    variant={
                                                        isActive
                                                            ? "default"
                                                            : "outline"
                                                    }
                                                    className={cn(
                                                        "cursor-pointer px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95",
                                                        isActive
                                                            ? "text-white shadow-md border-0"
                                                            : "bg-neutral-800/60 text-[#A0A0A0] border-neutral-700/60 hover:bg-neutral-700 hover:border-neutral-600 hover:text-[#EDEDED]"
                                                    )}
                                                    style={{
                                                        backgroundColor:
                                                            isActive
                                                                ? category.color ||
                                                                  "#FF6B6B"
                                                                : undefined,
                                                        boxShadow: isActive
                                                            ? `0 4px 12px ${category.color || "#FF6B6B"}40`
                                                            : undefined,
                                                    }}
                                                    onClick={() => {
                                                        console.log(
                                                            "🏷️ Category clicked:",
                                                            category
                                                        );
                                                        const currentCategories =
                                                            filter.category ||
                                                            [];
                                                        const newCategories =
                                                            currentCategories.includes(
                                                                category.slug
                                                            )
                                                                ? currentCategories.filter(
                                                                      (c) =>
                                                                          c !==
                                                                          category.slug
                                                                  )
                                                                : [
                                                                      ...currentCategories,
                                                                      category.slug,
                                                                  ];
                                                        console.log(
                                                            "🏷️ New filter categories:",
                                                            newCategories
                                                        );

                                                        // Update filter state
                                                        setFilter({
                                                            ...filter, // Preserve other filters
                                                            category:
                                                                newCategories.length >
                                                                0
                                                                    ? newCategories
                                                                    : undefined,
                                                        });

                                                        console.log(
                                                            "🔄 Filter updated:",
                                                            {
                                                                category:
                                                                    newCategories.length >
                                                                    0
                                                                        ? newCategories
                                                                        : undefined,
                                                                prevFilter:
                                                                    filter,
                                                            }
                                                        );
                                                    }}
                                                >
                                                    {category.icon && (
                                                        <span className="mr-1.5 text-sm">
                                                            {category.icon}
                                                        </span>
                                                    )}
                                                    {category.name}
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Places List - Enhanced */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <h3 className="text-xs font-bold text-[#EDEDED] uppercase tracking-wider">
                                        {session
                                            ? "Ghi chú của tôi"
                                            : "Địa điểm phổ biến"}
                                        <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-[#FF6B6B]/20 text-[#FF6B6B] border border-[#FF6B6B]/30">
                                            {filteredPlaces.length}
                                        </span>
                                    </h3>
                                </div>

                                <div className="space-y-3">
                                    {isLoadingPlaces ? (
                                        <div className="text-center py-8 text-[#A0A0A0]">
                                            <div className="animate-spin h-6 w-6 mx-auto mb-2 border-2 border-blue-500 border-t-transparent rounded-full" />
                                            <p className="text-sm">
                                                Đang tải ghi chú...
                                            </p>
                                        </div>
                                    ) : filteredPlaces.length === 0 ? (
                                        <div className="text-center py-8 text-[#A0A0A0]">
                                            <MapPin className="h-8 w-8 mx-auto mb-2 text-neutral-600" />
                                            <p className="text-sm">
                                                {session
                                                    ? "Chưa có ghi chú nào"
                                                    : "Không có ghi chú nào"}
                                            </p>
                                            {session && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="mt-2 bg-neutral-800 border-neutral-700 text-[#EDEDED] hover:bg-neutral-700"
                                                >
                                                    Thêm ghi chú
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        filteredPlaces.map((place) => {
                                            const extendedPlace =
                                                place as ExtendedPlace;
                                            return (
                                                <Card
                                                    key={place.id}
                                                    className="group relative p-4 bg-gradient-to-br from-neutral-900/70 to-neutral-800/70 border border-neutral-800/70 hover:border-[#FF6B6B]/40 hover:shadow-xl hover:shadow-[#FF6B6B]/10 transition-all duration-300 cursor-pointer rounded-2xl overflow-hidden hover:scale-[1.02]"
                                                    onClick={() => {
                                                        // Check if this is a location note (has placeType: 'note')
                                                        if (
                                                            extendedPlace.placeType ===
                                                            "note"
                                                        ) {
                                                            // Convert place back to LocationNote format and select it
                                                            setSelectedNote({
                                                                id: place.id,
                                                                lng: place.lng,
                                                                lat: place.lat,
                                                                address:
                                                                    place.address,
                                                                content:
                                                                    extendedPlace.content ||
                                                                    place.name,
                                                                mood: extendedPlace.mood,
                                                                timestamp:
                                                                    extendedPlace.timestamp ||
                                                                    place.createdAt,
                                                                images:
                                                                    extendedPlace.images ||
                                                                    [],
                                                                hasImages:
                                                                    extendedPlace.hasImages ||
                                                                    false,
                                                            });
                                                        } else {
                                                            setSelectedPlace(
                                                                place
                                                            );
                                                        }
                                                    }}
                                                >
                                                    {/* Hover gradient effect */}
                                                    <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B6B]/0 via-[#FF6B6B]/5 to-[#FF6B6B]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                                    <div className="relative flex items-start gap-3">
                                                        {/* Avatar/Icon - Enhanced */}
                                                        <div className="flex-shrink-0">
                                                            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-700 border border-neutral-600 group-hover:border-[#FF6B6B]/50 group-hover:shadow-lg group-hover:shadow-[#FF6B6B]/20 transition-all duration-300">
                                                                <span className="text-xl group-hover:scale-110 transition-transform duration-300">
                                                                    {extendedPlace.mood ||
                                                                        "📝"}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Content */}
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-bold text-sm text-[#EDEDED] truncate mb-1.5 group-hover:text-[#FF6B6B] transition-colors duration-200">
                                                                {extendedPlace
                                                                    .content
                                                                    ?.length >
                                                                40
                                                                    ? extendedPlace.content.substring(
                                                                          0,
                                                                          40
                                                                      ) + "..."
                                                                    : extendedPlace.content ||
                                                                      place.name}
                                                            </h4>
                                                            <p className="text-xs text-[#A0A0A0] truncate mb-3 flex items-center gap-1.5">
                                                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                                                {place.address}
                                                            </p>

                                                            {/* Meta info - Enhanced */}
                                                            <div className="flex items-center gap-2 text-xs flex-wrap">
                                                                <Badge
                                                                    variant="outline"
                                                                    className="px-2.5 py-1 bg-gradient-to-r from-[#FF6B6B]/20 to-[#FF8E53]/20 text-[#FF6B6B] border-[#FF6B6B]/30 rounded-lg font-semibold"
                                                                >
                                                                    Ghi chú
                                                                </Badge>
                                                                {extendedPlace
                                                                    .images
                                                                    ?.length >
                                                                    0 && (
                                                                    <Badge
                                                                        variant="outline"
                                                                        className="px-2.5 py-1 bg-gradient-to-r from-green-900/30 to-emerald-900/30 text-green-400 border-green-600/40 rounded-lg font-semibold"
                                                                    >
                                                                        📷{" "}
                                                                        {
                                                                            extendedPlace
                                                                                .images
                                                                                .length
                                                                        }
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Action buttons - Enhanced */}
                                                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-9 w-9 p-0 text-[#FF6B6B] hover:text-white hover:bg-[#FF6B6B] rounded-xl transition-all duration-200 hover:scale-110"
                                                                onClick={(
                                                                    e
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    handleGetDirections(
                                                                        place
                                                                    );
                                                                }}
                                                                disabled={
                                                                    isGettingDirections ===
                                                                    place.id
                                                                }
                                                                title="Chỉ đường"
                                                            >
                                                                <Navigation
                                                                    className={`h-4 w-4 ${isGettingDirections === place.id ? "animate-spin" : ""}`}
                                                                />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-9 w-9 p-0 text-[#A0A0A0] hover:text-white hover:bg-neutral-700 rounded-xl transition-all duration-200 hover:scale-110"
                                                                onClick={(
                                                                    e
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    // Show note details by setting it as selected
                                                                    // This will trigger PlacePopup to appear on the map
                                                                    if (
                                                                        extendedPlace.placeType ===
                                                                        "note"
                                                                    ) {
                                                                        const noteToShow =
                                                                            {
                                                                                id: place.id,
                                                                                lng: place.lng,
                                                                                lat: place.lat,
                                                                                address:
                                                                                    place.address,
                                                                                content:
                                                                                    extendedPlace.content ||
                                                                                    place.name,
                                                                                mood: extendedPlace.mood,
                                                                                timestamp:
                                                                                    extendedPlace.timestamp ||
                                                                                    place.createdAt,
                                                                                images:
                                                                                    extendedPlace.images ||
                                                                                    [],
                                                                                hasImages:
                                                                                    extendedPlace.hasImages ||
                                                                                    false,
                                                                                categorySlug:
                                                                                    extendedPlace.categorySlug,
                                                                            };

                                                                        console.log(
                                                                            "👁️ Showing note popup:",
                                                                            noteToShow
                                                                        );
                                                                        console.log(
                                                                            "📷 Images in note:",
                                                                            noteToShow
                                                                                .images
                                                                                ?.length,
                                                                            "images"
                                                                        );
                                                                        console.log(
                                                                            "📷 Images data:",
                                                                            noteToShow.images
                                                                        );
                                                                        setSelectedNote(
                                                                            noteToShow
                                                                        );

                                                                        // Dispatch event to center map on this location
                                                                        window.dispatchEvent(
                                                                            new CustomEvent(
                                                                                "focusLocation",
                                                                                {
                                                                                    detail: {
                                                                                        lat: place.lat,
                                                                                        lng: place.lng,
                                                                                    },
                                                                                }
                                                                            )
                                                                        );
                                                                    } else {
                                                                        setSelectedPlace(
                                                                            place
                                                                        );
                                                                    }
                                                                }}
                                                                title="Xem chi tiết"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </Card>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "groups" && (
                        <div className="p-4 space-y-4">
                            {showRouteGenerator && selectedGroupId ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium text-[#EDEDED]">
                                            Tạo lộ trình cho nhóm
                                        </h3>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                setShowRouteGenerator(false);
                                                setSelectedGroupId(null);
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <RouteGenerator groupId={selectedGroupId} />
                                </div>
                            ) : showGroupForm ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium text-[#EDEDED]">
                                            Tạo nhóm mới
                                        </h3>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() =>
                                                setShowGroupForm(false)
                                            }
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <GroupForm
                                        onSubmit={handleCreateGroup}
                                        onCancel={() => setShowGroupForm(false)}
                                    />
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-medium text-[#EDEDED]">
                                            Nhóm của tôi ({groups.length})
                                        </h3>
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                setShowGroupForm(true)
                                            }
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Tạo nhóm
                                        </Button>
                                    </div>

                                    <div className="space-y-3">
                                        {groups.length === 0 ? (
                                            <div className="text-center py-8 text-[#A0A0A0]">
                                                <Users className="h-8 w-8 mx-auto mb-2 text-neutral-600" />
                                                <p className="text-sm">
                                                    Chưa có nhóm nào
                                                </p>
                                                <p className="text-xs text-[#A0A0A0] mt-1">
                                                    Tạo nhóm để lên kế hoạch
                                                    cùng bạn bè
                                                </p>
                                            </div>
                                        ) : (
                                            groups.map((group) => (
                                                <GroupCard
                                                    key={group.id}
                                                    group={{
                                                        ...group,
                                                        startTime: new Date(
                                                            group.startTime
                                                        ),
                                                        endTime: new Date(
                                                            group.endTime
                                                        ),
                                                        createdAt: new Date(
                                                            group.createdAt
                                                        ),
                                                    }}
                                                    isOwner={true}
                                                    onVote={() =>
                                                        console.log(
                                                            "Vote on group:",
                                                            group.id
                                                        )
                                                    }
                                                    onShare={() =>
                                                        console.log(
                                                            "Share group:",
                                                            group.id
                                                        )
                                                    }
                                                    onSettings={() =>
                                                        console.log(
                                                            "Settings for group:",
                                                            group.id
                                                        )
                                                    }
                                                    onPlan={() => {
                                                        setSelectedGroupId(
                                                            group.id
                                                        );
                                                        setShowRouteGenerator(
                                                            true
                                                        );
                                                    }}
                                                />
                                            ))
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === "profile" && (
                        <div className="p-6 space-y-6">
                            {status === "loading" ? (
                                <div className="text-center py-12">
                                    <div className="relative">
                                        <div className="animate-spin rounded-full h-10 w-10 border-3 border-[#FF6B6B]/30 border-t-[#FF6B6B] mx-auto mb-4"></div>
                                        <div className="absolute inset-0 rounded-full bg-[#FF6B6B]/10 blur-xl animate-pulse"></div>
                                    </div>
                                    <p className="text-[#A0A0A0] text-sm font-medium">
                                        Đang tải...
                                    </p>
                                </div>
                            ) : session ? (
                                <>
                                    {/* Profile Card - Enhanced */}
                                    <div className="relative bg-gradient-to-br from-neutral-900/90 via-neutral-800/90 to-neutral-900/90 rounded-3xl p-6 border border-neutral-700/60 shadow-2xl overflow-hidden">
                                        {/* Decorative top gradient */}
                                        <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#FF6B6B]/10 to-transparent"></div>

                                        <div className="relative text-center">
                                            <div className="relative w-24 h-24 bg-gradient-to-br from-[#FF6B6B] via-[#FF8E53] to-[#FFD6A5] rounded-3xl mx-auto mb-4 flex items-center justify-center overflow-hidden shadow-2xl ring-4 ring-neutral-700/50 p-0.5">
                                                <div className="w-full h-full rounded-3xl overflow-hidden bg-neutral-900">
                                                    {session.user?.image ? (
                                                        /* eslint-disable-next-line @next/next/no-img-element */
                                                        <img
                                                            src={
                                                                session.user
                                                                    .image
                                                            }
                                                            alt="Avatar"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53]">
                                                            <User className="h-12 w-12 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-xl text-[#EDEDED] mb-1.5">
                                                {session.user?.name ||
                                                    "Người dùng"}
                                            </h3>
                                            <p className="text-sm text-[#A0A0A0] mb-5">
                                                {session.user?.email}
                                            </p>

                                            {/* Enhanced Stats */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="relative group bg-gradient-to-br from-[#FF6B6B]/20 via-[#FF6B6B]/10 to-transparent border border-[#FF6B6B]/30 rounded-2xl p-4 hover:shadow-lg hover:shadow-[#FF6B6B]/20 transition-all duration-300">
                                                    <div className="font-black text-2xl text-[#FF6B6B] mb-1">
                                                        {places.length}
                                                    </div>
                                                    <div className="text-xs text-[#FFD6A5] font-semibold">
                                                        Ghi chú
                                                    </div>
                                                </div>
                                                <div className="relative group bg-gradient-to-br from-green-500/20 via-green-500/10 to-transparent border border-green-500/30 rounded-2xl p-4 hover:shadow-lg hover:shadow-green-500/20 transition-all duration-300">
                                                    <div className="font-black text-2xl text-green-400 mb-1">
                                                        {
                                                            filteredPlaces.filter(
                                                                (p) =>
                                                                    (
                                                                        p as ExtendedPlace
                                                                    ).images &&
                                                                    (
                                                                        p as ExtendedPlace
                                                                    ).images
                                                                        .length >
                                                                        0
                                                            ).length
                                                        }
                                                    </div>
                                                    <div className="text-xs text-green-300 font-semibold">
                                                        Có ảnh
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Actions - Enhanced */}
                                    <div className="space-y-3">
                                        <div className="text-xs text-[#A0A0A0] uppercase tracking-wider font-bold mb-3 px-1">
                                            Thao tác nhanh
                                        </div>

                                        <Button
                                            variant="outline"
                                            className="w-full justify-start h-14 bg-gradient-to-r from-red-950/60 to-red-900/60 border-red-800/60 text-red-400 hover:bg-gradient-to-r hover:from-red-900/80 hover:to-red-800/80 hover:border-red-700 hover:shadow-lg hover:shadow-red-900/30 rounded-2xl group transition-all duration-300 hover:scale-[1.02]"
                                            onClick={() => signOut()}
                                        >
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center">
                                                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-900/50 mr-3 group-hover:bg-red-800/70 transition-colors">
                                                        <LogOut className="h-5 w-5 group-hover:text-red-300 transition-colors" />
                                                    </div>
                                                    <span className="font-bold">
                                                        Đăng xuất
                                                    </span>
                                                </div>
                                            </div>
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-12 px-4">
                                    <div className="relative w-24 h-24 bg-gradient-to-br from-neutral-800 to-neutral-700 rounded-3xl mx-auto mb-6 flex items-center justify-center ring-4 ring-neutral-600/50 overflow-hidden group hover:scale-105 transition-transform duration-300">
                                        <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B6B]/20 to-[#FF8E53]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        <User className="h-12 w-12 text-[#A0A0A0] relative z-10" />
                                    </div>
                                    <h3 className="font-bold text-2xl text-[#EDEDED] mb-3">
                                        Chào mừng đến với Pinory! 👋
                                    </h3>
                                    <p className="text-sm text-[#A0A0A0] mb-8 leading-relaxed max-w-sm mx-auto">
                                        Đăng nhập để bắt đầu ghim câu chuyện của
                                        bạn
                                    </p>

                                    {/* Login Button - Enhanced */}
                                    <Button
                                        onClick={() =>
                                            (window.location.href =
                                                "/auth/signin")
                                        }
                                        className="w-full h-14 bg-gradient-to-r from-[#FF6B6B] via-[#FF8E53] to-[#FF6B6B] hover:from-[#FF5555] hover:to-[#FF7A3D] text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:shadow-[#FF6B6B]/40 transition-all duration-300 transform hover:scale-[1.03] mb-4 relative overflow-hidden group"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                                        <div className="flex items-center justify-center relative z-10">
                                            <User className="h-5 w-5 mr-2" />
                                            Đăng nhập
                                        </div>
                                    </Button>

                                    {/* Quick info */}
                                    <div className="flex items-center justify-center gap-2 text-xs text-[#A0A0A0]">
                                        <span>📝 Lưu ghi chú</span>
                                        <span>•</span>
                                        <span>👥 Tạo nhóm</span>
                                        <span>•</span>
                                        <span>🔗 Chia sẻ</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
