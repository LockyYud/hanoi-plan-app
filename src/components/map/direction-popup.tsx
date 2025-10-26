"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Navigation, Clock, Ruler } from "lucide-react";
import { formatDistance, formatDuration } from "@/lib/geolocation";

interface DirectionPopupProps {
    readonly isVisible: boolean;
    readonly destination?: {
        name: string;
        address: string;
        lat: number;
        lng: number;
    };
    readonly routeInfo?: {
        duration: number;
        distance: number;
    };
    readonly onClose: () => void;
}

export function DirectionPopup({
    isVisible,
    destination,
    routeInfo,
    onClose,
}: DirectionPopupProps) {
    const [isAnimated, setIsAnimated] = useState(false);

    useEffect(() => {
        if (isVisible) {
            // Trigger animation after component mounts
            const timer = setTimeout(() => setIsAnimated(true), 50);
            return () => clearTimeout(timer);
        } else {
            setIsAnimated(false);
        }
    }, [isVisible]);

    if (!isVisible || !destination || !routeInfo) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-40 pointer-events-none">
            {/* Popup - Bottom positioned, enhanced with Pinory colors */}
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 pointer-events-auto px-4 w-full max-w-2xl">
                <Card
                    className={`shadow-2xl border border-neutral-700/50 rounded-2xl overflow-hidden bg-gradient-to-r from-neutral-900/95 via-neutral-800/95 to-neutral-900/95 backdrop-blur-md transition-all duration-300 ${
                        isAnimated
                            ? "translate-y-0 opacity-100"
                            : "translate-y-4 opacity-0"
                    }`}
                >
                    {/* Decorative gradient top bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF6B6B] via-[#FF8E53] to-[#FFD6A5]"></div>

                    <div className="px-4 py-3 relative">
                        <div className="flex items-center gap-4">
                            {/* Icon & Title - Enhanced */}
                            <div className="flex items-center gap-3 flex-shrink-0">
                                <div className="relative p-2.5 bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] rounded-xl shadow-lg">
                                    <Navigation
                                        className="h-5 w-5 text-white"
                                        strokeWidth={2.5}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] rounded-xl blur-md opacity-50 -z-10"></div>
                                </div>
                                <div className="hidden sm:block">
                                    <div className="text-sm font-bold text-[#EDEDED]">
                                        Đang chỉ đường
                                    </div>
                                    <div className="text-xs text-[#A0A0A0] truncate max-w-[150px]">
                                        {destination.name}
                                    </div>
                                </div>
                            </div>

                            {/* Route Stats - Enhanced */}
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                {/* Distance */}
                                <div className="flex items-center gap-2 bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-xl px-3 py-2 border border-green-700/40 shadow-sm">
                                    <Ruler
                                        className="h-4 w-4 text-green-400 flex-shrink-0"
                                        strokeWidth={2.5}
                                    />
                                    <span className="text-sm font-black text-green-400 whitespace-nowrap">
                                        {formatDistance(routeInfo.distance)}
                                    </span>
                                </div>

                                {/* Duration */}
                                <div className="flex items-center gap-2 bg-gradient-to-br from-[#FF8E53]/20 to-[#FFD6A5]/20 rounded-xl px-3 py-2 border border-[#FF8E53]/40 shadow-sm">
                                    <Clock
                                        className="h-4 w-4 text-[#FFD6A5] flex-shrink-0"
                                        strokeWidth={2.5}
                                    />
                                    <span className="text-sm font-black text-[#FFD6A5] whitespace-nowrap">
                                        {formatDuration(routeInfo.duration)}
                                    </span>
                                </div>

                                {/* Status indicator - Enhanced */}
                                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-[#FF6B6B]/10 rounded-lg border border-[#FF6B6B]/30">
                                    <div className="w-2 h-2 bg-[#FF6B6B] rounded-full animate-pulse"></div>
                                    <span className="text-xs text-[#FF6B6B] font-semibold">
                                        Hoạt động
                                    </span>
                                </div>
                            </div>

                            {/* Close Button - Enhanced */}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClose}
                                className="text-white bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-full w-9 h-9 p-0 flex-shrink-0 border-2 border-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                                title="Tắt chỉ đường"
                            >
                                <X className="h-4 w-4" strokeWidth={2.5} />
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
