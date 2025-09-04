"use client";

import { useState, useEffect } from "react";
import { Place } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    X,
    MapPin,
    Clock,
    Phone,
    Globe,
    Star,
    Navigation,
    Heart,
    Eye,
    BookOpen,
    Plus,
    PenTool,
} from "lucide-react";

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
    place?: Place;
    note?: LocationNote;
    location?: LocationPreview; // For location preview
    onClose: () => void;
    onViewDetails?: () => void; // For notes
    onAddNote?: () => void; // For locations
    mapRef?: React.RefObject<mapboxgl.Map>; // Pass map reference for dynamic positioning
}

export function PlacePopup({
    place,
    note,
    location,
    onClose,
    onViewDetails,
    onAddNote,
    mapRef,
}: PlacePopupProps) {
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
        cafe: "bg-amber-100 text-amber-800",
        food: "bg-red-100 text-red-800",
        bar: "bg-purple-100 text-purple-800",
        rooftop: "bg-blue-100 text-blue-800",
        activity: "bg-green-100 text-green-800",
        landmark: "bg-gray-100 text-gray-800",
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

    const truncateText = (text: string, maxLength: number = 80) => {
        return text.length > maxLength
            ? text.substring(0, maxLength) + "..."
            : text;
    };

    // Dynamic positioning with smart arrow placement
    const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
    const [arrowPosition, setArrowPosition] = useState<"top" | "bottom">(
        "bottom"
    );
    const [arrowOffset, setArrowOffset] = useState(50); // Percentage from left

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
                const point = mapRef.current.project(coordinates);

                const popupWidth = 320; // 80 * 4 (w-80)
                const popupHeight = 280; // Estimated popup height
                const arrowSize = 8;
                const margin = 10;

                // Calculate optimal positioning
                let left = point.x - popupWidth / 2;
                let top = point.y - popupHeight - arrowSize - 10; // Above point by default
                let newArrowPosition: "top" | "bottom" = "bottom"; // Arrow points down by default

                // Adjust horizontal position and calculate arrow offset
                const originalLeft = left;
                left = Math.max(
                    margin,
                    Math.min(left, window.innerWidth - popupWidth - margin)
                );

                // Calculate arrow offset as percentage (where arrow should point)
                const targetX = point.x;
                const popupLeftBoundary = left;
                const popupRightBoundary = left + popupWidth;
                const arrowOffsetPx = Math.max(
                    arrowSize,
                    Math.min(
                        targetX - popupLeftBoundary,
                        popupWidth - arrowSize
                    )
                );
                const newArrowOffset = (arrowOffsetPx / popupWidth) * 100;

                // Check if popup should be below the point instead
                if (top < margin) {
                    top = point.y + arrowSize + 10; // Below point
                    newArrowPosition = "top"; // Arrow points up

                    // Double check if it fits below
                    if (top + popupHeight > window.innerHeight - margin) {
                        // If it doesn't fit below either, position at top with space
                        top = margin;
                        newArrowPosition = "bottom";
                    }
                }

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

        // Update position initially
        updatePosition();

        // Update position when map moves
        const map = mapRef.current;
        map.on("move", updatePosition);
        map.on("zoom", updatePosition);

        return () => {
            map.off("move", updatePosition);
            map.off("zoom", updatePosition);
        };
    }, [mapRef, note, location, place]);

    return (
        <div className="w-80 z-20 pointer-events-auto" style={popupStyle}>
            {/* Smart Arrow - adapts position and direction */}
            {arrowPosition === "bottom" ? (
                // Arrow pointing down (popup above point)
                <div
                    className="absolute top-full transform -translate-x-1/2"
                    style={{ left: `${arrowOffset}%` }}
                >
                    <div
                        className={`w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent ${
                            isNote
                                ? "border-t-green-500"
                                : isLocation
                                  ? "border-t-orange-500"
                                  : "border-t-white"
                        } filter drop-shadow-sm`}
                    ></div>
                </div>
            ) : (
                // Arrow pointing up (popup below point)
                <div
                    className="absolute bottom-full transform -translate-x-1/2"
                    style={{ left: `${arrowOffset}%` }}
                >
                    <div
                        className={`w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent ${
                            isNote
                                ? "border-b-green-500"
                                : isLocation
                                  ? "border-b-orange-500"
                                  : "border-b-white"
                        } filter drop-shadow-sm`}
                    ></div>
                </div>
            )}

            <Card
                className={`shadow-2xl border-0 rounded-xl overflow-hidden ${
                    isNote
                        ? "bg-green-500 text-white"
                        : isLocation
                          ? "bg-orange-500 text-white"
                          : "bg-white"
                }`}
            >
                {/* Header */}
                {isPlace && place?.media && place.media.length > 0 ? (
                    <div className="h-36 bg-gradient-to-r from-blue-400 to-blue-600 relative overflow-hidden">
                        <img
                            src={place.media[0].url}
                            alt={place.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20"></div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="absolute top-3 right-3 text-white bg-black/30 hover:bg-black/50 rounded-full w-8 h-8 p-0 backdrop-blur-sm"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div
                        className={`h-20 relative ${
                            isNote
                                ? "bg-gradient-to-r from-green-400 to-green-600"
                                : isLocation
                                  ? "bg-gradient-to-r from-orange-400 to-orange-600"
                                  : "bg-gradient-to-r from-blue-400 to-blue-600"
                        }`}
                    >
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-4xl">
                                {isNote
                                    ? note?.mood || "📝"
                                    : isLocation
                                      ? "📍"
                                      : place && categoryIcons[place.category]}
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="absolute top-3 right-3 text-white bg-black/30 hover:bg-black/50 rounded-full w-8 h-8 p-0 backdrop-blur-sm"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                <CardHeader className="pb-2 pt-3">
                    {isNote ? (
                        /* Note Header */
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-green-100" />
                                <span className="text-sm text-green-100">
                                    Ghi chú địa điểm
                                </span>
                                <div className="flex items-center gap-1 text-green-100 text-xs ml-auto">
                                    <Clock className="h-3 w-3" />
                                    {note && formatTime(note.timestamp)}
                                </div>
                            </div>
                        </div>
                    ) : isLocation ? (
                        /* Location Header */
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-orange-100" />
                                <span className="text-sm text-orange-100">
                                    Địa điểm mới
                                </span>
                            </div>
                        </div>
                    ) : (
                        /* Place Header */
                        <div className="space-y-2">
                            <CardTitle className="text-xl leading-tight font-bold text-gray-900">
                                {place?.name}
                            </CardTitle>

                            {/* Rating and Category */}
                            <div className="flex items-center gap-3">
                                {averageRating > 0 && (
                                    <div className="flex items-center gap-1">
                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        <span className="text-sm font-medium text-gray-700">
                                            {averageRating.toFixed(1)}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            ({place?.favorites?.length} đánh
                                            giá)
                                        </span>
                                    </div>
                                )}
                                {place && (
                                    <span
                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryColors[place.category]}`}
                                    >
                                        {categoryIcons[place.category]}{" "}
                                        {place.category}
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
                            {/* Location */}
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-green-100 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-green-100 break-words">
                                    {note && truncateText(note.address, 45)}
                                </span>
                            </div>

                            {/* Note content preview */}
                            <div className="text-sm text-green-50 line-clamp-2 leading-tight">
                                {note && truncateText(note.content, 80)}
                            </div>

                            {/* Images preview */}
                            {note?.images && note.images.length > 0 && (
                                <div className="flex gap-1">
                                    {note.images
                                        .slice(0, 3)
                                        .map((image, index) => (
                                            <div
                                                key={index}
                                                className="w-8 h-8 bg-white/20 rounded border border-white/30 flex items-center justify-center"
                                            >
                                                <span className="text-xs">
                                                    📷
                                                </span>
                                            </div>
                                        ))}
                                    {note.images.length > 3 && (
                                        <div className="w-8 h-8 bg-white/20 rounded border border-white/30 flex items-center justify-center">
                                            <span className="text-xs">
                                                +{note.images.length - 3}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* View details button */}
                            <Button
                                onClick={onViewDetails}
                                className="w-full bg-white text-green-600 hover:bg-green-50 text-sm h-8"
                            >
                                <Eye className="h-3 w-3 mr-1" />
                                Xem chi tiết
                            </Button>
                        </>
                    ) : isLocation ? (
                        /* Location Content */
                        <>
                            {/* Location address */}
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-orange-100 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-orange-100 break-words leading-relaxed">
                                    {location?.address}
                                </span>
                            </div>

                            {/* Coordinates */}
                            <div className="text-xs text-orange-200">
                                {location?.lat.toFixed(6)},{" "}
                                {location?.lng.toFixed(6)}
                            </div>

                            {/* Add note button */}
                            <Button
                                onClick={onAddNote}
                                className="w-full bg-white text-orange-600 hover:bg-orange-50 text-sm h-9"
                            >
                                <PenTool className="h-4 w-4 mr-2" />
                                Thêm ghi chú tại đây
                            </Button>
                        </>
                    ) : (
                        /* Place Content */
                        <>
                            {/* Address */}
                            <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-gray-600 leading-relaxed">
                                    {place?.address}
                                    {place?.district && (
                                        <span className="text-gray-500">
                                            , {place.district}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Phone */}
                            {place?.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-gray-500" />
                                    <a
                                        href={`tel:${place.phone}`}
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        {place.phone}
                                    </a>
                                </div>
                            )}

                            {/* Website */}
                            {place?.website && (
                                <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-gray-500" />
                                    <a
                                        href={place.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:underline"
                                    >
                                        Website
                                    </a>
                                </div>
                            )}

                            {/* Price Level */}
                            {place?.priceLevel && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">
                                        Giá:
                                    </span>
                                    <span className="text-sm font-medium text-green-600">
                                        {"₫".repeat(place.priceLevel)}
                                        {"₫"
                                            .repeat(4 - place.priceLevel)
                                            .split("")
                                            .map((_, i) => (
                                                <span
                                                    key={i}
                                                    className="text-gray-300"
                                                >
                                                    ₫
                                                </span>
                                            ))}
                                    </span>
                                </div>
                            )}

                            {/* Tags */}
                            {place?.tags && place.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-3">
                                    {place.tags
                                        .slice(0, 3)
                                        .map((tag, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs text-gray-700"
                                            >
                                                #{tag.tag}
                                            </span>
                                        ))}
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-2 pt-3">
                                <Button
                                    size="sm"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    onClick={() =>
                                        place &&
                                        window.open(
                                            `https://maps.google.com/dir/?api=1&destination=${place.lat},${place.lng}`,
                                            "_blank"
                                        )
                                    }
                                >
                                    <Navigation className="h-4 w-4 mr-1" />
                                    Chỉ đường
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="px-3"
                                >
                                    <Heart className="h-4 w-4" />
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
