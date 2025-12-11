"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShareDialog } from "@/components/sharing/share-dialog";
import {
    Clock,
    MapPin,
    DollarSign,
    Route,
    Star,
    Edit,
    Share2,
    CheckCircle,
} from "lucide-react";
import { formatTime, formatPrice, formatDuration } from "@/lib/utils";

interface ItineraryStop {
    id: string;
    seq: number;
    place: {
        id: string;
        name: string;
        category: string;
        rating: number;
        priceLevel: number;
    };
    arriveTime: string;
    departTime: string;
    travelMinutes: number;
}

interface Itinerary {
    id: string;
    title: string;
    score: number;
    totalDuration: number;
    totalBudget: number;
    totalDistance: number;
    stops: ItineraryStop[];
    rationale: string;
}

interface ItineraryCardProps {
    itinerary: Itinerary;
    onSelect?: () => void;
    onEdit?: () => void;
    onShare?: () => void;
    isSelected?: boolean;
    rank?: number;
}

export function ItineraryCard({
    itinerary,
    onSelect,
    onEdit,
    onShare,
    isSelected = false,
    rank,
}: ItineraryCardProps) {
    const [showShareDialog, setShowShareDialog] = useState(false);
    const categoryIcons = {
        cafe: "☕",
        food: "🍜",
        bar: "🍻",
        rooftop: "🏙️",
        activity: "🎯",
        landmark: "🏛️",
    };

    const getRankBadge = () => {
        if (!rank) return null;

        const colors = {
            1: "bg-yellow-100 text-yellow-800 border-yellow-300",
            2: "bg-gray-100 text-gray-700 border-gray-300",
            3: "bg-orange-100 text-orange-700 border-orange-300",
        };

        const labels = {
            1: "🥇 Best",
            2: "🥈 Great",
            3: "🥉 Good",
        };

        return (
            <Badge className={`${colors[rank as keyof typeof colors]} border`}>
                {labels[rank as keyof typeof labels]}
            </Badge>
        );
    };

    return (
        <Card
            className={`transition-all ${isSelected ? "ring-2 ring-blue-500 shadow-lg" : "hover:shadow-md"}`}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">
                                {itinerary.title}
                            </CardTitle>
                            {getRankBadge()}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span>
                                    {(itinerary.score * 100).toFixed(0)}% phù
                                    hợp
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>
                                    {formatDuration(itinerary.totalDuration)}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Route className="h-4 w-4" />
                                <span>{itinerary.totalDistance}km</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Budget Overview */}
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                        Ước tính: {formatPrice(itinerary.totalBudget)}/người
                    </span>
                </div>

                {/* Stops Timeline */}
                <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Lộ trình chi tiết ({itinerary.stops.length} điểm)
                    </h4>

                    <div className="space-y-2">
                        {itinerary.stops.map((stop, index) => (
                            <div
                                key={stop.id}
                                className="flex items-center gap-3 p-2 rounded-lg bg-gray-50"
                            >
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-medium flex items-center justify-center">
                                    {stop.seq}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium truncate">
                                            {stop.place.name}
                                        </span>
                                        <span className="text-xs">
                                            {
                                                categoryIcons[
                                                    stop.place
                                                        .category as keyof typeof categoryIcons
                                                ]
                                            }
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <Star className="h-3 w-3 text-yellow-500" />
                                            <span className="text-xs">
                                                {stop.place.rating}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span>
                                            {formatTime(
                                                new Date(stop.arriveTime)
                                            )}
                                        </span>
                                        <span>-</span>
                                        <span>
                                            {formatTime(
                                                new Date(stop.departTime)
                                            )}
                                        </span>
                                        {stop.travelMinutes > 0 && (
                                            <span className="ml-2 text-blue-600">
                                                ({stop.travelMinutes}m di
                                                chuyển)
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Rationale */}
                <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                        {itinerary.rationale}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                    <Button
                        onClick={onSelect}
                        className="flex-1"
                        variant={isSelected ? "default" : "outline"}
                    >
                        {isSelected ? (
                            <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Đã chọn
                            </>
                        ) : (
                            "Select this route"
                        )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={onEdit}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowShareDialog(true)}
                    >
                        <Share2 className="h-4 w-4" />
                    </Button>
                </div>

                <ShareDialog
                    open={showShareDialog}
                    onOpenChange={setShowShareDialog}
                    itinerary={{
                        id: itinerary.id,
                        title: itinerary.title,
                        stops: itinerary.stops.map((stop) => ({
                            ...stop.place,
                            time: `${formatTime(new Date(stop.arriveTime))} - ${formatTime(new Date(stop.departTime))}`,
                            address: stop.place.address || "Unknown",
                            lat: stop.place.lat || 21.0285,
                            lng: stop.place.lng || 105.8542,
                        })),
                    }}
                />
            </CardContent>
        </Card>
    );
}
