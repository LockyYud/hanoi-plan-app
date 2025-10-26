"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { LocationNote } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { X, Navigation, MapPin, Loader2 } from "lucide-react";

interface RouteDisplayProps {
    readonly map: mapboxgl.Map | null;
    readonly notes: LocationNote[];
    readonly sortBy: "time" | "custom";
    readonly onClose: () => void;
}

export function RouteDisplay({
    map,
    notes,
    sortBy,
    onClose,
}: RouteDisplayProps) {
    const routeSourceId = "memory-lane-route";
    const routeLayerId = "memory-lane-route-layer";
    const routeArrowsLayerId = "memory-lane-route-arrows";
    const routeOutlineLayerId = "memory-lane-route-outline";
    const markersRef = useRef<mapboxgl.Marker[]>([]);

    // Create curved line between two points using quadratic Bezier curve
    const createCurvedLine = (
        start: [number, number],
        end: [number, number],
        controlPointOffset = 0.3
    ): [number, number][] => {
        const points: [number, number][] = [];
        const steps = 20; // Number of points in the curve

        // Calculate control point (offset perpendicular to the line)
        const midX = (start[0] + end[0]) / 2;
        const midY = (start[1] + end[1]) / 2;

        // Calculate perpendicular offset
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Perpendicular vector
        const perpX = -dy / distance;
        const perpY = dx / distance;

        // Control point with offset
        const controlX = midX + perpX * distance * controlPointOffset;
        const controlY = midY + perpY * distance * controlPointOffset;

        // Generate curve points using quadratic Bezier formula
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const invT = 1 - t;

            const x =
                invT * invT * start[0] +
                2 * invT * t * controlX +
                t * t * end[0];
            const y =
                invT * invT * start[1] +
                2 * invT * t * controlY +
                t * t * end[1];

            points.push([x, y]);
        }

        return points;
    };

    useEffect(() => {
        if (!map || notes.length < 2) return;

        // Clear existing route and markers
        if (map.getLayer(routeOutlineLayerId)) {
            map.removeLayer(routeOutlineLayerId);
        }
        if (map.getLayer(routeLayerId)) {
            map.removeLayer(routeLayerId);
        }
        if (map.getLayer(routeArrowsLayerId)) {
            map.removeLayer(routeArrowsLayerId);
        }
        if (map.getSource(routeSourceId)) {
            map.removeSource(routeSourceId);
        }
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];

        // Create curved lines between each pair of consecutive points
        const allCurvePoints: [number, number][] = [];
        for (let i = 0; i < notes.length - 1; i++) {
            const start: [number, number] = [notes[i].lng, notes[i].lat];
            const end: [number, number] = [notes[i + 1].lng, notes[i + 1].lat];

            // Alternate curve direction for visual variety
            const offset = i % 2 === 0 ? 0.15 : -0.15;
            const curvePoints = createCurvedLine(start, end, offset);

            // Add all points except the last one to avoid duplicates
            allCurvePoints.push(
                ...curvePoints.slice(0, i === notes.length - 2 ? undefined : -1)
            );
        }

        // Add route source with curved line
        map.addSource(routeSourceId, {
            type: "geojson",
            data: {
                type: "Feature",
                properties: {},
                geometry: {
                    type: "LineString",
                    coordinates: allCurvePoints,
                },
            },
        });

        // Add outline layer (white) for better visibility
        map.addLayer({
            id: routeOutlineLayerId,
            type: "line",
            source: routeSourceId,
            layout: {
                "line-join": "round",
                "line-cap": "round",
            },
            paint: {
                "line-color": "#FFFFFF",
                "line-width": 5,
                "line-opacity": 0.9,
            },
        });

        // Add dashed route line (footsteps style)
        map.addLayer({
            id: routeLayerId,
            type: "line",
            source: routeSourceId,
            layout: {
                "line-join": "round",
                "line-cap": "round",
            },
            paint: {
                "line-color": "#FF6B6B",
                "line-width": 3,
                "line-opacity": 0.85,
                "line-dasharray": [1, 2], // Footstep-like dashed pattern
            },
        });

        // Add arrow symbols along the route to show direction
        map.addLayer({
            id: routeArrowsLayerId,
            type: "symbol",
            source: routeSourceId,
            layout: {
                "symbol-placement": "line",
                "symbol-spacing": 100,
                "text-field": "▶",
                "text-size": 14,
                "text-keep-upright": false,
                "text-rotation-alignment": "map",
                "text-pitch-alignment": "viewport",
                "text-allow-overlap": true,
                "text-ignore-placement": true,
            },
            paint: {
                "text-color": "#FF6B6B",
                "text-opacity": 0.7,
            },
        });

        // No markers needed - only show the curved route with arrows

        // Fit map to route bounds
        const bounds = new mapboxgl.LngLatBounds();
        notes.forEach((note) =>
            bounds.extend([note.lng, note.lat] as [number, number])
        );

        map.fitBounds(bounds, {
            padding: { top: 100, bottom: 100, left: 100, right: 100 },
            duration: 1000,
        });

        // Cleanup function
        return () => {
            if (map.getLayer(routeOutlineLayerId)) {
                map.removeLayer(routeOutlineLayerId);
            }
            if (map.getLayer(routeLayerId)) {
                map.removeLayer(routeLayerId);
            }
            if (map.getLayer(routeArrowsLayerId)) {
                map.removeLayer(routeArrowsLayerId);
            }
            if (map.getSource(routeSourceId)) {
                map.removeSource(routeSourceId);
            }
            markersRef.current.forEach((marker) => marker.remove());
            markersRef.current = [];
        };
    }, [map, notes, sortBy]);

    // Calculate approximate distance
    const totalDistance = notes.reduce((acc, note, index) => {
        if (index === 0) return 0;
        const prev = notes[index - 1];

        // Haversine formula
        const R = 6371;
        const dLat = ((note.lat - prev.lat) * Math.PI) / 180;
        const dLng = ((note.lng - prev.lng) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((prev.lat * Math.PI) / 180) *
                Math.cos((note.lat * Math.PI) / 180) *
                Math.sin(dLng / 2) *
                Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return acc + R * c;
    }, 0);

    return (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-auto max-w-md">
            <div className="bg-[#0C0C0C]/95 backdrop-blur-lg rounded-2xl p-4 border border-neutral-800 shadow-2xl">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <h3 className="text-sm font-bold text-[#EDEDED] mb-1 flex items-center gap-2">
                            <Navigation className="h-4 w-4 text-[#FF6B6B]" />
                            Lộ trình kỷ niệm
                        </h3>
                        <p className="text-xs text-[#A0A0A0]">
                            {notes.length} điểm • ~{totalDistance.toFixed(1)} km
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-8 w-8 p-0 text-[#A0A0A0] hover:text-[#EDEDED] hover:bg-neutral-800"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Info */}
                <div className="flex items-center justify-between text-xs text-[#A0A0A0]">
                    <div className="flex items-center gap-2">
                        <span className="text-base">▶ ▶ ▶</span>
                        <span>Hướng đi</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>
                            {sortBy === "time" ? "Theo thời gian" : "Tùy chỉnh"}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
