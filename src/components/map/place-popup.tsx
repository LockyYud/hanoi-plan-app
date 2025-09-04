"use client";

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
} from "lucide-react";

interface PlacePopupProps {
    place: Place;
    onClose: () => void;
}

export function PlacePopup({ place, onClose }: PlacePopupProps) {
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

    const averageRating = place.favorites?.length
        ? place.favorites.reduce((sum, fav) => sum + (fav.rating || 0), 0) /
          place.favorites.length
        : 0;

    return (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-80 z-20 pointer-events-auto">
            {/* Popup Arrow */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white filter drop-shadow-sm"></div>
            </div>

            <Card className="shadow-2xl border-0 bg-white rounded-xl overflow-hidden">
                {/* Header với ảnh nếu có */}
                {place.media && place.media.length > 0 ? (
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
                    <div className="h-20 bg-gradient-to-r from-blue-400 to-blue-600 relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-4xl">
                                {categoryIcons[place.category]}
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

                <CardHeader className="pb-3 pt-4">
                    <div className="space-y-2">
                        <CardTitle className="text-xl leading-tight font-bold text-gray-900">
                            {place.name}
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
                                        ({place.favorites?.length} đánh giá)
                                    </span>
                                </div>
                            )}
                            <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryColors[place.category]}`}
                            >
                                {categoryIcons[place.category]} {place.category}
                            </span>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-3 pb-4">
                    {/* Address */}
                    <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-gray-600 leading-relaxed">
                            {place.address}
                            {place.district && (
                                <span className="text-gray-500">
                                    , {place.district}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Phone */}
                    {place.phone && (
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
                    {place.website && (
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
                    {place.priceLevel && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Giá:</span>
                            <span className="text-sm font-medium text-green-600">
                                {"₫".repeat(place.priceLevel)}
                                {"₫"
                                    .repeat(4 - place.priceLevel)
                                    .split("")
                                    .map((_, i) => (
                                        <span key={i} className="text-gray-300">
                                            ₫
                                        </span>
                                    ))}
                            </span>
                        </div>
                    )}

                    {/* Tags */}
                    {place.tags && place.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                            {place.tags.slice(0, 3).map((tag, index) => (
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
                                window.open(
                                    `https://maps.google.com/dir/?api=1&destination=${place.lat},${place.lng}`,
                                    "_blank"
                                )
                            }
                        >
                            <Navigation className="h-4 w-4 mr-1" />
                            Chỉ đường
                        </Button>
                        <Button size="sm" variant="outline" className="px-3">
                            <Heart className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
