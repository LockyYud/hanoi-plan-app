/**
 * useMapMarkers
 *
 * Custom hook to manage all map markers with clustering support.
 * Handles Supercluster initialization, cluster rendering, and marker lifecycle.
 *
 * @param params - Configuration object
 * @returns Clusters and markers ref
 */

import { useEffect, useRef, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import Supercluster from "supercluster";
import { createRoot } from "react-dom/client";
import { CategoryType } from "@prisma/client";
import type { Pinory, ClusterComposition } from "@/lib/types";
import type { UseMapMarkersReturn } from "../types/map.types";
import { ClusterMarker } from "../markers/cluster-marker";
import { FriendPinoryPin } from "@/components/friends/pinory/friend-pinory-pin";
import {
    createMapPinElement,
    destroyMapPinElement,
    type ReactMapPinElement,
} from "../markers/marker-helper";
import { getClusterLeaves } from "../utils/mapClustering";

/**
 * Analyze cluster leaves to determine composition
 */
function analyzeClusterComposition(
    clusterIndex: Supercluster<Pinory>,
    clusterId: number
): ClusterComposition {
    const leaves = getClusterLeaves(clusterIndex, clusterId);

    let userCount = 0;
    let friendCount = 0;
    const friendAvatars: string[] = [];

    leaves.forEach((leaf) => {
        const pinory = leaf.properties;
        if (pinory.pinoryType === "friend") {
            friendCount++;
            if (pinory.creator?.avatarUrl && friendAvatars.length < 3) {
                friendAvatars.push(pinory.creator.avatarUrl);
            }
        } else {
            userCount++;
        }
    });

    const totalCount = userCount + friendCount;
    let type: "user-only" | "friend-only" | "mixed";

    if (friendCount === 0) {
        type = "user-only";
    } else if (userCount === 0) {
        type = "friend-only";
    } else {
        type = "mixed";
    }

    return {
        userCount,
        friendCount,
        totalCount,
        type,
        friendAvatars: friendAvatars.length > 0 ? friendAvatars : undefined,
    };
}

interface UseMapMarkersParams {
    mapRef: React.RefObject<mapboxgl.Map | null>;
    mapLoaded: boolean;
    pinories: Pinory[];
    mapBounds: mapboxgl.LngLatBounds | null;
    currentZoom: number;
    selectedPinory: Pinory | null;
    onMarkerClick: (pinory: Pinory) => void;
    clusterIndex: Supercluster<Pinory> | null;
}

export function useMapMarkers(
    params: UseMapMarkersParams
): UseMapMarkersReturn {
    const {
        mapRef,
        mapLoaded,
        pinories,
        mapBounds,
        currentZoom,
        selectedPinory,
        onMarkerClick,
        clusterIndex,
    } = params;
    const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());

    // Get clusters for current viewport (with optimization to reduce recalculations)
    const clusters = useMemo(() => {
        if (!mapBounds || !clusterIndex || pinories.length === 0) return [];

        try {
            // Round zoom to reduce unnecessary recalculations for tiny zoom changes
            const roundedZoom = Math.floor(currentZoom);

            return clusterIndex.getClusters(
                [
                    mapBounds.getWest(),
                    mapBounds.getSouth(),
                    mapBounds.getEast(),
                    mapBounds.getNorth(),
                ],
                roundedZoom
            );
        } catch (error) {
            console.error("Error getting clusters:", error);
            return [];
        }
    }, [mapBounds, clusterIndex, pinories.length, Math.floor(currentZoom)]);

    // Render clustered markers
    useEffect(() => {
        // CRITICAL: Check both mapRef.current and mapLoaded
        if (!mapRef.current || !mapLoaded) {
            return;
        }

        const map = mapRef.current;

        // Additional safety check
        if (
            !map.getCanvasContainer ||
            typeof map.getCanvasContainer !== "function"
        ) {
            console.warn("Map not fully initialized yet for markers");
            return;
        }

        if (clusters.length === 0 && pinories.length > 0) {
            return;
        }

        // Create a set of current cluster/marker IDs
        const currentIds = new Set<string>();
        const newMarkers = new Map<string, mapboxgl.Marker>();

        for (const cluster of clusters) {
            // Re-check map reference inside loop
            if (!mapRef.current) {
                console.warn("Map reference lost during marker rendering");
                continue;
            }

            const [lng, lat] = cluster.geometry.coordinates;
            const props = cluster.properties as any;
            const isCluster =
                props.cluster === true || props.point_count !== undefined;

            // Generate unique ID for this marker
            const markerId = isCluster
                ? `cluster-${props.cluster_id || cluster.id}`
                : `note-${(cluster.properties as Pinory).id}`;

            currentIds.add(markerId);

            // Check if marker already exists and hasn't changed
            const existingMarker = markersRef.current.get(markerId);

            if (isCluster) {
                const pointCount =
                    props.point_count || props.cluster_count || 0;
                const clusterId = props.cluster_id || cluster.id;

                // For clusters, recreate if doesn't exist or point count changed
                if (!existingMarker) {
                    const clusterElement = document.createElement("div");
                    const root = createRoot(clusterElement);
                    const mapRefCurrent = mapRef.current;

                    // Analyze cluster composition
                    let imageUrls: string[] = [];
                    let composition: ClusterComposition | undefined;

                    if (clusterIndex) {
                        try {
                            // Get composition (user vs friend counts)
                            composition = analyzeClusterComposition(
                                clusterIndex,
                                clusterId
                            );

                            // Get image URLs from cluster leaves
                            const leaves = getClusterLeaves(
                                clusterIndex,
                                clusterId
                            );
                            imageUrls = leaves
                                .map((leaf) => {
                                    const note = leaf.properties;
                                    return note.images?.[0];
                                })
                                .filter(Boolean) as string[];
                        } catch (error) {
                            console.error("Error analyzing cluster:", error);
                        }
                    }

                    root.render(
                        <ClusterMarker
                            pointCount={pointCount}
                            imageUrls={imageUrls}
                            composition={composition}
                            onClick={() => {
                                if (!mapRefCurrent || !clusterIndex) return;

                                try {
                                    const expansionZoom = Math.min(
                                        clusterIndex.getClusterExpansionZoom(
                                            clusterId
                                        ),
                                        20
                                    );

                                    mapRefCurrent.flyTo({
                                        center: [lng, lat],
                                        zoom: expansionZoom,
                                        duration: 500,
                                    });
                                } catch (error) {
                                    console.error(
                                        "Error expanding cluster:",
                                        error
                                    );
                                }
                            }}
                        />
                    );

                    // Final safety check before adding cluster marker
                    if (!mapRef.current) {
                        console.warn(
                            "Map reference lost during cluster marker creation"
                        );
                        continue;
                    }

                    const marker = new mapboxgl.Marker(clusterElement)
                        .setLngLat([lng, lat])
                        .addTo(mapRef.current);

                    newMarkers.set(markerId, marker);
                }
            } else {
                // Individual marker
                const note = cluster.properties as Pinory;
                const isSelected =
                    selectedPinory && selectedPinory.id === note.id;

                // Check if we need to update the marker (selection state changed)
                const needsUpdate =
                    !existingMarker ||
                    (existingMarker as any)._isSelected !== isSelected;

                if (needsUpdate) {
                    // Remove old marker if exists
                    if (existingMarker) {
                        const element = existingMarker.getElement();
                        const reactMarker = element as ReactMapPinElement;
                        if (reactMarker._reactRoot) {
                            destroyMapPinElement(reactMarker);
                        }
                        existingMarker.remove();
                    }

                    // Create new marker based on pinoryType
                    let markerElement: HTMLElement;

                    if (note.pinoryType === "friend") {
                        // Render FriendPinoryPin for friend pinories
                        markerElement = document.createElement("div");
                        const root = createRoot(markerElement);

                        const imageUrl =
                            note.images?.[0] ||
                            (note.media && note.media.length > 0
                                ? note.media[0].url
                                : undefined);

                        root.render(
                            <FriendPinoryPin
                                friendName={
                                    note.creator?.name ||
                                    note.creator?.email ||
                                    "Friend"
                                }
                                friendAvatarUrl={note.creator?.avatarUrl}
                                imageUrl={imageUrl}
                                category={
                                    note.category as CategoryType | undefined
                                }
                                mood={note.note ? undefined : "📍"}
                                onClick={() => onMarkerClick(note)}
                            />
                        );

                        (markerElement as ReactMapPinElement)._reactRoot = root;
                    } else {
                        // Render standard MapPin for user pinories
                        markerElement = createMapPinElement({
                            note: note,
                            mood: note.mood,
                            isSelected: !!isSelected,
                            onClick: () => onMarkerClick(note),
                        });
                    }

                    // Final safety check before adding individual marker
                    if (!mapRef.current) {
                        console.warn(
                            "Map reference lost during individual marker creation"
                        );
                        continue;
                    }

                    const marker = new mapboxgl.Marker(markerElement)
                        .setLngLat([lng, lat])
                        .addTo(mapRef.current);

                    // Store selection state for comparison
                    (marker as any)._isSelected = isSelected;

                    newMarkers.set(markerId, marker);
                }
            }
        }

        // Remove markers that are no longer in view
        for (const [id, marker] of markersRef.current.entries()) {
            if (!currentIds.has(id)) {
                const element = marker.getElement();
                const reactMarker = element as ReactMapPinElement;
                if (reactMarker._reactRoot) {
                    destroyMapPinElement(reactMarker);
                }
                marker.remove();
            }
        }

        // Update markers ref with current markers (keep existing + add new)
        for (const id of currentIds) {
            if (newMarkers.has(id)) {
                markersRef.current.set(id, newMarkers.get(id)!);
            }
            // Keep existing markers that weren't recreated
        }

        // Clean up removed markers from ref
        for (const id of Array.from(markersRef.current.keys())) {
            if (!currentIds.has(id)) {
                markersRef.current.delete(id);
            }
        }
    }, [
        clusters,
        pinories.length,
        mapLoaded,
        selectedPinory,
        onMarkerClick,
        clusterIndex,
        mapRef,
    ]);

    // Cleanup all markers on unmount
    useEffect(() => {
        return () => {
            for (const marker of markersRef.current.values()) {
                const element = marker.getElement();
                const reactMarker = element as ReactMapPinElement;
                if (reactMarker._reactRoot) {
                    destroyMapPinElement(reactMarker);
                }
                marker.remove();
            }
            markersRef.current.clear();
        };
    }, []);

    return {
        clusters,
        markersRef,
    };
}
