"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import mapboxgl from "mapbox-gl";
import { useMapStore, usePlaceStore } from "@/lib/store";
import { PlacePopup } from "./place-popup";
import { MapControls } from "./map-controls";
import { LocationNoteForm } from "./location-note-form";
import { NoteDetailsView } from "./note-details-view";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react"; // Added for error UI
import { getCurrentLocation } from "@/lib/geolocation";

// Set the Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

interface MapContainerProps {
    className?: string;
}

export function MapContainer({ className }: MapContainerProps) {
    const { data: session } = useSession();
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapError, setMapError] = useState<string | null>(null);
    const userLocationMarker = useRef<mapboxgl.Marker | null>(null);
    const [clickedLocation, setClickedLocation] = useState<{
        lng: number;
        lat: number;
        address?: string;
    } | null>(null);
    const [showLocationForm, setShowLocationForm] = useState(false);

    const { center, zoom, setCenter, setZoom, setBounds } = useMapStore();
    const { places, selectedPlace, setSelectedPlace, setPlaces } =
        usePlaceStore();

    // State for location notes
    const [locationNotes, setLocationNotes] = useState<
        Array<{
            id: string;
            lng: number;
            lat: number;
            address: string;
            content: string;
            mood?: string;
            timestamp: Date;
            images?: string[];
        }>
    >([]);

    // Load location notes from API
    const loadLocationNotes = async () => {
        try {
            const response = await fetch("/api/location-notes");
            if (response.ok) {
                const notes = await response.json();
                console.log(
                    "🔄 API returned notes:",
                    notes.map((n) => ({
                        id: n.id,
                        mood: n.mood,
                        content: n.content?.substring(0, 20),
                    }))
                );
                setLocationNotes(notes);
                console.log("📍 Loaded", notes.length, "location notes");
            }
        } catch (error) {
            console.error("Error loading location notes:", error);
        }
    };

    // State for details view (unified with places)
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);

    // Check if Mapbox token is available
    const hasMapboxToken =
        process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN &&
        process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN !==
            "your-mapbox-token-here";

    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        // Check if we have a valid Mapbox token
        if (!hasMapboxToken) {
            setMapError("Mapbox token không hợp lệ hoặc chưa được cấu hình");
            return;
        }

        try {
            // Initialize map
            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: "mapbox://styles/mapbox/streets-v12",
                center: center,
                zoom: zoom,
                attributionControl: false,
            });
        } catch (error) {
            console.error("Map initialization error:", error);
            setMapError("Không thể khởi tạo bản đồ");
            return;
        }

        map.current.on("load", () => {
            setMapLoaded(true);

            // Add custom control
            map.current?.addControl(
                new mapboxgl.AttributionControl({
                    customAttribution: "© Hanoi Plan",
                }),
                "bottom-right"
            );

            // Add navigation control
            map.current?.addControl(
                new mapboxgl.NavigationControl(),
                "top-right"
            );
        });

        map.current.on("moveend", () => {
            if (!map.current || isUserInteracting.current) return;

            const newCenter = map.current.getCenter();
            const newZoom = map.current.getZoom();
            const bounds = map.current.getBounds();

            setCenter([newCenter.lng, newCenter.lat]);
            setZoom(newZoom);
            setBounds({
                north: bounds.getNorth(),
                south: bounds.getSouth(),
                east: bounds.getEast(),
                west: bounds.getWest(),
            });
        });

        map.current.on("error", (error) => {
            console.error("Map error:", error);
            setMapError("Lỗi tải bản đồ. Vui lòng kiểm tra kết nối internet.");
        });

        // Add click handler to add new places
        map.current.on("click", async (e) => {
            const { lng, lat } = e.lngLat;
            console.log("Map clicked at:", { lng, lat });

            // Get address using reverse geocoding
            try {
                const accessToken =
                    mapboxgl.accessToken ||
                    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
                if (!accessToken) {
                    throw new Error("Mapbox access token not available");
                }

                const response = await fetch(
                    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${accessToken}&language=vi,en&country=vn`
                );

                if (!response.ok) {
                    throw new Error(
                        `HTTP ${response.status}: ${response.statusText}`
                    );
                }

                const data = await response.json();
                const address =
                    data.features?.[0]?.place_name ||
                    `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

                setClickedLocation({ lng, lat, address });
                setShowLocationForm(false); // Reset form visibility on new click
            } catch (error) {
                console.error("Reverse geocoding failed:", error);
                // Use coordinates as fallback address
                const fallbackAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                setClickedLocation({
                    lng,
                    lat,
                    address: fallbackAddress,
                });
                setShowLocationForm(false); // Reset form visibility on new click
            }
        });

        return () => {
            map.current?.remove();
            map.current = null;
        };
    }, [hasMapboxToken]); // Only depend on token for initial setup

    // Load location notes on component mount
    useEffect(() => {
        if (mapLoaded) {
            loadLocationNotes();
        }
    }, [mapLoaded]);

    // Add place markers
    useEffect(() => {
        if (!map.current || !mapLoaded) return;

        console.log("🗺️ Adding markers for", places.length, "places");

        if (places.length === 0) {
            console.log("⚠️ No places to display on map");
            return;
        }

        // Remove existing markers
        const existingMarkers = document.querySelectorAll(".place-marker");
        existingMarkers.forEach((marker) => marker.remove());

        // Add new markers
        places.forEach((place) => {
            console.log(
                "📍 Creating marker for:",
                place.name,
                "at",
                place.lat,
                place.lng,
                "type:",
                (place as any).placeType || "regular"
            );
            const markerElement = document.createElement("div");
            markerElement.className = "place-marker";
            markerElement.innerHTML = `
                <div style="
                    width: 32px;
                    height: 32px;
                    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                    border: 3px solid white;
                    border-radius: 50%;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 14px;
                    font-weight: bold;
                ">
                    ${(place as any).placeType === "note" ? (place as any).mood || "📝" : place.category === "cafe" ? "☕" : place.category === "food" ? "🍜" : place.category === "bar" ? "🍻" : place.category === "rooftop" ? "🏙️" : place.category === "activity" ? "🎯" : "🏛️"}
                </div>
            `;

            const innerDiv = markerElement.querySelector("div");

            markerElement.addEventListener("mouseenter", () => {
                if (innerDiv) {
                    innerDiv.style.transform = "scale(1.2)";
                    innerDiv.style.boxShadow =
                        "0 6px 20px rgba(59, 130, 246, 0.6)";
                }
            });

            markerElement.addEventListener("mouseleave", () => {
                if (innerDiv) {
                    innerDiv.style.transform = "scale(1)";
                    innerDiv.style.boxShadow =
                        "0 4px 12px rgba(59, 130, 246, 0.4)";
                }
            });

            new mapboxgl.Marker(markerElement)
                .setLngLat([place.lng, place.lat])
                .addTo(map.current!);

            markerElement.addEventListener("click", (e) => {
                e.stopPropagation();
                // Use unified place state
                setSelectedPlace(place);
                console.log(
                    "Clicked my place:",
                    place.name,
                    "type:",
                    (place as any).placeType || "regular"
                );
            });
        });

        // Auto focus on first result if there's a search
        if (places.length > 0 && places.length <= 5) {
            const bounds = new mapboxgl.LngLatBounds();
            places.forEach((place) => {
                bounds.extend([place.lng, place.lat]);
            });

            if (places.length === 1) {
                // Single result - fly to it
                map.current?.flyTo({
                    center: [places[0].lng, places[0].lat],
                    zoom: 16,
                    duration: 1000,
                });
            } else {
                // Multiple results - fit bounds
                map.current?.fitBounds(bounds, {
                    padding: 50,
                    duration: 1000,
                });
            }
        }
    }, [places, mapLoaded, setSelectedPlace]);

    // Location note markers are now unified with place markers
    // This useEffect is disabled to prevent duplicate markers
    useEffect(() => {
        if (!map.current || !mapLoaded) return;

        console.log(
            "🔄 Location notes are now handled via unified places markers"
        );

        // Remove any old location note markers if they exist
        const existingNoteMarkers = document.querySelectorAll(
            ".location-note-marker"
        );
        existingNoteMarkers.forEach((marker) => marker.remove());

        // Note: locationNotes are now displayed via the places array with placeType="note"
    }, [locationNotes, mapLoaded]);

    // Track last programmatic center to avoid loops
    const lastProgrammaticCenter = useRef<[number, number] | null>(null);
    const isUserInteracting = useRef(false);

    // Update map when center/zoom changes from search (with better loop prevention)
    useEffect(() => {
        if (!map.current || !mapLoaded || isUserInteracting.current) return;

        // Check if this is a new programmatic change
        const currentCenter = map.current.getCenter();
        const centerChanged =
            Math.abs(center[0] - currentCenter.lng) > 0.001 ||
            Math.abs(center[1] - currentCenter.lat) > 0.001;

        // Only fly if center actually changed and it's not from user interaction
        if (centerChanged) {
            lastProgrammaticCenter.current = center;
            isUserInteracting.current = true; // Prevent loop

            map.current.flyTo({
                center: center,
                zoom: zoom,
                duration: 1000,
            });

            // Reset flag after animation
            setTimeout(() => {
                isUserInteracting.current = false;
            }, 1100);
        }
    }, [center, zoom, mapLoaded]);

    // Fly to selected place
    useEffect(() => {
        if (!map.current || !selectedPlace) return;

        map.current.flyTo({
            center: [selectedPlace.lng, selectedPlace.lat],
            zoom: 16,
            duration: 1000,
        });
    }, [selectedPlace]);

    // Handle adding location note
    const handleAddLocationNote = async (noteData: any) => {
        try {
            console.log("Adding location note:", noteData);

            // Save to database via API
            const response = await fetch("/api/location-notes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    lng: noteData.lng,
                    lat: noteData.lat,
                    address: noteData.address,
                    content: noteData.content,
                    mood: noteData.mood,
                    images: noteData.images || [],
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to save note");
            }

            const savedNote = await response.json();

            // Add to local state
            console.log("📝 Adding note to local state:", savedNote);
            setLocationNotes((prev) => [...prev, savedNote]);
            setClickedLocation(null);
            setShowLocationForm(false);

            // Dispatch event to update sidebar
            window.dispatchEvent(new CustomEvent("locationNoteAdded"));

            console.log("✅ Location note saved and sidebar notified");
        } catch (error) {
            console.error("Error adding location note:", error);
            alert(`Có lỗi xảy ra khi lưu ghi chú: ${error.message}`);
        }
    };

    // Simplified note actions (unified with places)

    // Handle opening location form from preview
    const handleOpenLocationForm = () => {
        setShowLocationForm(true);
    };

    // Create user location marker element
    const createUserLocationMarker = () => {
        const markerElement = document.createElement("div");
        markerElement.className = "user-location-marker";
        markerElement.style.cssText = `
            width: 44px;
            height: 44px;
            border-radius: 50%;
            border: 3px solid #3b82f6;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: transform 0.2s ease;
            position: relative;
            z-index: 1000;
            pointer-events: auto;
        `;

        // Create inner content container to prevent layout shifts
        const innerContainer = document.createElement("div");
        innerContainer.style.cssText = `
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        `;

        // Use user avatar or default icon
        if (session?.user?.avatarUrl) {
            const img = document.createElement("img");
            img.src = session.user.avatarUrl;
            img.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            `;
            img.onerror = () => {
                // Fallback to default icon if image fails
                innerContainer.innerHTML = "📍";
                innerContainer.style.fontSize = "20px";
                innerContainer.style.lineHeight = "1";
            };
            innerContainer.appendChild(img);
        } else {
            innerContainer.innerHTML = "📍";
            innerContainer.style.fontSize = "20px";
            innerContainer.style.lineHeight = "1";
        }

        markerElement.appendChild(innerContainer);

        // Only handle click events - let CSS handle hover
        markerElement.addEventListener("click", (e) => {
            e.stopPropagation();
            console.log("📍 User location marker clicked");
        });

        return markerElement;
    };

    // Add or update user location marker
    const updateUserLocationMarker = async () => {
        if (!map.current || !session) return;

        try {
            const userLocation = await getCurrentLocation();
            console.log("📍 User location:", userLocation);

            // Check if marker already exists at same location
            if (userLocationMarker.current) {
                const currentLngLat = userLocationMarker.current.getLngLat();
                const distance =
                    Math.abs(currentLngLat.lng - userLocation.lng) +
                    Math.abs(currentLngLat.lat - userLocation.lat);

                // Only update if location changed significantly (> 0.0001 degrees ~10m)
                if (distance < 0.0001) {
                    console.log(
                        "📍 User location unchanged, keeping existing marker"
                    );
                    return;
                }

                // Update existing marker position instead of recreating
                userLocationMarker.current.setLngLat([
                    userLocation.lng,
                    userLocation.lat,
                ]);
                console.log("📍 User location marker position updated");
                return;
            }

            // Create new marker only if none exists
            const markerElement = createUserLocationMarker();
            userLocationMarker.current = new mapboxgl.Marker({
                element: markerElement,
                anchor: "center",
                offset: [0, 0],
                pitchAlignment: "map",
                rotationAlignment: "map",
            })
                .setLngLat([userLocation.lng, userLocation.lat])
                .addTo(map.current);

            console.log("✅ User location marker created");
        } catch (error) {
            console.error("❌ Could not get user location:", error);
        }
    };

    // Add user location marker when user logs in
    useEffect(() => {
        if (mapLoaded && session) {
            updateUserLocationMarker();
        } else if (!session && userLocationMarker.current) {
            // Remove marker when user logs out
            userLocationMarker.current.remove();
            userLocationMarker.current = null;
        }
    }, [mapLoaded, session]);

    // Show error state if map error or no token
    if (mapError || !hasMapboxToken) {
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
                    <p className="text-sm text-gray-600 mb-4">
                        {mapError || "Cần cấu hình Mapbox Access Token"}
                    </p>
                    {!hasMapboxToken && (
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
                            <p className="text-sm text-yellow-800 mb-2">
                                🗺️ <strong>Cấu hình Mapbox Token</strong>
                            </p>
                            <ol className="text-xs text-yellow-700 ml-4 list-decimal space-y-1">
                                <li>
                                    Tạo account tại{" "}
                                    <a
                                        href="https://mapbox.com"
                                        target="_blank"
                                        className="underline"
                                    >
                                        mapbox.com
                                    </a>
                                </li>
                                <li>Lấy Access Token miễn phí</li>
                                <li>
                                    Thêm vào .env.local:
                                    <br />
                                    <code className="bg-yellow-200 px-1 rounded text-xs">
                                        NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_token
                                    </code>
                                </li>
                                <li>Restart dev server</li>
                            </ol>
                        </div>
                    )}
                </div>
                <MapControls />
            </div>
        );
    }

    return (
        <div className={cn("relative", className)} suppressHydrationWarning>
            <div ref={mapContainer} className="w-full h-full relative z-0" />
            <MapControls />
            {/* Unified popup system - only 2 types: My Places or New Location */}
            {selectedPlace ? (
                <PlacePopup
                    place={selectedPlace}
                    onClose={() => setSelectedPlace(null)}
                    onViewDetails={() => {
                        console.log(
                            "View details for my place:",
                            selectedPlace.name || (selectedPlace as any).content
                        );
                        setShowDetailsDialog(true);
                    }}
                    onDelete={async () => {
                        if (
                            confirm(
                                "Bạn có chắc muốn xóa địa điểm này khỏi danh sách?"
                            )
                        ) {
                            try {
                                const placeType = (selectedPlace as any)
                                    .placeType;
                                let apiUrl = "";

                                if (placeType === "note") {
                                    // Delete location note
                                    apiUrl = `/api/location-notes?id=${selectedPlace.id}`;
                                } else {
                                    // Delete favorite place
                                    apiUrl = `/api/favorites?placeId=${selectedPlace.id}`;
                                }

                                const response = await fetch(apiUrl, {
                                    method: "DELETE",
                                });

                                if (!response.ok) {
                                    throw new Error("Failed to delete");
                                }

                                console.log(
                                    "Deleted:",
                                    selectedPlace.name ||
                                        (selectedPlace as any).content
                                );

                                setSelectedPlace(null);
                                // Trigger refresh of sidebar and map markers
                                window.dispatchEvent(
                                    new CustomEvent("favoritesUpdated")
                                );
                                window.dispatchEvent(
                                    new CustomEvent("locationNoteAdded")
                                );
                            } catch (error) {
                                console.error("Error deleting:", error);
                                alert(
                                    "Không thể xóa địa điểm. Vui lòng thử lại."
                                );
                            }
                        }
                    }}
                    mapRef={map}
                />
            ) : clickedLocation && !showLocationForm ? (
                <PlacePopup
                    location={clickedLocation}
                    onClose={() => setClickedLocation(null)}
                    onAddNote={handleOpenLocationForm}
                    mapRef={map}
                />
            ) : null}

            {clickedLocation && showLocationForm && (
                <LocationNoteForm
                    isOpen={showLocationForm}
                    onClose={() => {
                        setShowLocationForm(false);
                        setClickedLocation(null);
                    }}
                    location={clickedLocation}
                    onSubmit={handleAddLocationNote}
                />
            )}

            {selectedPlace && showDetailsDialog && (
                <NoteDetailsView
                    isOpen={showDetailsDialog}
                    onClose={() => {
                        setShowDetailsDialog(false);
                        setSelectedPlace(null);
                    }}
                    note={selectedPlace}
                    onEdit={() =>
                        console.log(
                            "Edit place:",
                            selectedPlace.name || (selectedPlace as any).content
                        )
                    }
                    onDelete={() =>
                        console.log(
                            "Delete place:",
                            selectedPlace.name || (selectedPlace as any).content
                        )
                    }
                />
            )}
        </div>
    );
}
