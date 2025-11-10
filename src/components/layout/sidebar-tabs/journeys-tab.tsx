"use client";

import { Button } from "@/components/ui/button";
import { Plus, Map as MapIcon } from "lucide-react";
import { Journey } from "@/lib/types";
import { JourneyCard } from "@/components/journey/journey-card";
import { useMemoryLaneStore, type LocationNote } from "@/lib/store";
import { toast } from "sonner";

interface JourneysTabProps {
  journeys: Journey[];
  loadingJourneys: boolean;
  setShowCreateJourney: (show: boolean) => void;
  setEditingJourney: (
    journey: {
      id: string;
      title: string;
      description?: string;
      startDate?: Date;
      endDate?: Date;
      placeIds: string[];
    } | null
  ) => void;
  fetchJourneys: () => void;
}

export function JourneysTab({
  journeys,
  loadingJourneys,
  setShowCreateJourney,
  setEditingJourney,
  fetchJourneys,
}: JourneysTabProps) {
  const handleDelete = async (journey: Journey) => {
    try {
      const response = await fetch(`/api/journeys?id=${journey.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Đã xóa hành trình");
        fetchJourneys();
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      console.error("Error deleting journey:", error);
      toast.error("Không thể xóa hành trình");
    }
  };

  const handleShowOnMap = (journey: Journey) => {
    // Convert journey stops to LocationNote format for RouteDisplay
    const routeNotes: LocationNote[] = journey.stops.map((stop) => {
      const place = stop.place;
      const openHours = (place.openHours as Record<string, unknown>) || {};

      return {
        id: place.id,
        lng: place.lng,
        lat: place.lat,
        address: place.address,
        content: (openHours.content as string) || place.name,
        mood: (openHours.mood as string) || "📍",
        timestamp: place.createdAt,
        images: place.media?.map((m) => m.url) || [],
      };
    });

    // Use Memory Lane store to show route
    const { setRouteNotes, setRouteSortBy, setShowRoute } =
      useMemoryLaneStore.getState();
    setRouteNotes(routeNotes);
    setRouteSortBy("custom"); // Journey has custom order
    setShowRoute(true);

    toast.success(`Đang hiển thị "${journey.title}" trên bản đồ`);
  };

  return (
    <div className="p-3 sm:p-4 md:p-5 space-y-3 sm:space-y-4 md:space-y-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[10px] sm:text-xs font-bold text-[#EDEDED] uppercase tracking-wider flex-1 min-w-0">
          <span className="hidden sm:inline">Hành trình của tôi</span>
          <span className="sm:hidden">Hành trình</span>
          <span className="ml-1.5 sm:ml-2 inline-flex items-center justify-center px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full bg-[#FF6B6B]/20 text-[#FF6B6B] border border-[#FF6B6B]/30">
            {journeys.length}
          </span>
        </h3>
        <Button
          size="sm"
          onClick={() => setShowCreateJourney(true)}
          className="h-7 sm:h-8 px-2 sm:px-3 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] hover:from-[#FF5555] hover:to-[#FF7A3D] text-white text-[10px] sm:text-xs flex-shrink-0"
        >
          <Plus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
          <span className="hidden sm:inline">Tạo mới</span>
        </Button>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {loadingJourneys ? (
          <div className="text-center py-6 sm:py-8 text-[#A0A0A0]">
            <div className="animate-spin h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-2 border-2 border-[#FF6B6B] border-t-transparent rounded-full" />
            <p className="text-xs sm:text-sm">Đang tải hành trình...</p>
          </div>
        ) : journeys.length === 0 ? (
          <div className="text-center py-8 sm:py-10 md:py-12 text-[#A0A0A0] px-2">
            <MapIcon className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 text-neutral-600" />
            <p className="text-xs sm:text-sm mb-1.5 sm:mb-2">
              Chưa có hành trình nào
            </p>
            <p className="text-[10px] sm:text-xs text-[#A0A0A0] mb-3 sm:mb-4">
              Tạo hành trình từ các địa điểm đã note
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCreateJourney(true)}
              className="bg-neutral-800 border-neutral-700 text-[#EDEDED] hover:bg-neutral-700 h-8 sm:h-9 text-xs"
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              <span className="hidden xs:inline">Tạo hành trình đầu tiên</span>
              <span className="xs:hidden">Tạo hành trình</span>
            </Button>
          </div>
        ) : (
          journeys.map((journey) => (
            <JourneyCard
              key={journey.id}
              journey={journey}
              onView={(j) => {
                // TODO: Show journey details dialog
                console.log("View journey:", j);
              }}
              onEdit={(j) => {
                console.log("Editing journey:", j);
                setEditingJourney({
                  id: j.id,
                  title: j.title,
                  description: j.description || undefined,
                  startDate: j.startDate ? new Date(j.startDate) : undefined,
                  endDate: j.endDate ? new Date(j.endDate) : undefined,
                  placeIds: j.stops.map((s) => s.placeId),
                });
                setShowCreateJourney(true);
              }}
              onDelete={handleDelete}
              onShowOnMap={handleShowOnMap}
            />
          ))
        )}
      </div>
    </div>
  );
}
