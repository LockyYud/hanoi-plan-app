/**
 * useFriendLocations
 *
 * Custom hook to manage friend location markers on the map.
 * Fetches and displays pinories from friends when friends layer is enabled.
 *
 * @param mapRef - Reference to the Mapbox map instance
 * @param mapLoaded - Whether the map has finished loading
 * @param showFriendsLayer - Whether friends layer is visible
 * @param selectedFriendId - Optional friend ID to filter by
 * @param friendPinories - Friend pinories from store
 * @param fetchFriendPinories - Function to fetch friend pinories
 * @param session - Next-auth session object
 * @returns Friend markers state and selected friend pinory
 */

import { useState, useEffect, useRef, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import { createRoot } from "react-dom/client";
import { Session } from "next-auth";
import { CategoryType } from "@prisma/client";
import type { Pinory } from "@/lib/types";
import type { UseFriendLocationsReturn } from "../types/map.types";
import { FriendPinoryPin } from "@/components/friends/pinory/friend-pinory-pin";
import {
    destroyMapPinElement,
    type ReactMapPinElement,
} from "../markers/marker-helper";

export function useFriendLocations(
    mapRef: React.RefObject<mapboxgl.Map | null>,
    mapLoaded: boolean,
    showFriendsLayer: boolean,
    selectedFriendId: string | null,
    friendPinories: Pinory[],
    fetchFriendPinories: (friendId?: string) => void,
    session: Session | null
): UseFriendLocationsReturn {
    const friendMarkersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
    const [selectedFriendPinory, setSelectedFriendPinory] =
        useState<Pinory | null>(null);
    const [showFriendDetailsDialog, setShowFriendDetailsDialog] =
        useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(globalThis.innerWidth < 768);
        };
        checkMobile();
        globalThis.addEventListener("resize", checkMobile);
        return () => globalThis.removeEventListener("resize", checkMobile);
    }, []);

    // Fetch ALL friend pinories once when friends layer is enabled
    useEffect(() => {
        if (showFriendsLayer && session) {
            fetchFriendPinories(); // Fetch all, no friendId filter
        }
    }, [showFriendsLayer, session, fetchFriendPinories]);

    // Client-side filter by selectedFriendId
    const filteredPinories = useMemo(() => {
        if (!selectedFriendId) return friendPinories;
        return friendPinories.filter(
            (pinory) => pinory.creator?.id === selectedFriendId
        );
    }, [friendPinories, selectedFriendId]);

    // Render friend location markers
    useEffect(() => {
        // CRITICAL: Check both mapRef.current and mapLoaded
        if (!mapRef.current || !mapLoaded) return;

        const map = mapRef.current;

        // Additional safety check
        if (
            !map.getCanvasContainer ||
            typeof map.getCanvasContainer !== "function"
        ) {
            console.warn("Map not fully initialized yet");
            return;
        }

        // Clear existing friend markers
        friendMarkersRef.current.forEach((marker) => {
            const element = marker.getElement();
            const reactMarker = element as ReactMapPinElement;
            if (reactMarker._reactRoot) {
                destroyMapPinElement(reactMarker);
            }
            marker.remove();
        });
        friendMarkersRef.current.clear();

        // Only render if friends layer is visible
        if (!showFriendsLayer || filteredPinories.length === 0) {
            return;
        }

        console.log(
            "🎨 Rendering friend location markers:",
            filteredPinories.length,
            selectedFriendId
                ? `(filtered by friend: ${selectedFriendId})`
                : "(all friends)"
        );

        // Create markers for friend locations
        filteredPinories.forEach((friendPinory) => {
            const markerElement = document.createElement("div");
            const root = createRoot(markerElement);

            // Get first image - API returns 'images' array or 'media' array
            const imageUrl =
                (friendPinory as any).images &&
                (friendPinory as any).images.length > 0
                    ? (friendPinory as any).images[0]
                    : friendPinory.media && friendPinory.media.length > 0
                      ? friendPinory.media[0].url
                      : undefined;

            console.log("🎨 Friend note image check:", {
                id: friendPinory.id,
                hasImages: !!(friendPinory as any).images?.length,
                images: (friendPinory as any).images,
                hasMedia: !!friendPinory.media?.length,
                media: friendPinory.media,
                imageUrl,
            });

            root.render(
                <FriendPinoryPin
                    friendName={
                        friendPinory.creator?.name ||
                        friendPinory.creator?.email ||
                        "Friend"
                    }
                    friendAvatarUrl={friendPinory.creator?.avatarUrl}
                    imageUrl={imageUrl}
                    category={
                        (friendPinory.category as CategoryType) || undefined
                    }
                    mood={friendPinory.note ? undefined : "📍"}
                    onClick={() => {
                        setSelectedFriendPinory(friendPinory);

                        // On mobile, auto-open details view
                        if (globalThis.innerWidth < 768) {
                            setTimeout(() => {
                                setShowFriendDetailsDialog(true);
                            }, 50);
                        }
                    }}
                />
            );

            (markerElement as ReactMapPinElement)._reactRoot = root;

            // Final safety check before adding marker
            if (!mapRef.current) {
                console.warn(
                    "Map reference lost during friend marker creation"
                );
                return;
            }

            const marker = new mapboxgl.Marker(markerElement)
                .setLngLat([friendPinory.lng, friendPinory.lat])
                .addTo(mapRef.current);

            friendMarkersRef.current.set(friendPinory.id, marker);
        });

        // Cleanup on unmount
        return () => {
            friendMarkersRef.current.forEach((marker) => {
                const element = marker.getElement();
                const reactMarker = element as ReactMapPinElement;
                if (reactMarker._reactRoot) {
                    destroyMapPinElement(reactMarker);
                }
                marker.remove();
            });
            friendMarkersRef.current.clear();
        };
    }, [
        mapRef,
        mapLoaded,
        showFriendsLayer,
        filteredPinories,
        selectedFriendId,
    ]);

    return {
        friendMarkers: friendMarkersRef.current,
        selectedFriendPinory,
        setSelectedFriendPinory,
        showFriendDetailsDialog,
        setShowFriendDetailsDialog,
    };
}
