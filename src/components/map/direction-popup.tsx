"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, Navigation, MapPin, Clock, Ruler } from "lucide-react";
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
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/20 transition-opacity duration-300 ${
          isAnimated ? "opacity-100" : "opacity-0"
        }`}
      />
      
      {/* Popup */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
        <Card 
          className={`w-80 shadow-2xl border border-neutral-700 rounded-xl overflow-hidden bg-[#111111] transition-all duration-300 ${
            isAnimated ? "translate-y-0 opacity-100 scale-100" : "-translate-y-4 opacity-0 scale-95"
          }`}
        >
          {/* Header */}
          <div className="h-16 relative bg-gradient-to-r from-blue-800 to-blue-900 px-4 py-3">
            <div className="flex items-center justify-between h-full">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                  <Navigation className="h-5 w-5 text-white" strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white">
                    Đang chỉ đường
                  </div>
                  <div className="text-xs text-blue-200">
                    Tới {destination.name}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white bg-black/30 hover:bg-black/50 rounded-full w-8 h-8 p-0 backdrop-blur-sm border border-white/20 flex-shrink-0"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            </div>
          </div>

          <CardContent className="p-4 space-y-4">
            {/* Destination Info */}
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#EDEDED] truncate">
                    {destination.name}
                  </div>
                  <div className="text-xs text-[#A0A0A0] break-words leading-relaxed">
                    {destination.address}
                  </div>
                </div>
              </div>
            </div>

            {/* Route Stats */}
            <div className="grid grid-cols-2 gap-3">
              {/* Distance */}
              <div className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-700">
                <div className="flex items-center gap-2 mb-1">
                  <Ruler className="h-4 w-4 text-green-400" strokeWidth={1.5} />
                  <span className="text-xs text-[#A0A0A0]">Khoảng cách</span>
                </div>
                <div className="text-lg font-bold text-green-400">
                  {formatDistance(routeInfo.distance)}
                </div>
              </div>

              {/* Duration */}
              <div className="bg-neutral-800/50 rounded-lg p-3 border border-neutral-700">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-orange-400" strokeWidth={1.5} />
                  <span className="text-xs text-[#A0A0A0]">Thời gian</span>
                </div>
                <div className="text-lg font-bold text-orange-400">
                  {formatDuration(routeInfo.duration)}
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-blue-900/30 text-blue-400 rounded-lg border border-blue-800">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Đường đi đang được hiển thị trên bản đồ</span>
              </div>
            </div>

            {/* Action Button */}
            <Button
              onClick={onClose}
              className="w-full bg-red-600 hover:bg-red-700 text-white border-none"
            >
              <X className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Tắt chỉ đường
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}