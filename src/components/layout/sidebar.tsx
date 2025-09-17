"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
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
} from "lucide-react";
import { useUIStore, usePlaceStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/types";
import { getCurrentLocation, openExternalNavigation } from "@/lib/geolocation";
import { toast } from "sonner";

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
  const { places, filter, setFilter, setPlaces, setSelectedPlace } =
    usePlaceStore();
  const [activeTab, setActiveTab] = useState<"places" | "groups" | "profile">(
    "profile"
  );
  const [mounted, setMounted] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [isGettingDirections, setIsGettingDirections] = useState<string | null>(
    null
  );
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [lastFetchUserId, setLastFetchUserId] = useState<string | null>(null);
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

  // Define fetchGroups function
  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/groups");
      const result = await response.json();
      if (result.data) {
        setGroups(result.data);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  // Define fetchPlaces function with useCallback
  const fetchPlaces = useCallback(async () => {
    try {
      console.log(
        "🔄 fetchPlaces called, session:",
        session ? "exists" : "null",
        "status:",
        status
      );

      // Don't fetch if session is still loading or already loading
      if (status === "loading" || isLoadingPlaces) {
        console.log(
          "⏳ Session still loading or already fetching, skipping fetch"
        );
        return;
      }

      // Cache for 30 seconds to avoid excessive refetching
      // BUT clear cache if user changed
      const currentUserId = session?.user?.id;
      const now = Date.now();
      if (
        now - lastFetchTime < 30000 &&
        places.length > 0 &&
        (!currentUserId ||
          !lastFetchUserId ||
          currentUserId === lastFetchUserId)
      ) {
        console.log("🚀 Using cached places data");
        return;
      }

      if (currentUserId !== lastFetchUserId) {
        console.log("👤 User changed, clearing cache and forcing refresh");
        setPlaces([]); // Clear old user's data immediately
        setLastFetchUserId(currentUserId);
      }

      setIsLoadingPlaces(true);
      setLastFetchTime(now);

      if (session) {
        // Fetch user's places (unified concept)
        console.log("🔍 Fetching my places for user:", session.user?.email);

        // Fetch favorites and location notes in parallel
        const [favoritesResponse, notesResponse] = await Promise.all([
          fetch("/api/favorites"),
          fetch("/api/location-notes"),
        ]);

        const allPlaces = [];

        // Process saved places from favorites
        if (favoritesResponse.ok) {
          const favorites = await favoritesResponse.json();
          console.log("📍 Saved places:", favorites.length, "items");

          // Extract places from favorites - these are saved places
          const savedPlaces = favorites.map((fav: any) => ({
            ...fav.place,
            isSaved: true,
            userComment: fav.comment,
            userRating: fav.rating,
            placeType: "saved",
          }));
          allPlaces.push(...savedPlaces);
        }

        // Process user notes/places
        if (notesResponse.ok) {
          const notes = await notesResponse.json();
          console.log("📝 My places:", notes.length, "items");

          // Transform notes to unified place format
          const myPlaces = notes.map((note: any) => ({
            id: note.id,
            name: note.content.substring(0, 50),
            address: note.address,
            lat: note.lat,
            lng: note.lng,
            category: "landmark",
            source: "manual",
            createdAt: note.timestamp,
            placeType: "note",
            content: note.content,
            mood: note.mood,
            images: note.images || [],
            hasImages: note.hasImages || false, // Include hasImages field
            timestamp: note.timestamp, // Include timestamp for NoteDetailsView
          }));
          allPlaces.push(...myPlaces);
        }

        // Remove duplicates (same ID can be in both favorites and notes)
        const uniquePlaces = allPlaces.reduce((acc: any[], current: any) => {
          const existing = acc.find((item) => item.id === current.id);
          if (!existing) {
            acc.push(current);
          } else {
            // If exists, merge data intelligently
            const existingIndex = acc.indexOf(existing);
            if (current.placeType === "note") {
              // Note data takes precedence for content and mood
              acc[existingIndex] = {
                ...existing,
                ...current,
                isSaved: existing.isSaved || false, // Keep saved status
                placeType: "note", // Ensure it stays as note type
              };
            } else if (existing.placeType !== "note") {
              // If neither is note, merge normally
              acc[existingIndex] = {
                ...existing,
                ...current,
              };
            }
            // If existing is note and current is saved, keep note as-is but mark as saved
            if (
              existing.placeType === "note" &&
              current.placeType === "saved"
            ) {
              acc[existingIndex] = {
                ...existing,
                isSaved: true,
              };
            }
          }
          return acc;
        }, []);

        // Sort by creation date (newest first)
        uniquePlaces.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setPlaces(uniquePlaces);
        console.log(
          "✅ My places loaded:",
          uniquePlaces.length,
          "places (deduplicated from",
          allPlaces.length,
          ")"
        );
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
  }, [session, status, setPlaces]);

  // Load initial data
  useEffect(() => {
    setMounted(true);
    fetchGroups();
    fetchPlaces();
  }, [fetchPlaces]);

  // Auto-switch to appropriate tab based on session status change
  useEffect(() => {
    // Only switch when session status changes, not when user manually clicks tabs
    if (!session && (activeTab === "places" || activeTab === "groups")) {
      // User logged out, switch to profile tab
      setActiveTab("profile");
    }
    // Remove auto-switch to places when logging in - let user choose their tab
  }, [session, activeTab]);

  // Listen for places updates (favorites and location notes)
  useEffect(() => {
    const handlePlacesUpdate = () => {
      if (mounted && session) {
        fetchPlaces();
      }
    };

    // Listen for both favorites and location notes updates
    window.addEventListener("favoritesUpdated", handlePlacesUpdate);
    window.addEventListener("locationNoteAdded", handlePlacesUpdate);

    return () => {
      window.removeEventListener("favoritesUpdated", handlePlacesUpdate);
      window.removeEventListener("locationNoteAdded", handlePlacesUpdate);
    };
  }, [fetchPlaces, mounted, session]);

  // Refetch places when filter changes
  useEffect(() => {
    if (mounted) {
      fetchPlaces();
    }
  }, [filter, mounted, fetchPlaces]);

  const handleCreateGroup = async (data: {
    name: string;
    description?: string;
    startTime: Date;
    endTime: Date;
  }) => {
    try {
      const response = await fetch("/api/groups", {
        method: "POST",
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

  const handleGetDirections = async (place: any) => {
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

  const filteredPlaces = places.filter((place) => {
    if (filter.category && !filter.category.includes(place.category))
      return false;
    if (filter.district && !filter.district.includes(place.district || ""))
      return false;
    if (
      filter.query &&
      !place.name.toLowerCase().includes(filter.query.toLowerCase())
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
        "fixed left-0 top-0 h-full w-80 bg-white border-r border-gray-200 transition-transform duration-300 z-20",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}
      suppressHydrationWarning
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Hanoi Plan</h1>
          <p className="text-sm text-gray-600">Khám phá Hà Nội cùng bạn bè</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "places" && (
            <div className="p-4 space-y-4">
              {/* Search and Filter */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm địa điểm..."
                    value={filter.query || ""}
                    onChange={(e) => setFilter({ query: e.target.value })}
                    className="pl-10"
                  />
                </div>

                <Button variant="outline" size="sm" className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  Bộ lọc nâng cao
                </Button>
              </div>

              {/* Quick Categories */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">Danh mục</h3>
                <div className="flex flex-wrap gap-1">
                  {CATEGORIES.map((category) => (
                    <Badge
                      key={category}
                      variant={
                        filter.category?.includes(category)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => {
                        const currentCategories = filter.category || [];
                        const newCategories = currentCategories.includes(
                          category
                        )
                          ? currentCategories.filter((c) => c !== category)
                          : [...currentCategories, category];
                        setFilter({
                          category:
                            newCategories.length > 0
                              ? newCategories
                              : undefined,
                        });
                      }}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Places List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-700">
                    {session ? "Địa điểm của tôi" : "Địa điểm phổ biến"} (
                    {filteredPlaces.length})
                  </h3>
                  <Button size="sm" variant="ghost">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {isLoadingPlaces ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="animate-spin h-6 w-6 mx-auto mb-2 border-2 border-blue-600 border-t-transparent rounded-full" />
                      <p className="text-sm">Đang tải địa điểm...</p>
                    </div>
                  ) : filteredPlaces.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">
                        {session
                          ? "Chưa có địa điểm nào"
                          : "Không có địa điểm nào"}
                      </p>
                      {session && (
                        <Button size="sm" variant="outline" className="mt-2">
                          Thêm địa điểm
                        </Button>
                      )}
                    </div>
                  ) : (
                    filteredPlaces.map((place) => (
                      <Card
                        key={place.id}
                        className="p-3 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedPlace(place)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 mt-1">
                            {(place as any).placeType === "note" ? (
                              <span className="text-xs">
                                {(place as any).mood || "📝"}
                              </span>
                            ) : (
                              <span className="text-xs text-blue-500">📍</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-gray-900 truncate">
                              {(place as any).placeType === "note"
                                ? (place as any).content.length > 40
                                  ? (place as any).content.substring(0, 40) +
                                    "..."
                                  : (place as any).content
                                : place.name}
                            </h4>
                            <p className="text-xs text-gray-500 truncate">
                              {place.address}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {(place as any).placeType === "note" ? (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                >
                                  Ghi chú
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  {place.category}
                                </Badge>
                              )}
                              {place.priceLevel && (
                                <span className="text-xs text-gray-500">
                                  {"₫".repeat(place.priceLevel)}
                                </span>
                              )}
                              {(place as any).placeType === "note" &&
                                (place as any).images?.length > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-green-50 text-green-700 border-green-200"
                                  >
                                    📷 {(place as any).images.length}
                                  </Badge>
                                )}
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex flex-col gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGetDirections(place);
                              }}
                              disabled={isGettingDirections === place.id}
                              title="Chỉ đường"
                            >
                              <Navigation
                                className={`h-3 w-3 ${isGettingDirections === place.id ? "animate-spin" : ""}`}
                              />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log(
                                  "View details:",
                                  place.name || (place as any).content
                                );
                              }}
                              title="Xem chi tiết"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (
                                  confirm("Bạn có chắc muốn xóa địa điểm này?")
                                ) {
                                  try {
                                    const placeType = (place as any).placeType;
                                    let apiUrl = "";

                                    if (placeType === "note") {
                                      // Delete location note
                                      apiUrl = `/api/location-notes?id=${place.id}`;
                                    } else {
                                      // Delete favorite place
                                      apiUrl = `/api/favorites?placeId=${place.id}`;
                                    }

                                    const response = await fetch(apiUrl, {
                                      method: "DELETE",
                                    });

                                    if (!response.ok) {
                                      throw new Error("Failed to delete");
                                    }

                                    console.log(
                                      "Deleted:",
                                      place.name || (place as any).content
                                    );

                                    // Refresh places list
                                    fetchPlaces();

                                    // Trigger map refresh
                                    window.dispatchEvent(
                                      new CustomEvent("favoritesUpdated")
                                    );
                                    window.dispatchEvent(
                                      new CustomEvent("locationNoteAdded")
                                    );

                                    toast.success("Đã xóa địa điểm");
                                  } catch (error) {
                                    console.error("Error deleting:", error);
                                    toast.error("Không thể xóa địa điểm");
                                  }
                                }
                              }}
                              title="Xóa khỏi danh sách"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
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
                    <h3 className="text-sm font-medium text-gray-700">
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
                    <h3 className="text-sm font-medium text-gray-700">
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
                    <h3 className="text-sm font-medium text-gray-700">
                      Nhóm của tôi ({groups.length})
                    </h3>
                    <Button size="sm" onClick={() => setShowGroupForm(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Tạo nhóm
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {groups.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Chưa có nhóm nào</p>
                        <p className="text-xs text-gray-400 mt-1">
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
            <div className="p-4 space-y-4">
              {status === "loading" ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Đang tải...</p>
                </div>
              ) : session ? (
                <>
                  <div className="w-16 h-16 bg-blue-200 rounded-full mx-auto mb-3 flex items-center justify-center overflow-hidden">
                    {session.user?.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={session.user.image}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-blue-600" />
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900">
                    {session.user?.name || "Người dùng"}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {session.user?.email}
                  </p>
                  <div className="space-y-2 mt-4">
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="h-4 w-4 mr-2" />
                      Cài đặt
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-red-600 hover:text-red-700"
                      onClick={() => signOut()}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Đăng xuất
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <User className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    Đăng nhập để sử dụng
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Lưu địa điểm yêu thích và tạo nhóm
                  </p>
                  {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID &&
                  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID !==
                    "demo-google-client-id" ? (
                    <Button
                      onClick={() => signIn("google")}
                      className="w-full mb-2"
                    >
                      <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Đăng nhập với Google
                    </Button>
                  ) : (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 mb-2">
                        🔧 <strong>Cần cấu hình Google OAuth</strong>
                      </p>
                      <p className="text-xs text-yellow-700">
                        Để sử dụng đăng nhập, vui lòng:
                      </p>
                      <ol className="text-xs text-yellow-700 ml-4 mt-1 list-decimal">
                        <li>Tạo Google OAuth app</li>
                        <li>Cập nhật .env.local</li>
                        <li>Restart dev server</li>
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
