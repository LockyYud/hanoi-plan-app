"use client";

import { Button } from "@/components/ui/button";
import { UserCircle2, MapPin, Star, Calendar, Eye, X } from "lucide-react";
import Image from "next/image";
import type { Pinory } from "@/lib/types";
import { PopupBase } from "@/components/pinory/base/popup-base";

interface FriendLocationPopupProps {
    readonly pinory: Pinory;
    readonly onClose: () => void;
    readonly onViewDetails?: () => void;
    readonly mapRef?: React.RefObject<any>;
}

export function FriendLocationPopup({
    pinory,
    onClose,
    onViewDetails,
    mapRef,
}: FriendLocationPopupProps) {
    const place = pinory;
    const user = place.creator;
    const { rating, note, visitDate } = place;

    // API returns 'images' array or 'media' array
    const images =
        (place as any).images || place.media?.map((m) => m.url) || [];

    if (!user) {
        return null;
    }

    return (
        <PopupBase
            coordinates={{ lng: place.lng, lat: place.lat }}
            mapRef={mapRef}
            variant="friend"
            popupWidth={320}
        >
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
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground rounded-full w-8 h-8 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Place Info */}
                <div>
                    <h3 className="font-semibold text-lg mb-1">{place.name}</h3>
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
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-700/30">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            &quot;{note}&quot;
                        </p>
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
                    {onViewDetails && (
                        <Button
                            size="sm"
                            onClick={onViewDetails}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClose}
                        className="border-purple-700/50 hover:bg-purple-900/30"
                    >
                        <X className="w-4 h-4 mr-1" />
                        Close
                    </Button>
                </div>
            </div>
        </PopupBase>
    );
}
