"use client";

import { useState, useEffect, useRef } from "react";
import { Place } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserCircle2, MapPin, Star, Calendar, Heart } from "lucide-react";
import Image from "next/image";

interface FriendLocationPopupProps {
    readonly locationNote: Place;
    readonly onClose: () => void;
    readonly onAddToFavorites?: () => void;
    readonly mapRef?: React.RefObject<mapboxgl.Map>;
}

export function FriendLocationPopup({
    locationNote,
    onClose,
    onAddToFavorites,
    mapRef,
}: FriendLocationPopupProps) {
    const place = locationNote;
    const user = place.creator;
    const { rating, note, visitDate } = place;

    // API returns 'images' array or 'media' array
    const images =
        (place as any).images || place.media?.map((m) => m.url) || [];

    // Dynamic positioning
    const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
    const [arrowPosition, setArrowPosition] = useState<"top" | "bottom">(
        "bottom"
    );
    const [arrowOffset, setArrowOffset] = useState(50);
    const popupRef = useRef<HTMLDivElement>(null);
    const lastHeightRef = useRef<number>(280);

    useEffect(() => {
        if (!mapRef?.current) return;

        const coordinates = [place.lng, place.lat];

        const updatePosition = () => {
            if (!mapRef.current) return;

            try {
                const point = mapRef.current.project(
                    coordinates as [number, number]
                );
                const popupWidth = 320;
                const currentHeight = popupRef.current?.offsetHeight;
                if (currentHeight && currentHeight > 0) {
                    lastHeightRef.current = currentHeight;
                }
                const popupHeight = lastHeightRef.current;
                const arrowSize = 8;
                const margin = 10;
                const markerOffset = 80;

                const spaceAbove = point.y - margin;
                const spaceBelow = window.innerHeight - point.y - margin;

                let left = point.x - popupWidth / 2;
                let top: number;
                let newArrowPosition: "top" | "bottom";

                if (spaceBelow >= popupHeight + markerOffset) {
                    top = point.y + arrowSize + markerOffset;
                    newArrowPosition = "top";
                } else if (spaceAbove >= popupHeight + markerOffset) {
                    top = point.y - popupHeight - arrowSize - markerOffset;
                    newArrowPosition = "bottom";
                } else if (spaceBelow > spaceAbove) {
                    top = point.y + arrowSize + markerOffset;
                    newArrowPosition = "top";
                } else {
                    top = point.y - popupHeight - arrowSize - markerOffset;
                    newArrowPosition = "bottom";
                }

                left = Math.max(
                    margin,
                    Math.min(left, window.innerWidth - popupWidth - margin)
                );

                const targetX = point.x;
                const arrowOffsetPx = Math.max(
                    arrowSize,
                    Math.min(targetX - left, popupWidth - arrowSize)
                );
                const newArrowOffset = (arrowOffsetPx / popupWidth) * 100;

                setPopupStyle({
                    position: "absolute",
                    left,
                    top,
                    transform: "none",
                    zIndex: 50,
                });
                setArrowPosition(newArrowPosition);
                setArrowOffset(newArrowOffset);
            } catch (error) {
                console.error("Error calculating popup position:", error);
            }
        };

        updatePosition();
        const timeoutId = setTimeout(updatePosition, 100);

        const map = mapRef.current;
        map.on("move", updatePosition);
        map.on("zoom", updatePosition);

        return () => {
            clearTimeout(timeoutId);
            map.off("move", updatePosition);
            map.off("zoom", updatePosition);
        };
    }, [mapRef, place]);

    if (!user) {
        return null;
    }

    return (
        <div
            ref={popupRef}
            className="w-80 z-20 pointer-events-none transition-opacity duration-200"
            style={{
                ...popupStyle,
                opacity: popupStyle.left ? 1 : 0,
            }}
        >
            {/* Arrow */}
            {arrowPosition === "bottom" ? (
                <div
                    className="absolute top-full transform -translate-x-1/2"
                    style={{ left: `${arrowOffset}%` }}
                >
                    <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-purple-600 filter drop-shadow-sm"></div>
                </div>
            ) : (
                <div
                    className="absolute bottom-full transform -translate-x-1/2"
                    style={{ left: `${arrowOffset}%` }}
                >
                    <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-purple-600 filter drop-shadow-sm"></div>
                </div>
            )}

            <Card className="shadow-2xl border border-purple-700/50 rounded-2xl overflow-hidden bg-gradient-to-br from-neutral-900/95 to-neutral-800/95 backdrop-blur-md pointer-events-auto">
                <div className="p-4 space-y-3">
                    {/* Header with Friend Info */}
                    <div className="flex items-center gap-2 pb-3 border-b">
                        <div className="flex-shrink-0">
                            {user.avatarUrl ? (
                                <Image
                                    src={user.avatarUrl}
                                    alt={user.name || user.email}
                                    width={32}
                                    height={32}
                                    className="rounded-full"
                                />
                            ) : (
                                <UserCircle2 className="w-8 h-8 text-gray-400" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-purple-600">
                                {user.name || user.email}
                            </p>
                            <p className="text-xs text-gray-500">
                                Shared this location
                            </p>
                        </div>
                    </div>

                    {/* Place Info */}
                    <div>
                        <h3 className="font-semibold text-lg mb-1">
                            {place.name}
                        </h3>
                        <p className="text-sm text-gray-600 flex items-start gap-1">
                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{place.address}</span>
                        </p>
                    </div>

                    {/* Rating */}
                    {rating && (
                        <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-medium">{rating}/5</span>
                        </div>
                    )}

                    {/* Note */}
                    {note && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-700">"{note}"</p>
                        </div>
                    )}

                    {/* Visit Date */}
                    {visitDate && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>
                                Visited on{" "}
                                {new Date(visitDate).toLocaleDateString()}
                            </span>
                        </div>
                    )}

                    {/* Photos */}
                    {images.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                            {images.slice(0, 3).map((imageUrl: string) => (
                                <div
                                    key={imageUrl}
                                    className="relative aspect-square rounded-lg overflow-hidden"
                                >
                                    <Image
                                        src={imageUrl}
                                        alt="Location photo"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-purple-700/30">
                        <Button
                            variant="default"
                            size="sm"
                            className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                            onClick={onAddToFavorites}
                        >
                            <Heart className="h-4 w-4 mr-1" />
                            Add to Favorites
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                            className="border-purple-700/50 hover:bg-purple-900/30"
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
