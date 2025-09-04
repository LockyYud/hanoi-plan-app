"use client";

import { Place } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, MapPin, Clock, Phone, Globe, Star, Tag } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface PlaceMarkerProps {
    place: Place;
    onClose: () => void;
}

export function PlaceMarker({ place, onClose }: PlaceMarkerProps) {
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

    return (
        <div className="absolute top-4 left-4 w-80 z-20 pointer-events-auto">
            <Card className="shadow-lg">
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <CardTitle className="text-lg leading-tight">
                                {place.name}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                                <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${categoryColors[place.category]}`}
                                >
                                    {categoryIcons[place.category]}{" "}
                                    {place.category}
                                </span>
                                {place.priceLevel && (
                                    <span className="text-sm text-gray-500">
                                        {"₫".repeat(place.priceLevel)}
                                    </span>
                                )}
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="h-8 w-8 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-gray-600">
                            <div>{place.address}</div>
                            {place.ward && place.district && (
                                <div className="text-xs text-gray-500">
                                    {place.ward}, {place.district}
                                </div>
                            )}
                        </div>
                    </div>

                    {place.openHours && (
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                                Xem giờ mở cửa
                            </span>
                        </div>
                    )}

                    {place.phone && (
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                                {place.phone}
                            </span>
                        </div>
                    )}

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

                    {place.tags && place.tags.length > 0 && (
                        <div className="flex items-start gap-2">
                            <Tag className="h-4 w-4 text-gray-500 mt-0.5" />
                            <div className="flex flex-wrap gap-1">
                                {place.tags.slice(0, 4).map((tag) => (
                                    <span
                                        key={tag.id}
                                        className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                    >
                                        {tag.tag}
                                    </span>
                                ))}
                                {place.tags.length > 4 && (
                                    <span className="text-xs text-gray-500">
                                        +{place.tags.length - 4} more
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2 pt-2">
                        <Button size="sm" className="flex-1">
                            <Star className="h-4 w-4 mr-1" />
                            Yêu thích
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                            Chi tiết
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
