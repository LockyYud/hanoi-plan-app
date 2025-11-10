"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { GroupForm } from "@/components/groups/group-form";
import { GroupCard } from "@/components/groups/group-card";
import { RouteGenerator } from "@/components/itinerary/route-generator";
import {
  Plus,
  MapPin,
  Users,
  User,
  X,
  Map as MapIcon,
  Newspaper,
} from "lucide-react";
import {
  useUIStore,
  usePlaceStore,
  useCategoryStore,
  useFriendStore,
  type LocationNote,
} from "@/lib/store";
import { CategoryType, SourceType, VisibilityType } from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  getCurrentLocation,
  openExternalNavigation,
  getRoute,
} from "@/lib/geolocation";
import { toast } from "sonner";
import { Journey } from "@/lib/types";
import { CreateJourneyDialog } from "@/components/journey/create-journey-dialog";
import { InviteDialog } from "@/components/friends/invite-dialog";
import {
  PlacesTab,
  JourneysTab,
  FriendsTab,
  FeedTab,
  ProfileTab,
  type ExtendedPlace,
} from "./sidebar-tabs";

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

  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const {
    places,
    filter,
    setFilter,
    setPlaces,
    setSelectedPlace,
    setSelectedNote,
  } = usePlaceStore();

  const [activeTab, setActiveTab] = useState<
    "places" | "journeys" | "groups" | "friends" | "feed" | "profile"
  >("places");
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

  // Journey state
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loadingJourneys, setLoadingJourneys] = useState(false);
  const [showCreateJourney, setShowCreateJourney] = useState(false);
  const [editingJourney, setEditingJourney] = useState<{
    id: string;
    title: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    placeIds: string[];
  } | null>(null);

  // Friend dialog state
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [processingRequest, setProcessingRequest] = useState<string | null>(
    null
  );

  // Use categories from store (shared with location-note-form)
  const { categories } = useCategoryStore();

  // Friend store
  const {
    friends,
    friendRequests,
    activityFeed,
    fetchFriends,
    fetchFriendRequests,
    fetchActivityFeed,
  } = useFriendStore();

  // Define fetchGroups function
  const fetchGroups = useCallback(async () => {
    try {
      if (!session) {
        console.log("🚫 No session, skipping groups fetch");
        setGroups([]);
        return;
      }

      const response = await fetch("/api/groups", {
        credentials: "include",
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

  // Fetch journeys
  const fetchJourneys = useCallback(async () => {
    if (!session) {
      setJourneys([]);
      return;
    }

    setLoadingJourneys(true);
    try {
      const response = await fetch("/api/journeys", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setJourneys(data);
      }
    } catch (error) {
      console.error("Error fetching journeys:", error);
      toast.error("Không thể tải danh sách hành trình");
    } finally {
      setLoadingJourneys(false);
    }
  }, [session]);

  // Define fetchPlaces function with useCallback - UNIFIED LOCATION NOTES SYSTEM
  const fetchPlaces = useCallback(async () => {
    try {
      console.log(
        "🔄 fetchPlaces called, session:",
        session ? "exists" : "null",
        "status:",
        status
      );

      if (status === "loading") {
        console.log("⏳ Session still loading, skipping fetch");
        return;
      }

      setIsLoadingPlaces((currentlyLoading) => {
        if (currentlyLoading) {
          console.log("⏳ Already fetching, skipping fetch");
          return true;
        }
        return true;
      });

      if (session) {
        console.log(
          "🔍 Fetching location notes for user:",
          session.user?.email
        );

        const notesResponse = await fetch(
          "/api/location-notes?includeImages=true",
          {
            credentials: "include",
          }
        );

        if (notesResponse.ok) {
          const notes = await notesResponse.json();
          console.log("📍 Location notes:", notes.length, "items");

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
            category: CategoryType.cafe,
            categorySlug: note.categorySlug,
            source: SourceType.manual,
            visibility: VisibilityType.private,
            createdBy: session.user?.id || "",
            createdAt: new Date(note.timestamp),
            placeType: "note",
          }));

          locationNotes.sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          setPlaces(locationNotes);
          console.log(
            "📝 Converted",
            locationNotes.length,
            "location notes to place format"
          );
        } else {
          console.error(
            "Failed to fetch location notes:",
            notesResponse.status
          );
          setPlaces([]);
        }
      } else {
        setPlaces([]);
        console.log("🚫 Not logged in, clearing places");
      }
    } catch (error) {
      console.error("❌ Error fetching places:", error);
      setPlaces([]);
    } finally {
      setIsLoadingPlaces(false);
    }
  }, [session, status, setPlaces]);

  // Load initial data
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch groups, journeys, and friends when session changes
  useEffect(() => {
    if (mounted && session) {
      fetchGroups();
      fetchJourneys();
      fetchFriends();
      fetchFriendRequests();
    }
  }, [
    mounted,
    session,
    fetchGroups,
    fetchJourneys,
    fetchFriends,
    fetchFriendRequests,
  ]);

  // Fetch places when session or status changes
  useEffect(() => {
    if (mounted && (session || status === "unauthenticated")) {
      fetchPlaces();
    }
  }, [mounted, session, status, fetchPlaces]);

  // Auto-switch to appropriate tab based on session status change
  useEffect(() => {
    if (!session && (activeTab === "places" || activeTab === "groups")) {
      setActiveTab("profile");
    }
  }, [session, activeTab]);

  // Listen for places updates (location notes)
  useEffect(() => {
    const handlePlacesUpdate = () => {
      if (mounted && session) {
        fetchPlaces();
      }
    };

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
        credentials: "include",
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

  // Handle accept friend request
  const handleAcceptFriendRequest = async (requestId: string) => {
    setProcessingRequest(requestId);
    try {
      const response = await fetch(`/api/friends/accept/${requestId}`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Đã chấp nhận lời mời kết bạn");
        fetchFriends();
        fetchFriendRequests();
      } else {
        const error = await response.json();
        toast.error(error.error || "Không thể chấp nhận lời mời");
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error("Lỗi khi chấp nhận lời mời");
    } finally {
      setProcessingRequest(null);
    }
  };

  // Handle reject friend request
  const handleRejectFriendRequest = async (requestId: string) => {
    setProcessingRequest(requestId);
    try {
      const response = await fetch(`/api/friends/reject/${requestId}`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Đã từ chối lời mời kết bạn");
        fetchFriendRequests();
      } else {
        const error = await response.json();
        toast.error(error.error || "Không thể từ chối lời mời");
      }
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      toast.error("Lỗi khi từ chối lời mời");
    } finally {
      setProcessingRequest(null);
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

      toast.loading("Đang tính toán tuyến đường...", {
        id: "sidebar-directions",
      });

      const destination = { lat: place.lat, lng: place.lng };
      const route = await getRoute(currentLocation, destination, {
        profile: "driving",
      });

      console.log("🗺️ Sidebar: Route calculated:", route);

      globalThis.dispatchEvent(
        new CustomEvent("showDirections", {
          detail: {
            destination: {
              name: place.name || "Vị trí đã chọn",
              address: place.address || "",
              lat: place.lat,
              lng: place.lng,
            },
            routeInfo: {
              duration: route.duration,
              distance: route.distance,
            },
            route: route,
          },
        })
      );

      toast.success("Đã tìm thấy tuyến đường!", {
        id: "sidebar-directions",
      });

      openExternalNavigation(destination, currentLocation);
    } catch (error) {
      console.error("❌ Sidebar: Error getting directions:", error);
      toast.error("Không thể tính toán tuyến đường", {
        description:
          error instanceof Error ? error.message : "Vui lòng thử lại sau",
        id: "sidebar-directions",
      });

      console.log("🔄 Sidebar: Fallback navigation without current location");
      openExternalNavigation({ lat: place.lat, lng: place.lng });
    } finally {
      setIsGettingDirections(null);
    }
  };

  const tabs = [
    ...(session ? [{ id: "places", label: "Địa điểm", icon: MapPin }] : []),
    ...(session
      ? [{ id: "journeys", label: "Hành trình", icon: MapIcon }]
      : []),
    // Temporarily disable groups tab
    // ...(session ? [{ id: "groups", label: "Nhóm", icon: Users }] : []),
    ...(session
      ? [
          {
            id: "friends",
            label: "Bạn bè",
            icon: Users,
            badge: friendRequests.length || undefined,
          },
        ]
      : []),
    ...(session ? [{ id: "feed", label: "Hoạt động", icon: Newspaper }] : []),
    { id: "profile", label: "Cá nhân", icon: User },
  ];

  // Helper function to convert CategoryType enum to slug for filtering
  const categoryTypeToSlug = (categoryType: string): string => {
    if (categoryType && categoryType.includes("-")) {
      return categoryType;
    }
    return categoryType.toLowerCase();
  };

  const filteredPlaces = places.filter((place) => {
    const extendedPlace = place as ExtendedPlace;

    // Category filtering
    if (filter.category && filter.category.length > 0) {
      if (extendedPlace.placeType === "note") {
        const noteHasCategory = extendedPlace.categorySlug;

        if (filter.category.length === 0) {
          // No category filter applied
        } else if (!noteHasCategory) {
          return false;
        } else {
          const categoryMatches = filter.category.includes(
            extendedPlace.categorySlug!
          );
          if (!categoryMatches) {
            return false;
          }
        }
      } else {
        const placeSlug = categoryTypeToSlug(place.category);
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
        "fixed left-0 top-0 h-full w-full md:w-80 bg-gradient-to-br from-[#0a0a0a] via-[#0C0C0C] to-[#0a0a0a] border-r border-neutral-800/50 transition-transform duration-300 z-20 shadow-2xl backdrop-blur-xl",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}
      suppressHydrationWarning
    >
      <div className="flex flex-col h-full">
        {/* Header with enhanced styling */}
        <div className="relative p-6 border-b border-neutral-800/50 bg-gradient-to-r from-neutral-900/30 to-neutral-800/30">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#FF6B6B]/30 to-transparent"></div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[#EDEDED] transition-all duration-300 hover:scale-110"
            title="Đóng sidebar"
          >
            <X className="h-5 w-5" />
          </button>

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
                  : (currentIndex - 1 + tabButtons.length) % tabButtons.length;
              setActiveTab(
                tabButtons[nextIndex] as
                  | "places"
                  | "journeys"
                  | "groups"
                  | "friends"
                  | "feed"
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
                      | "journeys"
                      | "groups"
                      | "friends"
                      | "feed"
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
                  transform: isActive ? "translateY(-1px)" : "translateY(0)",
                }}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-b from-[#FF6B6B]/10 via-neutral-800/60 to-neutral-800/80" />
                )}

                {!isActive && (
                  <div className="absolute inset-0 bg-gradient-to-b from-neutral-700/0 via-neutral-700/0 to-neutral-700/0 group-hover:from-neutral-700/20 group-hover:via-neutral-700/10 group-hover:to-transparent transition-all duration-300" />
                )}

                <Icon
                  className={cn(
                    "h-5 w-5 transition-all duration-300 relative z-10",
                    isActive ? "stroke-[2.5]" : "stroke-2 group-hover:scale-110"
                  )}
                />

                <span
                  className={cn(
                    "transition-all duration-300 relative z-10",
                    isActive ? "font-bold" : "font-medium"
                  )}
                >
                  {tab.label}
                </span>

                {tab.badge && tab.badge > 0 && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold z-20">
                    {tab.badge}
                  </span>
                )}

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
            <PlacesTab
              session={session}
              places={places}
              filter={filter}
              categories={categories}
              isLoadingPlaces={isLoadingPlaces}
              isGettingDirections={isGettingDirections}
              showFilterPopover={showFilterPopover}
              setFilter={setFilter}
              setShowFilterPopover={setShowFilterPopover}
              setSelectedPlace={setSelectedPlace}
              setSelectedNote={setSelectedNote}
              setSidebarOpen={setSidebarOpen}
              handleGetDirections={handleGetDirections}
            />
          )}

          {activeTab === "journeys" && (
            <JourneysTab
              journeys={journeys}
              loadingJourneys={loadingJourneys}
              setShowCreateJourney={setShowCreateJourney}
              setEditingJourney={setEditingJourney}
              fetchJourneys={fetchJourneys}
            />
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

          {activeTab === "friends" && (
            <FriendsTab
              friends={friends}
              friendRequests={friendRequests}
              processingRequest={processingRequest}
              setShowInviteDialog={setShowInviteDialog}
              handleAcceptFriendRequest={handleAcceptFriendRequest}
              handleRejectFriendRequest={handleRejectFriendRequest}
            />
          )}

          {activeTab === "feed" && <FeedTab activityFeed={activityFeed} />}

          {activeTab === "profile" && (
            <ProfileTab
              session={session}
              status={status}
              places={places}
              filteredPlaces={filteredPlaces}
            />
          )}
        </div>

        {/* Create/Edit Journey Dialog */}
        <CreateJourneyDialog
          isOpen={showCreateJourney}
          onClose={() => {
            setShowCreateJourney(false);
            setEditingJourney(null);
          }}
          onSuccess={() => {
            fetchJourneys();
          }}
          editingJourney={editingJourney}
        />

        {/* Invite Dialog */}
        <InviteDialog
          isOpen={showInviteDialog}
          onClose={() => setShowInviteDialog(false)}
        />
      </div>
    </div>
  );
}
