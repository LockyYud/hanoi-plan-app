"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { MapPin, Users, User, X, Map as MapIcon } from "lucide-react";
import {
  useUIStore,
  usePinoryStore,
  useCategoryStore,
  useFriendStore,
} from "@/lib/store";
import { useFriendAPI, usePinoryAPI } from "@/lib/hooks";
import type { Pinory } from "@/lib/types";
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
  PinoriesTab,
  JourneysTab,
  FriendsTab,
  FeedTab,
  ProfileTab,
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
  const { pinories, filter, setFilter, setPinories, setSelectedPinory } =
    usePinoryStore();

  const [activeTab, setActiveTab] = useState<
    "places" | "journeys" | "social" | "profile"
  >("places");
  const [socialSubTab, setSocialSubTab] = useState<"friends" | "feed">(
    "friends"
  );
  const [mounted, setMounted] = useState(false);
  const [isGettingDirections, setIsGettingDirections] = useState<string | null>(
    null
  );
  const [isLoadingPinories, setIsLoadingPinories] = useState(false);
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
  const { friends, friendRequests, activityFeed } = useFriendStore();

  // API hooks
  const {
    fetchFriends,
    fetchFriendRequests,
    fetchActivityFeed,
    acceptFriendRequest: acceptFriendRequestAPI,
    rejectFriendRequest: rejectFriendRequestAPI,
  } = useFriendAPI();

  const { fetchPinories } = usePinoryAPI(session);

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

  // Load initial data
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch journeys, friends, and activity feed when session changes
  useEffect(() => {
    if (mounted && session) {
      fetchJourneys();
      fetchFriends();
      fetchFriendRequests();
      fetchActivityFeed();
    }
  }, [
    mounted,
    session,
    fetchJourneys,
    fetchFriends,
    fetchFriendRequests,
    fetchActivityFeed,
  ]);

  // Fetch places when session or status changes
  useEffect(() => {
    if (mounted && (session || status === "unauthenticated")) {
      fetchPinories();
    }
  }, [mounted, session, status, fetchPinories]);

  // Auto-switch to appropriate tab based on session status change
  useEffect(() => {
    if (
      !session &&
      (activeTab === "places" ||
        activeTab === "journeys" ||
        activeTab === "social")
    ) {
      setActiveTab("profile");
    }
  }, [session, activeTab]);

  // Listen for places updates (location notes)
  useEffect(() => {
    const handlePlacesUpdate = () => {
      if (mounted && session) {
        fetchPinories();
      }
    };

    window.addEventListener("pinoryAdded", handlePlacesUpdate);
    window.addEventListener("pinoryUpdated", handlePlacesUpdate);

    return () => {
      window.removeEventListener("pinoryAdded", handlePlacesUpdate);
      window.removeEventListener("pinoryUpdated", handlePlacesUpdate);
    };
  }, [fetchPinories, mounted, session]);

  // Handle accept friend request
  const handleAcceptFriendRequest = async (requestId: string) => {
    setProcessingRequest(requestId);
    try {
      await acceptFriendRequestAPI(requestId);
      toast.success("Đã chấp nhận lời mời kết bạn");
      fetchFriends();
      fetchFriendRequests();
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
      await rejectFriendRequestAPI(requestId);
      toast.success("Đã từ chối lời mời kết bạn");
      fetchFriendRequests();
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      toast.error("Lỗi khi từ chối lời mời");
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleGetDirections = async (place: Pinory) => {
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
    ...(session
      ? [
          {
            id: "social",
            label: "Social",
            icon: Users,
            badge: friendRequests.length || undefined,
          },
        ]
      : []),
    { id: "profile", label: "Cá nhân", icon: User },
  ];

  // Helper function to convert CategoryType enum to slug for filtering
  const categoryTypeToSlug = (categoryType: string): string => {
    if (categoryType && categoryType.includes("-")) {
      return categoryType;
    }
    return categoryType.toLowerCase();
  };

  const filteredPlaces = pinories.filter((place) => {
    // Category filtering
    if (filter.category && filter.category.length > 0) {
      if (place.placeType === "note") {
        const noteHasCategory = place.categorySlug;

        if (filter.category.length === 0) {
          // No category filter applied
        } else if (!noteHasCategory) {
          return false;
        } else {
          const categoryMatches = filter.category.includes(place.categorySlug!);
          if (!categoryMatches) {
            return false;
          }
        }
      } else {
        const placeSlug = categoryTypeToSlug(place.category || "");
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
        place.content &&
        place.content.toLowerCase().includes(filter.query.toLowerCase())
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
        "fixed left-0 top-0 h-full w-full md:w-80 bg-gradient-to-br from-[#0a0a0a] via-[#0C0C0C] to-[#0a0a0a] border-r border-neutral-800/50 transition-all duration-300 ease-in-out z-20 shadow-2xl backdrop-blur-xl",
        sidebarOpen
          ? "translate-x-0 opacity-100"
          : "-translate-x-full opacity-0"
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

        {/* Navigation Tabs - Icon Only with Labels on Active */}
        <div
          className="flex border-b border-neutral-800/50 bg-gradient-to-r from-neutral-900/40 to-neutral-800/40 backdrop-blur-sm"
          role="tablist"
          aria-label="Danh mục chính"
          tabIndex={0}
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
                  | "social"
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
                    tab.id as "places" | "journeys" | "social" | "profile"
                  )
                }
                role="tab"
                aria-selected={isActive}
                aria-controls={`${tab.id}-panel`}
                tabIndex={isActive ? 0 : -1}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 py-3 text-sm font-medium border-b-2 transition-all duration-300 relative overflow-hidden group",
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
                    "h-6 w-6 transition-all duration-300 relative z-10",
                    isActive
                      ? "stroke-[2.5] scale-110"
                      : "stroke-2 group-hover:scale-110 group-active:scale-95"
                  )}
                />

                {isActive && (
                  <span
                    className={cn(
                      "text-xs font-bold transition-all duration-300 relative z-10 animate-in fade-in zoom-in-90 duration-200"
                    )}
                  >
                    {tab.label}
                  </span>
                )}

                {tab.badge && tab.badge > 0 && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold z-20">
                    {tab.badge}
                  </span>
                )}

                {isActive && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-[#FF6B6B] rounded-full animate-pulse animate-in fade-in zoom-in duration-300" />
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div
          className="flex-1 overflow-y-auto relative"
          role="tabpanel"
          id={`${activeTab}-panel`}
          aria-labelledby={`${activeTab}-tab`}
        >
          {activeTab === "places" && (
            <div
              className="animate-in fade-in slide-in-from-bottom-2 duration-300"
              key="places-content"
            >
              <PinoriesTab
                session={session}
                pinories={pinories}
                filter={filter}
                categories={categories}
                isLoadingPinories={isLoadingPinories}
                isGettingDirections={isGettingDirections}
                showFilterPopover={showFilterPopover}
                setFilter={setFilter}
                setShowFilterPopover={setShowFilterPopover}
                setSelectedPinory={setSelectedPinory}
                setSidebarOpen={setSidebarOpen}
                handleGetDirections={handleGetDirections}
              />
            </div>
          )}

          {activeTab === "journeys" && (
            <div
              className="animate-in fade-in slide-in-from-bottom-2 duration-300"
              key="journeys-content"
            >
              <JourneysTab
                journeys={journeys}
                loadingJourneys={loadingJourneys}
                setShowCreateJourney={setShowCreateJourney}
                setEditingJourney={setEditingJourney}
                fetchJourneys={fetchJourneys}
              />
            </div>
          )}

          {activeTab === "social" && (
            <div
              className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-300"
              key="social-content"
            >
              {/* Social Sub-Tabs */}
              <div className="flex border-b border-neutral-800/50 bg-neutral-900/20">
                <button
                  onClick={() => setSocialSubTab("friends")}
                  className={cn(
                    "flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 relative group",
                    socialSubTab === "friends"
                      ? "text-[#FF6B6B] bg-neutral-800/50"
                      : "text-[#A0A0A0] hover:text-[#EDEDED] hover:bg-neutral-800/30 active:scale-95"
                  )}
                >
                  {socialSubTab === "friends" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6B6B] animate-in slide-in-from-left duration-200" />
                  )}
                  Bạn bè
                  {friendRequests.length > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold animate-pulse">
                      {friendRequests.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setSocialSubTab("feed")}
                  className={cn(
                    "flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 relative group",
                    socialSubTab === "feed"
                      ? "text-[#FF6B6B] bg-neutral-800/50"
                      : "text-[#A0A0A0] hover:text-[#EDEDED] hover:bg-neutral-800/30 active:scale-95"
                  )}
                >
                  {socialSubTab === "feed" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF6B6B] animate-in slide-in-from-right duration-200" />
                  )}
                  Hoạt động
                </button>
              </div>

              {/* Social Content */}
              <div className="flex-1 overflow-y-auto relative">
                {socialSubTab === "friends" && (
                  <div
                    className="animate-in fade-in slide-in-from-right-2 duration-200"
                    key="friends-subtab"
                  >
                    <FriendsTab
                      friends={friends as any}
                      friendRequests={friendRequests as any}
                      processingRequest={processingRequest}
                      setShowInviteDialog={setShowInviteDialog}
                      handleAcceptFriendRequest={handleAcceptFriendRequest}
                      handleRejectFriendRequest={handleRejectFriendRequest}
                    />
                  </div>
                )}

                {socialSubTab === "feed" && (
                  <div
                    className="animate-in fade-in slide-in-from-left-2 duration-200"
                    key="feed-subtab"
                  >
                    <FeedTab activityFeed={activityFeed as any} />
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div
              className="animate-in fade-in slide-in-from-bottom-2 duration-300"
              key="profile-content"
            >
              <ProfileTab
                session={session}
                status={status}
                pinories={pinories}
                filteredPlaces={filteredPlaces}
              />
            </div>
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
