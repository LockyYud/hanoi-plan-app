"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  getCurrentLocation,
  openExternalNavigation,
  getRoute,
  addRouteToMap,
  removeRouteFromMap,
  hasActiveRoute,
  formatDuration,
  formatDistance,
  UserLocation,
} from "@/lib/geolocation";
import { Place } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  X,
  MapPin,
  Phone,
  Globe,
  Star,
  Navigation,
  Eye,
  BookOpen,
  PenTool,
  Trash2,
  NavigationOff,
} from "lucide-react";
import { isValidImageUrl, ImageDisplay } from "@/lib/image-utils";

interface LocationNote {
  id: string;
  lng: number;
  lat: number;
  address: string;
  content: string;
  mood?: string;
  timestamp: Date;
  images?: string[];
}

interface LocationPreview {
  lng: number;
  lat: number;
  address: string;
}

interface PlacePopupProps {
  readonly place?: Place;
  readonly note?: LocationNote;
  readonly location?: LocationPreview; // For location preview
  readonly onClose: () => void;
  readonly onViewDetails?: () => void; // For notes and places
  readonly onAddNote?: () => void; // For locations
  readonly onDelete?: () => void; // For deleting places/notes
  readonly mapRef?: React.RefObject<mapboxgl.Map>; // Pass map reference for dynamic positioning
}

