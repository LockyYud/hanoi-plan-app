"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UsePopupPositionOptions {
    /** The map reference */
    mapRef?: React.RefObject<mapboxgl.Map>;
    /** Coordinates to position popup near [lng, lat] */
    coordinates?: { lng: number; lat: number } | null;
    /** Width of the popup in pixels */
    popupWidth?: number;
    /** Offset from marker in pixels */
    markerOffset?: number;
    /** Margin from screen edges in pixels */
    margin?: number;
}

interface UsePopupPositionReturn {
    /** CSS style for popup positioning */
    popupStyle: React.CSSProperties;
    /** Arrow position relative to popup */
    arrowPosition: "top" | "bottom";
    /** Arrow offset as percentage from left */
    arrowOffset: number;
    /** Ref to attach to popup element for height calculation */
    popupRef: React.RefObject<HTMLDivElement | null>;
    /** Whether popup is positioned and ready to show */
    isPositioned: boolean;
}

const DEFAULT_OPTIONS = {
    popupWidth: 320,
    markerOffset: 80,
    margin: 10,
};

/**
 * Custom hook for smart popup positioning relative to map coordinates
 * Handles dynamic arrow placement and responsive repositioning
 */
export function usePopupPosition(
    options: UsePopupPositionOptions = {}
): UsePopupPositionReturn {
    const {
        mapRef,
        coordinates,
        popupWidth = DEFAULT_OPTIONS.popupWidth,
        markerOffset = DEFAULT_OPTIONS.markerOffset,
        margin = DEFAULT_OPTIONS.margin,
    } = options;

    const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
    const [arrowPosition, setArrowPosition] = useState<"top" | "bottom">("bottom");
    const [arrowOffset, setArrowOffset] = useState(50);

    const popupRef = useRef<HTMLDivElement>(null);
    const lastHeightRef = useRef<number>(280);

    const isPositioned = !!popupStyle.left;

    const updatePosition = useCallback(() => {
        if (!mapRef?.current || !coordinates) return;

        try {
            // Convert lng/lat to screen coordinates
            const point = mapRef.current.project([coordinates.lng, coordinates.lat]);

            // Get actual popup height if available, use cached height to prevent flickering
            const currentHeight = popupRef.current?.offsetHeight;
            if (currentHeight && currentHeight > 0) {
                lastHeightRef.current = currentHeight;
            }
            const popupHeight = lastHeightRef.current;
            const arrowSize = 8;
            const viewportHeight = window.innerHeight;

            // Calculate space above and below the marker point
            const spaceAbove = point.y - margin - markerOffset;
            const spaceBelow = viewportHeight - point.y - margin - markerOffset;

            let left = point.x - popupWidth / 2;
            let top: number;
            let maxHeight: number | undefined;
            let newArrowPosition: "top" | "bottom";

            // Choose position based on available space
            // Prefer below if there's enough space
            const hasSpaceBelow = spaceBelow >= popupHeight;
            const hasSpaceAbove = spaceAbove >= popupHeight;
            const preferBelow =
                hasSpaceBelow || (!hasSpaceAbove && spaceBelow > spaceAbove);

            if (preferBelow) {
                // Position below marker
                top = point.y + arrowSize + markerOffset;
                newArrowPosition = "top"; // Arrow points up

                // Clamp top so popup stays within viewport
                // If popup would overflow bottom, set maxHeight
                const availableHeight = viewportHeight - top - margin;
                if (availableHeight < popupHeight) {
                    maxHeight = Math.max(200, availableHeight); // Min 200px
                }
            } else {
                // Position above marker
                const idealTop = point.y - popupHeight - arrowSize - markerOffset;
                newArrowPosition = "bottom"; // Arrow points down

                // Clamp top so popup stays within viewport
                if (idealTop < margin) {
                    // Popup would overflow top - clamp and set maxHeight
                    top = margin;
                    const availableHeight = point.y - margin - arrowSize - markerOffset;
                    maxHeight = Math.max(200, availableHeight);
                } else {
                    top = idealTop;
                }
            }

            // Adjust horizontal position to stay within screen bounds
            left = Math.max(
                margin,
                Math.min(left, window.innerWidth - popupWidth - margin)
            );

            // Calculate arrow offset as percentage
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
                ...(maxHeight && {
                    maxHeight,
                    overflowY: "auto" as const,
                }),
            });
            setArrowPosition(newArrowPosition);
            setArrowOffset(newArrowOffset);
        } catch (error) {
            console.error("Error calculating popup position:", error);
        }
    }, [mapRef, coordinates, popupWidth, markerOffset, margin]);

    useEffect(() => {
        if (!mapRef?.current || !coordinates) return;

        // Update position initially and after a short delay to get actual height
        updatePosition();
        const timeoutId = setTimeout(updatePosition, 100);

        // Update position when map moves
        const map = mapRef.current;
        map.on("move", updatePosition);
        map.on("zoom", updatePosition);

        return () => {
            clearTimeout(timeoutId);
            map.off("move", updatePosition);
            map.off("zoom", updatePosition);
        };
    }, [mapRef, coordinates, updatePosition]);

    return {
        popupStyle,
        arrowPosition,
        arrowOffset,
        popupRef,
        isPositioned,
    };
}
