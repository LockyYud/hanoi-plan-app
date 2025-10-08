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
      {/* Popup - Bottom positioned, horizontal layout */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 pointer-events-auto px-4 w-full max-w-2xl">
        <Card 
          className={`shadow-2xl border border-neutral-600 rounded-2xl overflow-hidden bg-[#1a1a1a]/95 backdrop-blur-md transition-all duration-300 ${
            isAnimated ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <div className="px-4 py-3">
            <div className="flex items-center gap-4">
              {/* Icon & Title */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="p-2 bg-blue-600 rounded-full">
                  <Navigation className="h-4 w-4 text-white" strokeWidth={2} />
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-semibold text-white">
                    Đang chỉ đường
                  </div>
                  <div className="text-xs text-neutral-400 truncate max-w-[150px]">
                    {destination.name}
                  </div>
                </div>
              </div>

              {/* Route Stats - Horizontal */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Distance */}
                <div className="flex items-center gap-2 bg-neutral-800/50 rounded-lg px-3 py-1.5 border border-neutral-700">
                  <Ruler className="h-3.5 w-3.5 text-green-400 flex-shrink-0" strokeWidth={2} />
                  <span className="text-sm font-bold text-green-400 whitespace-nowrap">
                    {formatDistance(routeInfo.distance)}
                  </span>
                </div>

                {/* Duration */}
                <div className="flex items-center gap-2 bg-neutral-800/50 rounded-lg px-3 py-1.5 border border-neutral-700">
                  <Clock className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" strokeWidth={2} />
                  <span className="text-sm font-bold text-orange-400 whitespace-nowrap">
                    {formatDuration(routeInfo.duration)}
                  </span>
                </div>

                {/* Status indicator */}
                <div className="hidden md:flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-blue-400">Đang hiển thị</span>
                </div>
              </div>

              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white bg-red-600/80 hover:bg-red-600 rounded-full w-8 h-8 p-0 flex-shrink-0 border-none"
                title="Tắt chỉ đường"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}