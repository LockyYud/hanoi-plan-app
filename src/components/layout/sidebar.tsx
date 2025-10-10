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
  Heart,
  MapPin,
  Users,
  Settings,
  User,
  Search,
  Filter,
  Plus,
  Eye,
  Trash2,
  LogOut,
  X,
  Navigation,
  Download,
} from "lucide-react";
import { useUIStore, usePlaceStore, useCategoryStore, type LocationNote } from "@/lib/store";
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
  const [isGettingDirections, setIsGettingDirections] = useState<string | null>(
    null
  );
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

        const notesResponse = await fetch("/api/location-notes?includeImages=true", {
          credentials: "include", // 🔑 Include session
        });

        if (notesResponse.ok) {
          const notes = await notesResponse.json();
          console.log("📍 Location notes:", notes.length, "items");
          console.log("📷 Sample note with images:", notes[0]?.images);

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
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
      console.error("Session at error time:", session ? "exists" : "null");
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
      window.removeEventListener("locationNoteUpdated", handlePlacesUpdate);
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
          error instanceof Error ? error.message : "Vui lòng thử lại sau",
        id: "sidebar-directions",
      });

      // Fallback: open without current location
      console.log("🔄 Sidebar: Fallback navigation without current location");
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
            console.log("🚫 Filtering out note - category doesn't match");
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
        extendedPlace.content.toLowerCase().includes(filter.query.toLowerCase())
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
        "fixed left-0 top-0 h-full w-80 md:w-80 sm:w-72 xs:w-full bg-[#0C0C0C] border-r border-neutral-800 transition-transform duration-300 z-20 shadow-2xl",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}
      suppressHydrationWarning
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-neutral-800">
          <h1 className="text-xl font-bold text-[#EDEDED] mb-1">Hanoi Plan</h1>
          <p className="text-sm text-[#A0A0A0] leading-relaxed">
            Khám phá Hà Nội cùng bạn bè
          </p>
        </div>

        {/* Navigation Tabs */}
        <div
          className="flex border-b border-neutral-800 bg-neutral-900/50"
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
                  : (currentIndex - 1 + tabButtons.length) % tabButtons.length;
              setActiveTab(
                tabButtons[nextIndex] as "places" | "groups" | "profile"
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
                  setActiveTab(tab.id as "places" | "groups" | "profile")
                }
                role="tab"
                aria-selected={isActive}
                aria-controls={`${tab.id}-panel`}
                tabIndex={isActive ? 0 : -1}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium border-b-2 transition-all duration-300 relative overflow-hidden",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0C0C0C]",
                  "hover:bg-neutral-800/70 hover:text-[#EDEDED]",
                  isActive
                    ? "border-blue-500 text-blue-400 bg-neutral-800 shadow-lg shadow-blue-500/20 z-10"
                    : "border-transparent text-[#A0A0A0]"
                )}
                style={{
                  transform: isActive ? "translateY(-1px)" : "translateY(0)",
                }}
              >
                {/* Active background glow */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-b from-blue-900/30 to-neutral-800/80 border-l border-r border-blue-800/50" />
                )}

                {/* Icon with conditional weight */}
                <Icon
                  className={cn(
                    "h-4 w-4 transition-all duration-300 relative z-10",
                    isActive ? "font-bold stroke-2" : "stroke-1.5"
                  )}
                />

                {/* Label with conditional weight */}
                <span
                  className={cn(
                    "transition-all duration-300 relative z-10",
                    isActive ? "font-semibold" : "font-medium"
                  )}
                >
                  {tab.label}
                </span>

                {/* Active underline */}
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-500 rounded-full" />
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
            <div className="p-4 space-y-4">
              {/* Search and Filter */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#A0A0A0]" />
                  <Input
                    placeholder="Tìm kiếm địa điểm..."
                    value={filter.query || ""}
                    onChange={(e) => setFilter({ query: e.target.value })}
                    className="pl-10 h-11 bg-neutral-900/50 border-neutral-700 focus:bg-neutral-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 rounded-xl text-[#EDEDED] placeholder:text-[#A0A0A0]"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilterPopover(!showFilterPopover)}
                    className={cn(
                      "absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 text-[#A0A0A0] hover:text-[#EDEDED] hover:bg-neutral-800 rounded-lg transition-all duration-200",
                      showFilterPopover ? "text-blue-400 bg-blue-900/30" : ""
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
                      onClick={() => setShowFilterPopover(false)}
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
                            console.log("Filter by:", type.value);
                          }}
                          className="h-8 px-3 text-xs bg-neutral-900 hover:bg-neutral-800 border-neutral-700 text-[#EDEDED] rounded-lg"
                        >
                          <span className="mr-1">{type.icon}</span>
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
                            console.log("Filter by period:", period.value);
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
                      onClick={() => setShowFilterPopover(false)}
                      className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      Áp dụng
                    </Button>
                  </div>
                </div>
              )}

              {/* Quick Categories - Only show when logged in */}
              {session && categories.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-[#EDEDED]">
                    Danh mục
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <Badge
                        key={category.id}
                        variant={
                          filter.category?.includes(category.slug)
                            ? "default"
                            : "outline"
                        }
                        className={cn(
                          "cursor-pointer px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 hover:shadow-sm",
                          filter.category?.includes(category.slug)
                            ? "bg-blue-500 text-white border-blue-500 shadow-sm hover:bg-blue-600"
                            : "bg-neutral-800 text-[#A0A0A0] border-neutral-700 hover:bg-neutral-700 hover:border-neutral-600 hover:text-[#EDEDED]"
                        )}
                        style={{
                          backgroundColor: filter.category?.includes(
                            category.slug
                          )
                            ? category.color || "#3B82F6"
                            : undefined,
                          borderColor: filter.category?.includes(category.slug)
                            ? category.color || "#3B82F6"
                            : undefined,
                        }}
                        onClick={() => {
                          console.log("🏷️ Category clicked:", category);
                          const currentCategories = filter.category || [];
                          const newCategories = currentCategories.includes(
                            category.slug
                          )
                            ? currentCategories.filter(
                                (c) => c !== category.slug
                              )
                            : [...currentCategories, category.slug];
                          console.log(
                            "🏷️ New filter categories:",
                            newCategories
                          );

                          // Update filter state
                          setFilter({
                            ...filter, // Preserve other filters
                            category:
                              newCategories.length > 0
                                ? newCategories
                                : undefined,
                          });

                          console.log("🔄 Filter updated:", {
                            category:
                              newCategories.length > 0
                                ? newCategories
                                : undefined,
                            prevFilter: filter,
                          });
                        }}
                      >
                        {category.icon && (
                          <span className="mr-1">{category.icon}</span>
                        )}
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Places List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#EDEDED]">
                    {session ? "Ghi chú của tôi" : "Địa điểm phổ biến"}{" "}
                    <span className="text-[#A0A0A0] font-normal">
                      ({filteredPlaces.length})
                    </span>
                  </h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-[#A0A0A0] hover:text-blue-400 hover:bg-blue-900/30 rounded-lg"
                    title="Thêm ghi chú"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  {isLoadingPlaces ? (
                    <div className="text-center py-8 text-[#A0A0A0]">
                      <div className="animate-spin h-6 w-6 mx-auto mb-2 border-2 border-blue-500 border-t-transparent rounded-full" />
                      <p className="text-sm">Đang tải ghi chú...</p>
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
                      const extendedPlace = place as ExtendedPlace;
                      return (
                        <Card
                          key={place.id}
                          className="group p-4 bg-[#111111] border border-neutral-800 hover:border-neutral-700 hover:shadow-md transition-all duration-200 cursor-pointer rounded-xl"
                          onClick={() => {
                            // Check if this is a location note (has placeType: 'note')
                            if (extendedPlace.placeType === "note") {
                              // Convert place back to LocationNote format and select it
                              setSelectedNote({
                                id: place.id,
                                lng: place.lng,
                                lat: place.lat,
                                address: place.address,
                                content: extendedPlace.content || place.name,
                                mood: extendedPlace.mood,
                                timestamp:
                                  extendedPlace.timestamp || place.createdAt,
                                images: extendedPlace.images || [],
                                hasImages: extendedPlace.hasImages || false,
                              });
                            } else {
                              setSelectedPlace(place);
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            {/* Avatar/Icon */}
                            <div className="flex-shrink-0">
                              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-700 border border-neutral-600">
                                <span className="text-lg">
                                  {extendedPlace.mood || "📝"}
                                </span>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm text-[#EDEDED] truncate mb-1">
                                {extendedPlace.content?.length > 40
                                  ? extendedPlace.content.substring(0, 40) +
                                    "..."
                                  : extendedPlace.content || place.name}
                              </h4>
                              <p className="text-xs text-[#A0A0A0] truncate mb-2">
                                {place.address}
                              </p>

                              {/* Meta info */}
                              <div className="flex items-center gap-2 text-xs">
                                <Badge
                                  variant="outline"
                                  className="px-2 py-0.5 bg-neutral-800 text-blue-400 border-neutral-700 rounded-full"
                                >
                                  Ghi chú
                                </Badge>
                                {extendedPlace.images?.length > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="px-2 py-0.5 bg-neutral-800 text-green-400 border-neutral-700 rounded-full"
                                  >
                                    📷 {extendedPlace.images.length}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-neutral-800 rounded-lg"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGetDirections(place);
                                }}
                                disabled={isGettingDirections === place.id}
                                title="Chỉ đường"
                              >
                                <Navigation
                                  className={`h-4 w-4 ${isGettingDirections === place.id ? "animate-spin" : ""}`}
                                />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-[#A0A0A0] hover:text-[#EDEDED] hover:bg-neutral-800 rounded-lg"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Show note details by setting it as selected
                                  // This will trigger PlacePopup to appear on the map
                                  if (extendedPlace.placeType === "note") {
                                    const noteToShow = {
                                      id: place.id,
                                      lng: place.lng,
                                      lat: place.lat,
                                      address: place.address,
                                      content: extendedPlace.content || place.name,
                                      mood: extendedPlace.mood,
                                      timestamp: extendedPlace.timestamp || place.createdAt,
                                      images: extendedPlace.images || [],
                                      hasImages: extendedPlace.hasImages || false,
                                      categorySlug: extendedPlace.categorySlug,
                                    };
                                    
                                    console.log("👁️ Showing note popup:", noteToShow);
                                    console.log("📷 Images in note:", noteToShow.images?.length, "images");
                                    console.log("📷 Images data:", noteToShow.images);
                                    setSelectedNote(noteToShow);
                                    
                                    // Dispatch event to center map on this location
                                    window.dispatchEvent(new CustomEvent('focusLocation', {
                                      detail: { lat: place.lat, lng: place.lng }
                                    }));
                                  } else {
                                    setSelectedPlace(place);
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
                      onClick={() => setShowGroupForm(false)}
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
                    <Button size="sm" onClick={() => setShowGroupForm(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Tạo nhóm
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {groups.length === 0 ? (
                      <div className="text-center py-8 text-[#A0A0A0]">
                        <Users className="h-8 w-8 mx-auto mb-2 text-neutral-600" />
                        <p className="text-sm">Chưa có nhóm nào</p>
                        <p className="text-xs text-[#A0A0A0] mt-1">
                          Tạo nhóm để lên kế hoạch cùng bạn bè
                        </p>
                      </div>
                    ) : (
                      groups.map((group) => (
                        <GroupCard
                          key={group.id}
                          group={{
                            ...group,
                            startTime: new Date(group.startTime),
                            endTime: new Date(group.endTime),
                            createdAt: new Date(group.createdAt),
                          }}
                          isOwner={true}
                          onVote={() => console.log("Vote on group:", group.id)}
                          onShare={() => console.log("Share group:", group.id)}
                          onSettings={() =>
                            console.log("Settings for group:", group.id)
                          }
                          onPlan={() => {
                            setSelectedGroupId(group.id);
                            setShowRouteGenerator(true);
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
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-[#A0A0A0] text-sm">Đang tải...</p>
                </div>
              ) : session ? (
                <>
                  {/* Profile Card */}
                  <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl p-6 border border-neutral-700 shadow-lg">
                    <div className="text-center">
                      <div className="relative w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center overflow-hidden shadow-lg ring-2 ring-neutral-700">
                        {session.user?.image ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={session.user.image}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-10 w-10 text-white" />
                        )}
                      </div>
                      <h3 className="font-semibold text-lg text-[#EDEDED] mb-1">
                        {session.user?.name || "Người dùng"}
                      </h3>
                      <p className="text-sm text-[#A0A0A0] mb-4">
                        {session.user?.email}
                      </p>

                      {/* Enhanced Stats */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 border border-blue-700/30 rounded-xl p-3">
                          <div className="font-bold text-lg text-blue-400">
                            {places.length}
                          </div>
                          <div className="text-xs text-blue-300">Ghi chú</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-900/50 to-green-800/50 border border-green-700/30 rounded-xl p-3">
                          <div className="font-bold text-lg text-green-400">
                            {
                              filteredPlaces.filter(
                                (p) =>
                                  (p as ExtendedPlace).images &&
                                  (p as ExtendedPlace).images.length > 0
                              ).length
                            }
                          </div>
                          <div className="text-xs text-green-300">Có ảnh</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-3">
                    <div className="text-xs text-[#A0A0A0] uppercase tracking-wider font-medium mb-3 px-1">
                      Thao tác nhanh
                    </div>

                    {/* <Button
                      variant="outline"
                      className="w-full justify-start h-12 bg-gradient-to-r from-neutral-900 to-neutral-800 border-neutral-700 text-[#EDEDED] hover:bg-gradient-to-r hover:from-neutral-800 hover:to-neutral-700 rounded-xl group transition-all duration-200"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center">
                          <Settings className="h-5 w-5 mr-3 text-[#A0A0A0] group-hover:text-blue-400 transition-colors" />
                          <span className="font-medium">Cài đặt</span>
                        </div>
                      </div>
                    </Button> */}

                    <Button
                      variant="outline"
                      className="w-full justify-start h-12 bg-gradient-to-r from-red-950/50 to-red-900/50 border-red-800/50 text-red-400 hover:bg-gradient-to-r hover:from-red-900/70 hover:to-red-800/70 hover:border-red-700/70 rounded-xl group transition-all duration-200"
                      onClick={() => signOut()}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center">
                          <LogOut className="h-5 w-5 mr-3 group-hover:text-red-300 transition-colors" />
                          <span className="font-medium">Đăng xuất</span>
                        </div>
                      </div>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="relative w-20 h-20 bg-gradient-to-br from-neutral-800 to-neutral-700 rounded-2xl mx-auto mb-6 flex items-center justify-center ring-2 ring-neutral-600">
                    <User className="h-10 w-10 text-[#A0A0A0]" />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10"></div>
                  </div>
                  <h3 className="font-semibold text-xl text-[#EDEDED] mb-2">
                    Chào mừng đến với HanoiPlan! 👋
                  </h3>
                  <p className="text-sm text-[#A0A0A0] mb-6 leading-relaxed max-w-sm mx-auto">
                    Đăng nhập để trải nghiệm đầy đủ tính năng
                  </p>

                  {/* Login Button */}
                  <Button
                    onClick={() => (window.location.href = "/auth/signin")}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] mb-4"
                  >
                    <User className="h-5 w-5 mr-2" />
                    Đăng nhập
                  </Button>

                  {/* Quick info */}
                  <div className="text-xs text-[#A0A0A0]">
                    Lưu ghi chú • Tạo nhóm • Chia sẻ
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
