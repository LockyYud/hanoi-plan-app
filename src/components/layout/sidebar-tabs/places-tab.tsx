"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, Filter, MapPin, X, Navigation, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Place } from "@/lib/store";

// Extended place type that includes location note properties
export type ExtendedPlace = Place & {
  placeType?: "note" | "place";
  content?: string;
  mood?: string;
  timestamp?: Date;
  images?: string[];
  hasImages?: boolean;
  categorySlug?: string;
};

interface PlacesTabProps {
  session: any;
  places: Place[];
  filter: {
    category?: string[];
    district?: string[];
    query?: string;
  };
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    icon?: string;
    color?: string;
  }>;
  isLoadingPlaces: boolean;
  isGettingDirections: string | null;
  showFilterPopover: boolean;
  setFilter: (filter: any) => void;
  setShowFilterPopover: (show: boolean) => void;
  setSelectedPlace: (place: Place) => void;
  setSelectedNote: (note: any) => void;
  setSidebarOpen: (open: boolean) => void;
  handleGetDirections: (place: ExtendedPlace) => void;
}

export function PlacesTab({
  session,
  places,
  filter,
  categories,
  isLoadingPlaces,
  isGettingDirections,
  showFilterPopover,
  setFilter,
  setShowFilterPopover,
  setSelectedPlace,
  setSelectedNote,
  setSidebarOpen,
  handleGetDirections,
}: PlacesTabProps) {
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

        // If no category filter is active, show all notes
        if (filter.category.length === 0) {
          // No category filter applied
        } else if (!noteHasCategory) {
          // Note has no category but filter is active - hide it
          return false;
        } else {
          // Check if note's category matches the filter
          const categoryMatches = filter.category.includes(
            extendedPlace.categorySlug!
          );
          if (!categoryMatches) {
            return false;
          }
        }
      } else {
        // Regular places use normal category filtering
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

  return (
    <div className="p-5 space-y-5">
      {/* Search and Filter - Enhanced */}
      <div className="space-y-3">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#A0A0A0] group-hover:text-[#FF6B6B] transition-colors duration-200" />
          <Input
            placeholder="Tìm kiếm địa điểm..."
            value={filter.query || ""}
            onChange={(e) => setFilter({ query: e.target.value })}
            className="pl-11 pr-11 h-12 bg-gradient-to-r from-neutral-900/60 to-neutral-800/60 border-neutral-700/60 focus:bg-neutral-800 focus:border-[#FF6B6B] focus:ring-2 focus:ring-[#FF6B6B]/20 transition-all duration-200 rounded-xl text-[#EDEDED] placeholder:text-[#A0A0A0] hover:border-neutral-600"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilterPopover(!showFilterPopover)}
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
            <h4 className="font-semibold text-[#EDEDED]">Bộ lọc nâng cao</h4>
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
                { label: "Ghi chú", value: "note", icon: "📝" },
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
                { label: "Hôm nay", value: "today" },
                { label: "Tuần này", value: "week" },
                { label: "Tháng này", value: "month" },
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

      {/* Quick Categories - Enhanced */}
      {session && categories.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-[#EDEDED] uppercase tracking-wider px-1">
            Danh mục
          </h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const isActive = filter.category?.includes(category.slug);
              return (
                <Badge
                  key={category.id}
                  variant={isActive ? "default" : "outline"}
                  className={cn(
                    "cursor-pointer px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95",
                    isActive
                      ? "text-white shadow-md border-0"
                      : "bg-neutral-800/60 text-[#A0A0A0] border-neutral-700/60 hover:bg-neutral-700 hover:border-neutral-600 hover:text-[#EDEDED]"
                  )}
                  style={{
                    backgroundColor: isActive
                      ? category.color || "#FF6B6B"
                      : undefined,
                    boxShadow: isActive
                      ? `0 4px 12px ${category.color || "#FF6B6B"}40`
                      : undefined,
                  }}
                  onClick={() => {
                    const currentCategories = filter.category || [];
                    const newCategories = currentCategories.includes(
                      category.slug
                    )
                      ? currentCategories.filter((c) => c !== category.slug)
                      : [...currentCategories, category.slug];

                    // Update filter state
                    setFilter({
                      ...filter,
                      category:
                        newCategories.length > 0 ? newCategories : undefined,
                    });
                  }}
                >
                  {category.icon && (
                    <span className="mr-1.5 text-sm">{category.icon}</span>
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
            {session ? "Ghi chú của tôi" : "Địa điểm phổ biến"}
            <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-[#FF6B6B]/20 text-[#FF6B6B] border border-[#FF6B6B]/30">
              {filteredPlaces.length}
            </span>
          </h3>
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
                {session ? "Chưa có ghi chú nào" : "Không có ghi chú nào"}
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
                  className="group relative p-4 bg-gradient-to-br from-neutral-900/70 to-neutral-800/70 border border-neutral-800/70 hover:border-[#FF6B6B]/40 hover:shadow-xl hover:shadow-[#FF6B6B]/10 transition-all duration-300 cursor-pointer rounded-2xl overflow-hidden hover:scale-[1.02]"
                  onClick={() => {
                    // Check if this is a location note
                    if (extendedPlace.placeType === "note") {
                      setSelectedNote({
                        id: place.id,
                        lng: place.lng,
                        lat: place.lat,
                        address: place.address,
                        content: extendedPlace.content || place.name,
                        mood: extendedPlace.mood,
                        timestamp: extendedPlace.timestamp || place.createdAt,
                        images: extendedPlace.images || [],
                        hasImages: extendedPlace.hasImages || false,
                      });
                    } else {
                      setSelectedPlace(place);
                    }

                    // Close sidebar on mobile
                    if (window.innerWidth < 768) {
                      setSidebarOpen(false);
                    }
                  }}
                >
                  {/* Hover gradient effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FF6B6B]/0 via-[#FF6B6B]/5 to-[#FF6B6B]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div className="relative flex items-start gap-3">
                    {/* Avatar/Icon - Show cover image if available */}
                    <div className="flex-shrink-0">
                      <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-700 border border-neutral-600 group-hover:border-[#FF6B6B]/50 group-hover:shadow-lg group-hover:shadow-[#FF6B6B]/20 transition-all duration-300 overflow-hidden">
                        {extendedPlace.images &&
                        extendedPlace.images.length > 0 ? (
                          <img
                            src={extendedPlace.images[0]}
                            alt="Cover"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full">
                            <span className="text-xl group-hover:scale-110 transition-transform duration-300">
                              {extendedPlace.mood || "📝"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-[#EDEDED] truncate mb-1.5 group-hover:text-[#FF6B6B] transition-colors duration-200">
                        {extendedPlace.content?.length > 40
                          ? extendedPlace.content.substring(0, 40) + "..."
                          : extendedPlace.content || place.name}
                      </h4>
                      <p className="text-xs text-[#A0A0A0] truncate mb-3 flex items-center gap-1.5">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        {place.name || place.address}
                      </p>

                      {/* Meta info */}
                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        <Badge
                          variant="outline"
                          className="px-2.5 py-1 bg-gradient-to-r from-[#FF6B6B]/20 to-[#FF8E53]/20 text-[#FF6B6B] border-[#FF6B6B]/30 rounded-lg font-semibold"
                        >
                          Ghi chú
                        </Badge>
                        {extendedPlace.images?.length > 0 && (
                          <Badge
                            variant="outline"
                            className="px-2.5 py-1 bg-gradient-to-r from-green-900/30 to-emerald-900/30 text-green-400 border-green-600/40 rounded-lg font-semibold"
                          >
                            📷 {extendedPlace.images.length}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 p-0 text-[#FF6B6B] hover:text-white hover:bg-[#FF6B6B] rounded-xl transition-all duration-200 hover:scale-110"
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
                        className="h-9 w-9 p-0 text-[#A0A0A0] hover:text-white hover:bg-neutral-700 rounded-xl transition-all duration-200 hover:scale-110"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (extendedPlace.placeType === "note") {
                            const noteToShow = {
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
                              categorySlug: extendedPlace.categorySlug,
                            };

                            setSelectedNote(noteToShow);

                            // Center map on this location
                            window.dispatchEvent(
                              new CustomEvent("focusLocation", {
                                detail: {
                                  lat: place.lat,
                                  lng: place.lng,
                                },
                              })
                            );
                          } else {
                            setSelectedPlace(place);
                          }

                          // Close sidebar on mobile
                          if (window.innerWidth < 768) {
                            setSidebarOpen(false);
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
  );
}
