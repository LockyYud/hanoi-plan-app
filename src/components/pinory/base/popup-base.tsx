"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { usePopupPosition } from "./hooks/use-popup-position";

type PopupVariant = "default" | "friend";

interface PopupBaseProps {
    /** Coordinates for popup positioning [lng, lat] */
    readonly coordinates: { lng: number; lat: number };
    /** Map reference for position calculation */
    readonly mapRef?: React.RefObject<mapboxgl.Map>;
    /** Visual variant of the popup */
    readonly variant?: PopupVariant;
    /** Width of the popup in pixels */
    readonly popupWidth?: number;
    /** Children to render inside the popup */
    readonly children: React.ReactNode;
    /** Additional class names */
    readonly className?: string;
}

const variantConfig: Record<
    PopupVariant,
    {
        arrowColor: string;
        cardClass: string;
    }
> = {
    default: {
        arrowColor: "border-t-blue-500 border-b-blue-500",
        cardClass: "border-border/50",
    },
    friend: {
        arrowColor: "border-t-purple-600 border-b-purple-600",
        cardClass: "border-purple-700/50",
    },
};

/**
 * PopupBase - A reusable popup component with smart positioning
 * Handles arrow placement and responsive repositioning on map
 */
export function PopupBase({
    coordinates,
    mapRef,
    variant = "default",
    popupWidth = 320,
    children,
    className,
}: PopupBaseProps) {
    const { popupStyle, arrowPosition, arrowOffset, popupRef, isPositioned } =
        usePopupPosition({
            mapRef,
            coordinates,
            popupWidth,
        });

    const config = variantConfig[variant];

    return (
        <div
            ref={popupRef}
            className={cn(
                "z-20 pointer-events-none transition-opacity duration-200",
                className
            )}
            style={{
                ...popupStyle,
                width: popupWidth,
                opacity: isPositioned ? 1 : 0,
            }}
        >
            {/* Smart Arrow */}
            {arrowPosition === "bottom" ? (
                // Arrow pointing down (popup above point)
                <div
                    className="absolute top-full transform -translate-x-1/2"
                    style={{ left: `${arrowOffset}%` }}
                >
                    <div
                        className={cn(
                            "w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent filter drop-shadow-sm",
                            config.arrowColor.split(" ")[0] // Get border-t-* class
                        )}
                    />
                </div>
            ) : (
                // Arrow pointing up (popup below point)
                <div
                    className="absolute bottom-full transform -translate-x-1/2"
                    style={{ left: `${arrowOffset}%` }}
                >
                    <div
                        className={cn(
                            "w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent filter drop-shadow-sm",
                            config.arrowColor.split(" ")[1] // Get border-b-* class
                        )}
                    />
                </div>
            )}

            {/* Popup Content */}
            <Card
                className={cn(
                    "shadow-2xl rounded-2xl overflow-hidden bg-card/95 backdrop-blur-md pointer-events-auto",
                    config.cardClass
                )}
            >
                {children}
            </Card>
        </div>
    );
}
