"use client";

/**
 * MapContainer - Refactored
 *
 * Orchestrates map functionality using modular hooks and UI layers.
 * All business logic has been extracted into custom hooks.
 * All UI rendering has been organized into presentational layers.
 *
 * This file is now < 200 lines and focuses solely on composition.
 */

import { useCallback, useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import Supercluster from "supercluster";
import {
    useMapStore,
    useUIStore,
    usePinoryStore,
    useMemoryLaneStore,
    useFriendStore,
} from "@/lib/store";
import { useFriendAPI } from "@/lib/hooks";
import type { Pinory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";
import { removeRouteFromMap } from "@/lib/geolocation";

// Custom hooks
import {
    useMapInitialization,
    useMapBounds,
    useMapInteractions,
    usePinories,
    useUserLocation,
    useFriendLocations,
    useMapMarkers,
    useRouteDisplay,
    useSelectedPinoryZoom,
} from "../hooks";

// UI Layers
import { MapControlsLayer, MapPopupLayer, MapDialogLayer } from "../layers";

// Utils
import { createClusterIndex } from "../utils/mapClustering";

interface MapContainerProps {
    readonly className?: string;
}

export function MapContainer({ className }: Readonly<MapContainerProps>) {
    const { data: session } = useSession();

    // Global stores
    const { center, zoom, setBounds } = useMapStore();
    const { showMemoryLane, setShowMemoryLane } = useUIStore();
    const { selectedPinory, setSelectedPinory } = usePinoryStore();
    const {
        routeNotes: memoryLaneRouteNotes,
        setRouteNotes: setMemoryLaneRouteNotes,
        routeSortBy: memoryLaneRouteSortBy,
        setRouteSortBy: setMemoryLaneRouteSortBy,
        showRoute: memoryLaneShowRoute,
        setShowRoute: setMemoryLaneShowRoute,
        clearRoute: clearMemoryLaneRoute,
    } = useMemoryLaneStore();
    const { showFriendsLayer, selectedFriendId, friendPinories } =
        useFriendStore();

    // API hooks
    const { fetchFriendPinories } = useFriendAPI();

    // Local UI state
    const [showLocationForm, setShowLocationForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [showJourneyDialog, setShowJourneyDialog] = useState(false);
    const [editingNote, setEditingNote] = useState<Pinory | null>(null);
    const [showDirectionPopup, setShowDirectionPopup] = useState(false);
    const [directionInfo, setDirectionInfo] = useState<any>(null);
    const [isMobile, setIsMobile] = useState(false);

    // 1. Initialize map
    const mapInit = useMapInitialization(center, zoom);

    // 2. Track map bounds
    const boundsInfo = useMapBounds(
        mapInit.mapRef,
        mapInit.mapLoaded,
        (bounds) => {
            setBounds(bounds);
        }
    );

    // 3. Handle map interactions
    const interactions = useMapInteractions(
        mapInit.mapRef,
        mapInit.mapLoaded,
        (location) => {
            setSelectedPinory(null);
            setShowLocationForm(false);
        }
    );

    // 4. Manage location notes
    const pinoriesManager = usePinories(session, mapInit.mapLoaded);

    // 5. User location marker
    useUserLocation(mapInit.mapRef, mapInit.mapLoaded, session);

    // 6. Friend locations
    const friendLocations = useFriendLocations(
        mapInit.mapRef,
        mapInit.mapLoaded,
        showFriendsLayer,
        selectedFriendId,
        friendPinories,
        fetchFriendPinories,
        session
    );

    // 7. Create cluster index from location notes
    const points = useMemo(() => {
        return pinoriesManager.pinories.map((note) => ({
            type: "Feature" as const,
            properties: note,
            geometry: {
                type: "Point" as const,
                coordinates: [note.lng, note.lat] as [number, number],
            },
        }));
    }, [pinoriesManager.pinories]);

    const [clusterIndex, setClusterIndex] =
        useState<Supercluster<Pinory> | null>(null);

    useEffect(() => {
        if (points.length === 0) {
            setClusterIndex(null);
            return;
        }
        const index = createClusterIndex(points);
        setClusterIndex(index);
    }, [points]);

    // 8. Auto-zoom when pinory is selected (from marker or sidebar)
    useSelectedPinoryZoom({
        mapRef: mapInit.mapRef,
        mapLoaded: mapInit.mapLoaded,
        selectedPinory,
        minZoomLevel: 15,
        duration: 1000,
    });

    // 9. Handle marker clicks
    const handleMarkerClick = useCallback(
        (pinory: Pinory) => {
            setSelectedPinory(pinory);
            friendLocations.setSelectedFriendPinory(null);

            if (globalThis.innerWidth < 768) {
                setTimeout(() => {
                    setShowDetailsDialog(true);
                }, 50);
            }
        },
        [setSelectedPinory, friendLocations]
    );

    // 10. Render markers with clustering
    useMapMarkers({
        mapRef: mapInit.mapRef,
        mapLoaded: mapInit.mapLoaded,
        pinories: pinoriesManager.pinories,
        mapBounds: boundsInfo.mapBounds,
        currentZoom: boundsInfo.currentZoom,
        selectedPinory,
        onMarkerClick: handleMarkerClick,
        clusterIndex,
    });

    // 11. Route display
    useRouteDisplay(mapInit.mapRef, mapInit.mapLoaded);

    // Detect mobile
    useEffect(() => {
        const checkMobile = () => setIsMobile(globalThis.innerWidth < 768);
        checkMobile();
        globalThis.addEventListener("resize", checkMobile);
        return () => globalThis.removeEventListener("resize", checkMobile);
    }, []);

    // Handle showing directions
    useEffect(() => {
        const handleShowDirections = (event: CustomEvent) => {
            if (event.detail) {
                setDirectionInfo(event.detail);
                setShowDirectionPopup(true);
            }
        };
        globalThis.addEventListener(
            "showDirections",
            handleShowDirections as EventListener
        );
        return () =>
            globalThis.removeEventListener(
                "showDirections",
                handleShowDirections as EventListener
            );
    }, []);

    // Render error state
    if (mapInit.mapError || !mapInit.hasMapboxToken) {
        return (
            <div
                className={cn(
                    "relative flex items-center justify-center bg-gray-100",
                    className
                )}
            >
                <div className="text-center max-w-md p-8">
                    <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <MapPin className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Bản đồ không khả dụng
                    </h3>
                    <p className="text-sm text-gray-600">
                        {mapInit.mapError || "Cần cấu hình Mapbox Token"}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("relative", className)} suppressHydrationWarning>
            {/* Map Container */}
            <div
                ref={mapInit.containerRef}
                className="w-full h-full relative z-0"
            />

            {/* Controls Layer */}
            <MapControlsLayer
                mapRef={mapInit.mapRef}
                onCreateNote={async (pinory) => {
                    setSelectedPinory(null);
                    interactions.setClickedLocation({
                        lng: pinory.lng,
                        lat: pinory.lat,
                        address: pinory.address,
                    });
                    setShowLocationForm(true);

                    if (mapInit.mapRef.current) {
                        mapInit.mapRef.current.flyTo({
                            center: [pinory.lng, pinory.lat],
                            zoom: 16,
                            duration: 1500,
                        });
                    }
                }}
                onCreateJourney={() => setShowJourneyDialog(true)}
            />

            {/* Popup Layer */}
            <MapPopupLayer
                selectedPinory={selectedPinory}
                onCloseSelectedNote={() => setSelectedPinory(null)}
                onViewNoteDetails={() => setShowDetailsDialog(true)}
                onDeleteNote={async () => {
                    if (
                        selectedPinory &&
                        confirm("Bạn có chắc muốn xóa ghi chú này?")
                    ) {
                        try {
                            await pinoriesManager.deletePinory(
                                selectedPinory.id
                            );
                            setSelectedPinory(null);
                        } catch (error) {
                            console.error("Failed to delete note:", error);
                            alert("Không thể xóa ghi chú. Vui lòng thử lại.");
                        }
                    }
                }}
                clickedPinory={interactions.clickedLocation}
                showPinoryForm={showLocationForm}
                onCloseClickedPinory={() => {
                    interactions.setClickedLocation(null);
                    if (interactions.clickedLocationMarker.current) {
                        interactions.clickedLocationMarker.current.remove();
                        interactions.clickedLocationMarker.current = null;
                    }
                }}
                onAddPinory={() => setShowLocationForm(true)}
                showDirectionPopup={showDirectionPopup}
                directionInfo={directionInfo}
                onCloseDirection={() => {
                    setShowDirectionPopup(false);
                    setDirectionInfo(null);
                    if (mapInit.mapRef.current) {
                        removeRouteFromMap(mapInit.mapRef.current);
                    }
                }}
                selectedFriendPinory={friendLocations.selectedFriendPinory}
                isMobile={isMobile}
                onCloseFriendPinory={() =>
                    friendLocations.setSelectedFriendPinory(null)
                }
                onViewFriendDetails={() =>
                    friendLocations.setShowFriendDetailsDialog(true)
                }
                mapRef={mapInit.mapRef}
            />

            {/* Dialog Layer */}
            <MapDialogLayer
                showLocationForm={showLocationForm}
                clickedLocation={interactions.clickedLocation}
                onCloseLocationForm={() => {
                    setShowLocationForm(false);
                    interactions.setClickedLocation(null);
                    if (interactions.clickedLocationMarker.current) {
                        interactions.clickedLocationMarker.current.remove();
                        interactions.clickedLocationMarker.current = null;
                    }
                }}
                onSubmitLocationForm={pinoriesManager.addPinory}
                showEditForm={showEditForm}
                editingPinory={editingNote}
                onCloseEditForm={() => {
                    setShowEditForm(false);
                    setEditingNote(null);
                }}
                onSubmitEditForm={pinoriesManager.updatePinory}
                showDetailsDialog={showDetailsDialog}
                selectedPinory={selectedPinory}
                onCloseDetailsDialog={() => {
                    setShowDetailsDialog(false);
                    setSelectedPinory(null);
                }}
                onEditPinory={() => {
                    if (selectedPinory) {
                        setEditingNote(selectedPinory);
                        setShowEditForm(true);
                    }
                }}
                onDeletePinory={() => {
                    console.log(
                        "Delete from details view:",
                        selectedPinory?.id
                    );
                }}
                showFriendDetailsDialog={
                    friendLocations.showFriendDetailsDialog
                }
                selectedFriendPinory={friendLocations.selectedFriendPinory}
                onCloseFriendDetailsDialog={() => {
                    friendLocations.setShowFriendDetailsDialog(false);
                    friendLocations.setSelectedFriendPinory(null);
                }}
                onAddToFavorites={async () => {
                    if (friendLocations.selectedFriendPinory) {
                        try {
                            const response = await fetch("/api/favorites", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    placeId:
                                        friendLocations.selectedFriendPinory.id,
                                }),
                                credentials: "include",
                            });
                            if (response.ok) {
                                alert("Added to favorites!");
                                friendLocations.setShowFriendDetailsDialog(
                                    false
                                );
                                friendLocations.setSelectedFriendPinory(null);
                            }
                        } catch (error) {
                            console.error("Failed to add to favorites:", error);
                            alert("Error adding to favorites");
                        }
                    }
                }}
                showJourneyDialog={showJourneyDialog}
                onCloseJourneyDialog={() => setShowJourneyDialog(false)}
                onJourneySuccess={() => {
                    pinoriesManager.loadPinories();
                    globalThis.dispatchEvent(new CustomEvent("journeyCreated"));
                }}
                showMemoryLane={showMemoryLane}
                onCloseMemoryLane={() => setShowMemoryLane(false)}
                onShowRoute={(notes, sortBy) => {
                    setMemoryLaneRouteNotes(notes);
                    setMemoryLaneRouteSortBy(sortBy as "time" | "custom");
                    setMemoryLaneShowRoute(true);
                    setShowMemoryLane(false);
                }}
                showRoute={memoryLaneShowRoute}
                routeNotes={memoryLaneRouteNotes}
                routeSortBy={memoryLaneRouteSortBy}
                mapInstance={mapInit.mapRef.current}
                onCloseRoute={() => clearMemoryLaneRoute()}
            />
        </div>
    );
}
