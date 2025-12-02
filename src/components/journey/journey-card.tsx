"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    MapPin,
    Calendar,
    Eye,
    Edit,
    Trash2,
    Map as MapIcon,
} from "lucide-react";
import { Journey } from "@/lib/types";

interface JourneyCardProps {
    readonly journey: Journey;
    readonly onView: (journey: Journey) => void;
    readonly onEdit: (journey: Journey) => void;
    readonly onDelete: (journey: Journey) => void;
    readonly onShowOnMap: (journey: Journey) => void;
}

export function JourneyCard({
    journey,
    onView,
    onEdit,
    onDelete,
    onShowOnMap,
}: JourneyCardProps) {
    const formatDate = (date?: Date) => {
        if (!date) return null;
        return new Intl.DateTimeFormat("vi-VN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        }).format(new Date(date));
    };

    const coverImage =
        journey.coverImage || journey.stops[0]?.place?.media?.[0]?.url || null;

    return (
        <Card className="group relative p-3 sm:p-4 bg-card/70 border border-border/70 hover:border-brand/40 hover:shadow-xl hover:shadow-brand/10 transition-all duration-300 cursor-pointer rounded-2xl overflow-hidden hover:scale-[1.02]">
            {/* Hover gradient effect */}
            <div className="absolute inset-0 bg-brand/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="relative flex gap-2.5 sm:gap-4">
                {/* Cover Image */}
                {coverImage && (
                    <div className="flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={coverImage}
                            alt={journey.title}
                            className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl object-cover"
                        />
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base md:text-lg font-bold text-foreground mb-1.5 sm:mb-2 truncate group-hover:text-brand transition-colors duration-200">
                        {journey.title}
                    </h3>

                    {journey.description && (
                        <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-2">
                            {journey.description}
                        </p>
                    )}

                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                        <Badge
                            variant="outline"
                            className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-brand/20 text-brand border-brand/30 rounded-lg font-semibold text-[10px] sm:text-xs"
                        >
                            <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                            {journey.stops.length} địa điểm
                        </Badge>

                        {journey.startDate && journey.endDate && (
                            <Badge
                                variant="outline"
                                className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-secondary border-border text-foreground rounded-lg text-[10px] sm:text-xs hidden xs:flex items-center"
                            >
                                <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1" />
                                <span className="hidden sm:inline">
                                    {formatDate(journey.startDate)} -{" "}
                                    {formatDate(journey.endDate)}
                                </span>
                                <span className="sm:hidden">
                                    {new Date(
                                        journey.startDate
                                    ).toLocaleDateString("vi-VN", {
                                        month: "short",
                                        day: "numeric",
                                    })}
                                </span>
                            </Badge>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 sm:h-8 px-2 sm:px-3 text-[10px] sm:text-xs bg-brand hover:bg-brand-hover text-white border-0 flex-shrink-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                onShowOnMap(journey);
                            }}
                        >
                            <MapIcon className="h-3 w-3 sm:mr-1" />
                            <span className="hidden sm:inline">
                                Xem trên map
                            </span>
                        </Button>

                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent flex-shrink-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                onView(journey);
                            }}
                            title="Xem chi tiết"
                        >
                            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>

                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-900/30 flex-shrink-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(journey);
                            }}
                            title="Chỉnh sửa"
                        >
                            <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>

                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/30 flex-shrink-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (
                                    confirm(
                                        "Bạn có chắc muốn xóa hành trình này?"
                                    )
                                ) {
                                    onDelete(journey);
                                }
                            }}
                            title="Xóa"
                        >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
}