export function PlacePopup({
  place,
  note,
  location,
  onClose,
  onViewDetails,
  onAddNote,
  onDelete,
  mapRef,
}: PlacePopupProps) {
  const { data: session } = useSession();
  const [isAddingToFavorites, setIsAddingToFavorites] = useState(false);
  const [isGettingDirections, setIsGettingDirections] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [showRouteOptions, setShowRouteOptions] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{
    duration: number;
    distance: number;
  } | null>(null);
  const [hasRoute, setHasRoute] = useState(false);

  // Determine popup type
  const isNote = !!note;
  const isPlace = !!place;
  const isLocation = !!location;
  const categoryIcons = {
    cafe: "☕",
    food: "🍜",
    bar: "🍻",
    rooftop: "🏙️",
    activity: "🎯",
    landmark: "🏛️",
  };

  const categoryColors = {
    cafe: "bg-amber-900/30 text-amber-400 border-amber-800",
    food: "bg-red-900/30 text-red-400 border-red-800",
    bar: "bg-purple-900/30 text-purple-400 border-purple-800",
    rooftop: "bg-blue-900/30 text-blue-400 border-blue-800",
    activity: "bg-green-900/30 text-green-400 border-green-800",
    landmark: "bg-neutral-700 text-neutral-300 border-neutral-600",
  };

  const averageRating = place?.favorites?.length
    ? place.favorites.reduce((sum, fav) => sum + (fav.rating || 0), 0) /
      place.favorites.length
    : 0;

  // Helper functions for notes
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleString("vi-VN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleGetDirections = async (
    destination: {
      lat: number;
      lng: number;
    },
    showOnMap: boolean = false
  ) => {
    console.log(
      "🧭 Getting directions to:",
      destination,
      "Show on map:",
      showOnMap
    );
    setIsGettingDirections(true);

    try {
      toast.loading("Đang lấy vị trí hiện tại...", { id: "directions" });

      const currentLocation = await getCurrentLocation();
      console.log("📍 Current location:", currentLocation);
      setUserLocation(currentLocation);

      toast.success("Đã tìm thấy vị trí của bạn!", { id: "directions" });

      if (showOnMap && mapRef) {
        // Show route on Mapbox map
        console.log("🗺️ Map reference:", mapRef);
        toast.loading("Đang tính toán đường đi...", {
          id: "directions",
        });

        try {
          const route = await getRoute(currentLocation, destination);
          console.log("🗺️ Route calculated:", route);

          // Try to add route to map
          try {
            addRouteToMap(mapRef, route);

            // Store route info
            setRouteInfo({
              duration: route.duration,
              distance: route.distance,
            });
            setHasRoute(true);

            // Emit route created event with destination info
            const destinationName = isNote ? "Ghi chú của bạn" : isLocation ? "Vị trí được chọn" : place?.name || "Địa điểm";
            const destinationAddress = isNote ? note?.address : isLocation ? location?.address : place?.address || "";
            
            window.dispatchEvent(new CustomEvent('routeCreated', {
              detail: {
                destination: {
                  name: destinationName,
                  address: destinationAddress,
                  lat: destination.lat,
                  lng: destination.lng,
                },
                routeInfo: {
                  duration: route.duration,
                  distance: route.distance,
                }
              }
            }));

            toast.success(
              `Đường đi: ${formatDistance(route.distance)} • ${formatDuration(route.duration)}`,
              {
                id: "directions",
              }
            );
          } catch (mapError) {
            console.error("❌ Error adding route to map:", mapError);

            // Still show route info even if map display fails
            setRouteInfo({
              duration: route.duration,
              distance: route.distance,
            });
            setHasRoute(true);

            // Emit route created event even if map display fails
            const destinationName = isNote ? "Ghi chú của bạn" : isLocation ? "Vị trí được chọn" : place?.name || "Địa điểm";
            const destinationAddress = isNote ? note?.address : isLocation ? location?.address : place?.address || "";
            
            window.dispatchEvent(new CustomEvent('routeCreated', {
              detail: {
                destination: {
                  name: destinationName,
                  address: destinationAddress,
                  lat: destination.lat,
                  lng: destination.lng,
                },
                routeInfo: {
                  duration: route.duration,
                  distance: route.distance,
                }
              }
            }));

            toast.success(
              `Đường đi: ${formatDistance(route.distance)} • ${formatDuration(route.duration)} (Không hiển thị được trên bản đồ)`,
              {
                id: "directions",
              }
            );
          }
        } catch (routeError) {
          console.error("❌ Error calculating route:", routeError);
          toast.error("Không thể tính toán đường đi", {
            id: "directions",
          });

          // Fallback to external navigation
          openExternalNavigation(destination, currentLocation);
        }
      } else {
        // Open external navigation app
        console.log(
          "🗺️ Opening external navigation from",
          currentLocation,
          "to",
          destination
        );
        openExternalNavigation(destination, currentLocation);

        // Close popup after successful navigation
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (error) {
      console.error("❌ Error getting directions:", error);
      toast.error("Không thể lấy vị trí hiện tại", {
        description:
          error instanceof Error ? error.message : "Vui lòng thử lại sau",
        id: "directions",
      });

      // Fallback: open without current location
      console.log("🔄 Fallback: Opening navigation without current location");
      openExternalNavigation(destination);
    } finally {
      setIsGettingDirections(false);
    }
  };

  const handleClearDirections = () => {
    if (mapRef) {
      const success = removeRouteFromMap(mapRef);
      if (success) {
        setRouteInfo(null);
        setShowRouteOptions(false);
        setHasRoute(false);
        
        // Emit route cleared event
        window.dispatchEvent(new CustomEvent('routeCleared'));
        
        toast.success("Đã tắt chỉ đường");
      } else {
        toast.error("Không thể tắt chỉ đường");
      }
    }
  };

  const handleAddToFavorites = async () => {
    if (!session?.user || !place) return;

    setIsAddingToFavorites(true);
    try {
      const response = await fetch("/api/favorites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          placeId: place.id,
        }),
      });

      if (response.ok) {
        toast.success("Đã thêm vào danh sách yêu thích!", {
          description: place.name,
        });
        // Trigger refresh of places list in sidebar
        window.dispatchEvent(new CustomEvent("favoritesUpdated"));
      } else {
        const error = await response.json();
        toast.error("Không thể thêm vào yêu thích", {
          description: error.error || "Vui lòng thử lại sau",
        });
      }
    } catch (error) {
      console.error("Error adding to favorites:", error);
      toast.error("Lỗi kết nối", {
        description: "Không thể kết nối đến server",
      });
    } finally {
      setIsAddingToFavorites(false);
    }
  };

  // Dynamic positioning with smart arrow placement
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
  const [arrowPosition, setArrowPosition] = useState<"top" | "bottom">(
    "bottom"
  );
  const [arrowOffset, setArrowOffset] = useState(50); // Percentage from left
  const popupRef = useRef<HTMLDivElement>(null);
  const lastHeightRef = useRef<number>(280); // Cache last known height

  useEffect(() => {
    if (!mapRef?.current) return;

    const coordinates = note
      ? [note.lng, note.lat]
      : location
        ? [location.lng, location.lat]
        : place
          ? [place.lng, place.lat]
          : null;

    if (!coordinates) return;

    const updatePosition = () => {
      if (!mapRef.current) return;

      try {
        // Convert lng/lat to screen coordinates
        const point = mapRef.current.project(coordinates as [number, number]);

        const popupWidth = 320; // 80 * 4 (w-80)
        // Get actual popup height if available, use cached height to prevent flickering
        const currentHeight = popupRef.current?.offsetHeight;
        if (currentHeight && currentHeight > 0) {
          lastHeightRef.current = currentHeight;
        }
        const popupHeight = lastHeightRef.current;
        
        const arrowSize = 8;
        const margin = 10;
        const markerOffset = 80; // Space for marker

        // Calculate space above and below the point
        const spaceAbove = point.y - margin;
        const spaceBelow = window.innerHeight - point.y - margin;

        let left = point.x - popupWidth / 2;
        let top: number;
        let newArrowPosition: "top" | "bottom";

        // Choose position based on available space
        // Prefer below if there's enough space, otherwise choose the side with more space
        if (spaceBelow >= popupHeight + markerOffset) {
          // Position below - plenty of space
          top = point.y + arrowSize + markerOffset;
          newArrowPosition = "top"; // Arrow points up
        } else if (spaceAbove >= popupHeight + markerOffset) {
          // Position above - enough space
          top = point.y - popupHeight - arrowSize - markerOffset;
          newArrowPosition = "bottom"; // Arrow points down
        } else if (spaceBelow > spaceAbove) {
          // More space below
          top = point.y + arrowSize + markerOffset;
          newArrowPosition = "top";
        } else {
          // More space above
          top = point.y - popupHeight - arrowSize - markerOffset;
          newArrowPosition = "bottom";
        }

        // Adjust horizontal position and calculate arrow offset
        left = Math.max(
          margin,
          Math.min(left, window.innerWidth - popupWidth - margin)
        );

        // Calculate arrow offset as percentage (where arrow should point)
        const targetX = point.x;
        const arrowOffsetPx = Math.max(
          arrowSize,
          Math.min(targetX - left, popupWidth - arrowSize)
        );
        const newArrowOffset = (arrowOffsetPx / popupWidth) * 100;

        const style: React.CSSProperties = {
          position: "absolute",
          left,
          top,
          transform: "none",
          zIndex: 50,
        };

        setPopupStyle(style);
        setArrowPosition(newArrowPosition);
        setArrowOffset(newArrowOffset);
      } catch (error) {
        console.error("Error calculating popup position:", error);
      }
    };

    // Update position initially and after a short delay to get actual height
    updatePosition();
    const timeoutId = setTimeout(updatePosition, 100);

    // Update position when map moves
    const map = mapRef.current;
    map.on("move", updatePosition);
    map.on("zoom", updatePosition);

    return () => {
      clearTimeout(timeoutId);
      map.off("move", updatePosition);
      map.off("zoom", updatePosition);
    };
  }, [mapRef, note, location, place]);

  // Check if route exists when popup opens
  useEffect(() => {
    if (mapRef) {
      const routeExists = hasActiveRoute(mapRef);
      setHasRoute(routeExists);
      console.log("🔍 Route status check:", routeExists);
    }
  }, [mapRef]);

  return (
    <div 
      ref={popupRef} 
      className="w-80 z-20 pointer-events-auto transition-opacity duration-200" 
      style={{
        ...popupStyle,
        opacity: popupStyle.left ? 1 : 0, // Fade in when positioned
      }}
    >
      {/* Smart Arrow - adapts position and direction */}
      {arrowPosition === "bottom" ? (
        // Arrow pointing down (popup above point)
        <div
          className="absolute top-full transform -translate-x-1/2"
          style={{ left: `${arrowOffset}%` }}
        >
          <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-blue-500 filter drop-shadow-sm"></div>
        </div>
      ) : (
        // Arrow pointing up (popup below point)
        <div
          className="absolute bottom-full transform -translate-x-1/2"
          style={{ left: `${arrowOffset}%` }}
        >
          <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-blue-500 filter drop-shadow-sm"></div>
        </div>
      )}

      <Card className="shadow-2xl border border-neutral-800 rounded-xl overflow-hidden bg-[#111111]">
        {/* Header */}
        {isPlace && place?.media && place.media.length > 0 ? (
          <div className="h-36 bg-gradient-to-r from-neutral-800 to-neutral-900 relative overflow-hidden">
            <img
              src={place.media[0].url}
              alt={place.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30"></div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute top-3 right-3 text-white bg-black/50 hover:bg-black/70 rounded-full w-8 h-8 p-0 backdrop-blur-sm border border-neutral-600"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </Button>
          </div>
        ) : (
          <div className="h-16 relative bg-gradient-to-r from-neutral-800 to-neutral-900 px-4 py-3">
            <div className="flex items-center justify-between h-full">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-2xl flex-shrink-0">
                  {isNote
                    ? note?.mood || "📍"
                    : isLocation
                      ? "📍"
                      : place && categoryIcons[place.category]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white truncate">
                    {isNote
                      ? note?.address
                      : isLocation
                        ? location?.address
                        : place?.name}
                  </div>
                  {isNote && note && (
                    <div className="text-xs text-neutral-300">
                      {formatTime(note.timestamp)}
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white bg-black/50 hover:bg-black/70 rounded-full w-8 h-8 p-0 backdrop-blur-sm border border-neutral-600 flex-shrink-0"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            </div>
          </div>
        )}

        <CardHeader className="pb-2 pt-3">
          {isNote ? (
            /* Note Header */
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <BookOpen
                  className="h-4 w-4 text-[#A0A0A0]"
                  strokeWidth={1.5}
                />
                <span className="text-sm text-[#A0A0A0]">Ghi chú địa điểm</span>
              </div>
            </div>
          ) : isLocation ? (
            /* Location Header */
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#A0A0A0]" strokeWidth={1.5} />
                <span className="text-sm text-[#A0A0A0]">Địa điểm mới</span>
              </div>
            </div>
          ) : (
            /* Place Header */
            <div className="space-y-2">
              <CardTitle className="text-xl leading-tight font-bold text-[#EDEDED]">
                {place?.name}
              </CardTitle>

              {/* Rating and Category */}
              <div className="flex items-center gap-3">
                {averageRating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                      strokeWidth={1.5}
                    />
                    <span className="text-sm font-medium text-[#EDEDED]">
                      {averageRating.toFixed(1)}
                    </span>
                    <span className="text-xs text-[#A0A0A0]">
                      ({place?.favorites?.length} đánh giá)
                    </span>
                  </div>
                )}
                {place && (
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${categoryColors[place.category]}`}
                  >
                    {categoryIcons[place.category]} {place.category}
                  </span>
                )}
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-3 pb-4">
          {isNote ? (
            /* Note Content */
            <>
              {/* Note content - main focus */}
              <div className="text-sm text-[#EDEDED] leading-relaxed mb-3">
                {note && note.content}
              </div>

              {/* Images - larger display */}
              {note?.images && note.images.length > 0 && (
                <div className="mb-3">
                  {note.images.length === 1 ? (
                    <div className="w-full h-32 bg-neutral-800 rounded-lg border border-neutral-700 overflow-hidden">
                      {isValidImageUrl(note.images[0]) ? (
                        <ImageDisplay
                          src={note.images[0]}
                          alt="Ảnh ghi chú"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-lg text-[#A0A0A0]">📷</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {note.images.slice(0, 2).map((image, index) => (
                        <div
                          key={index}
                          className="aspect-square bg-neutral-800 rounded-lg border border-neutral-700 overflow-hidden"
                        >
                          {isValidImageUrl(image) ? (
                            <ImageDisplay
                              src={image}
                              alt={`Ảnh ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-lg text-[#A0A0A0]">📷</span>
                            </div>
                          )}
                        </div>
                      ))}
                      {note.images.length > 4 && (
                        <div className="aspect-square bg-neutral-800 rounded-lg border border-neutral-700 flex items-center justify-center">
                          <span className="text-sm text-[#A0A0A0]">
                            +{note.images.length - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Route info display */}
              {routeInfo && (
                <div className="text-xs text-blue-400 text-center mb-3 p-2 bg-blue-900/20 rounded-lg border border-blue-800">
                  📍 {formatDistance(routeInfo.distance)} • ⏱️{" "}
                  {formatDuration(routeInfo.duration)}
                </div>
              )}

              {/* Action buttons for notes - all in one row */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-[#EDEDED] border-neutral-600"
                  onClick={onViewDetails}
                >
                  <Eye className="h-4 w-4 mr-1" strokeWidth={1.5} />
                  Chi tiết
                </Button>

                {hasRoute ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 border-red-800"
                    onClick={handleClearDirections}
                  >
                    <NavigationOff className="h-3 w-3 mr-1" strokeWidth={1.5} />
                    Tắt đường
                  </Button>
                ) : !showRouteOptions ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                    onClick={() =>
                      note &&
                      handleGetDirections(
                        {
                          lat: note.lat,
                          lng: note.lng,
                        },
                        true
                      )
                    }
                    disabled={isGettingDirections}
                  >
                    <Navigation className="h-3 w-3 mr-1" strokeWidth={1.5} />
                    Chỉ đường
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white border-green-600"
                      onClick={() =>
                        note &&
                        handleGetDirections(
                          {
                            lat: note.lat,
                            lng: note.lng,
                          },
                          true
                        )
                      }
                      disabled={isGettingDirections}
                    >
                      <Navigation
                        className={`h-3 w-3 mr-1 ${isGettingDirections ? "animate-spin" : ""}`}
                        strokeWidth={1.5}
                      />
                      Bản đồ
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                      onClick={() =>
                        note &&
                        handleGetDirections(
                          {
                            lat: note.lat,
                            lng: note.lng,
                          },
                          false
                        )
                      }
                      disabled={isGettingDirections}
                    >
                      <Navigation
                        className={`h-3 w-3 mr-1 ${isGettingDirections ? "animate-spin" : ""}`}
                        strokeWidth={1.5}
                      />
                      Mở app
                    </Button>
                  </>
                )}

                {onDelete && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="px-3 bg-neutral-800 hover:bg-red-900/30 text-red-400 border-neutral-600 hover:border-red-800"
                    onClick={onDelete}
                    title="Xóa ghi chú"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                  </Button>
                )}
              </div>
            </>
          ) : isLocation ? (
            /* Location Content */
            <>
              {/* Location address */}
              <div className="flex items-start gap-2 mb-3">
                <MapPin
                  className="h-4 w-4 text-[#A0A0A0] mt-0.5 flex-shrink-0"
                  strokeWidth={1.5}
                />
                <span className="text-sm text-[#EDEDED] break-words leading-relaxed">
                  {location?.address}
                </span>
              </div>

              {/* Coordinates */}
              <div className="text-xs text-[#A0A0A0] mb-3">
                {location?.lat.toFixed(6)}, {location?.lng.toFixed(6)}
              </div>

              {/* Route info display */}
              {routeInfo && (
                <div className="text-xs text-blue-400 text-center mb-3 p-2 bg-blue-900/20 rounded-lg border border-blue-800">
                  📍 {formatDistance(routeInfo.distance)} • ⏱️{" "}
                  {formatDuration(routeInfo.duration)}
                </div>
              )}

              {/* Action buttons for locations */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-[#EDEDED] border-neutral-600"
                  onClick={onAddNote}
                >
                  <PenTool className="h-4 w-4 mr-1" strokeWidth={1.5} />
                  Thêm ghi chú
                </Button>

                {hasRoute ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 border-red-800"
                    onClick={handleClearDirections}
                  >
                    <NavigationOff className="h-3 w-3 mr-1" strokeWidth={1.5} />
                    Tắt đường
                  </Button>
                ) : !showRouteOptions ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                    onClick={() =>
                      location &&
                      handleGetDirections(
                        {
                          lat: location.lat,
                          lng: location.lng,
                        },
                        true
                      )
                    }
                    disabled={isGettingDirections}
                  >
                    <Navigation className="h-3 w-3 mr-1" strokeWidth={1.5} />
                    Chỉ đường
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white border-green-600"
                      onClick={() =>
                        location &&
                        handleGetDirections(
                          {
                            lat: location.lat,
                            lng: location.lng,
                          },
                          true
                        )
                      }
                      disabled={isGettingDirections}
                    >
                      <Navigation
                        className={`h-3 w-3 mr-1 ${isGettingDirections ? "animate-spin" : ""}`}
                        strokeWidth={1.5}
                      />
                      Bản đồ
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                      onClick={() =>
                        location &&
                        handleGetDirections(
                          {
                            lat: location.lat,
                            lng: location.lng,
                          },
                          false
                        )
                      }
                      disabled={isGettingDirections}
                    >
                      <Navigation
                        className={`h-3 w-3 mr-1 ${isGettingDirections ? "animate-spin" : ""}`}
                        strokeWidth={1.5}
                      />
                      Mở app
                    </Button>
                  </>
                )}
              </div>
            </>
          ) : (
            /* Place Content */
            <>
              {/* Address */}
              <div className="flex items-start gap-2 mb-3">
                <MapPin
                  className="h-4 w-4 text-[#A0A0A0] mt-0.5 flex-shrink-0"
                  strokeWidth={1.5}
                />
                <div className="text-sm text-[#EDEDED] leading-relaxed">
                  {place?.address}
                  {place?.district && (
                    <span className="text-[#A0A0A0]">, {place.district}</span>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-3">
                {/* Phone */}
                {place?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone
                      className="h-4 w-4 text-[#A0A0A0]"
                      strokeWidth={1.5}
                    />
                    <a
                      href={`tel:${place.phone}`}
                      className="text-sm text-blue-400 hover:underline"
                    >
                      {place.phone}
                    </a>
                  </div>
                )}

                {/* Website */}
                {place?.website && (
                  <div className="flex items-center gap-2">
                    <Globe
                      className="h-4 w-4 text-[#A0A0A0]"
                      strokeWidth={1.5}
                    />
                    <a
                      href={place.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:underline"
                    >
                      Website
                    </a>
                  </div>
                )}

                {/* Price Level */}
                {place?.priceLevel && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#A0A0A0]">Giá:</span>
                    <span className="text-sm font-medium text-green-400">
                      {"₫".repeat(place.priceLevel)}
                      {"₫"
                        .repeat(4 - place.priceLevel)
                        .split("")
                        .map((_, i) => (
                          <span key={i} className="text-neutral-600">
                            ₫
                          </span>
                        ))}
                    </span>
                  </div>
                )}
              </div>

              {/* Tags */}
              {place?.tags && place.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {place.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full bg-neutral-800 text-xs text-[#A0A0A0] border border-neutral-700"
                    >
                      #{tag.tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Route info display */}
              {routeInfo && (
                <div className="text-xs text-blue-400 text-center mb-3 p-2 bg-blue-900/20 rounded-lg border border-blue-800">
                  📍 {formatDistance(routeInfo.distance)} • ⏱️{" "}
                  {formatDuration(routeInfo.duration)}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-[#EDEDED] border-neutral-600"
                  onClick={
                    onViewDetails ||
                    (() => console.log("View details for place:", place?.name))
                  }
                >
                  <Eye className="h-4 w-4 mr-1" strokeWidth={1.5} />
                  Chi tiết
                </Button>

                {hasRoute ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 border-red-800"
                    onClick={handleClearDirections}
                  >
                    <NavigationOff className="h-3 w-3 mr-1" strokeWidth={1.5} />
                    Tắt đường
                  </Button>
                ) : !showRouteOptions ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                    onClick={() => setShowRouteOptions(true)}
                    disabled={isGettingDirections}
                  >
                    <Navigation className="h-3 w-3 mr-1" strokeWidth={1.5} />
                    Chỉ đường
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white border-green-600"
                      onClick={() =>
                        place &&
                        handleGetDirections(
                          {
                            lat: place.lat,
                            lng: place.lng,
                          },
                          true
                        )
                      }
                      disabled={isGettingDirections}
                    >
                      <Navigation
                        className={`h-3 w-3 mr-1 ${isGettingDirections ? "animate-spin" : ""}`}
                        strokeWidth={1.5}
                      />
                      Bản đồ
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                      onClick={() =>
                        place &&
                        handleGetDirections(
                          {
                            lat: place.lat,
                            lng: place.lng,
                          },
                          false
                        )
                      }
                      disabled={isGettingDirections}
                    >
                      <Navigation
                        className={`h-3 w-3 mr-1 ${isGettingDirections ? "animate-spin" : ""}`}
                        strokeWidth={1.5}
                      />
                      Mở app
                    </Button>
                  </>
                )}

                {onDelete && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="px-3 bg-neutral-800 hover:bg-red-900/30 text-red-400 border-neutral-600 hover:border-red-800"
                    onClick={onDelete}
                    title="Xóa khỏi danh sách"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
