"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { useMapStore, usePlaceStore } from "@/lib/store";
import { PlacePopup } from "./place-popup";
import { MapControls } from "./map-controls";
import { LocationNoteForm } from "./location-note-form";
import { NoteDetailsView } from "./note-details-view";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react"; // Added for error UI

// Set the Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

interface MapContainerProps {
    className?: string;
}

export function MapContainer({ className }: MapContainerProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapError, setMapError] = useState<string | null>(null);
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
                setLocationNotes(notes);
                console.log("📍 Loaded", notes.length, "location notes");
            }
        } catch (error) {
            console.error("Error loading location notes:", error);
        }
    };

    // State for selected note and views
    const [selectedNote, setSelectedNote] = useState<{
        id: string;
        lng: number;
        lat: number;
        address: string;
        content: string;
        mood?: string;
        timestamp: Date;
        images?: string[];
    } | null>(null);
    const [showNoteDetails, setShowNoteDetails] = useState(false);

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
                const response = await fetch(
                    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`
                );
                const data = await response.json();
                const address =
                    data.features?.[0]?.place_name ||
                    `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

                setClickedLocation({ lng, lat, address });
                setShowLocationForm(false); // Reset form visibility on new click
            } catch (error) {
                console.error("Reverse geocoding failed:", error);
                setClickedLocation({
                    lng,
                    lat,
                    address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
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
                place.lng
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
                    ${place.category === "cafe" ? "☕" : place.category === "food" ? "🍜" : place.category === "bar" ? "🍻" : place.category === "rooftop" ? "🏙️" : place.category === "activity" ? "🎯" : "🏛️"}
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
                setSelectedPlace(place);
                console.log("Clicked place:", place.name);
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

    // Add location note markers
    useEffect(() => {
        if (!map.current || !mapLoaded) return;

        console.log(
            "🗺️ Adding markers for",
            locationNotes.length,
            "location notes"
        );

        // Remove existing note markers
        const existingNoteMarkers = document.querySelectorAll(
            ".location-note-marker"
        );
        existingNoteMarkers.forEach((marker) => marker.remove());

        locationNotes.forEach((note) => {
            console.log(
                "📝 Creating note marker for:",
                note.content.substring(0, 30) + "..."
            );

            const markerElement = document.createElement("div");
            markerElement.className = "location-note-marker";
            markerElement.innerHTML = `
                <div style="
                    width: 28px;
                    height: 28px;
                    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                    border: 2px solid white;
                    border-radius: 50%;
                    cursor: pointer;
                    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 14px;
                    font-weight: bold;
                ">
                    ${note.mood || "📝"}
                </div>
            `;

            const innerDiv = markerElement.querySelector("div");

            markerElement.addEventListener("mouseenter", () => {
                if (innerDiv) {
                    innerDiv.style.transform = "scale(1.15)";
                    innerDiv.style.boxShadow =
                        "0 4px 12px rgba(16, 185, 129, 0.6)";
                }
            });

            markerElement.addEventListener("mouseleave", () => {
                if (innerDiv) {
                    innerDiv.style.transform = "scale(1)";
                    innerDiv.style.boxShadow =
                        "0 2px 8px rgba(16, 185, 129, 0.4)";
                }
            });

            new mapboxgl.Marker(markerElement)
                .setLngLat([note.lng, note.lat])
                .addTo(map.current!);

            markerElement.addEventListener("click", (e) => {
                e.stopPropagation();
                setSelectedNote(note);
                console.log("Clicked note:", note.content);
            });
        });
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
            setLocationNotes((prev) => [...prev, savedNote]);
            setClickedLocation(null);
            setShowLocationForm(false);

            console.log("✅ Location note saved to database successfully");
        } catch (error) {
            console.error("Error adding location note:", error);
            alert(`Có lỗi xảy ra khi lưu ghi chú: ${error.message}`);
        }
    };

    // Handle note actions
    const handleViewNoteDetails = () => {
        setShowNoteDetails(true);
    };

    const handleEditNote = () => {
        // TODO: Implement edit functionality
        setShowNoteDetails(false);
        setSelectedNote(null);
        console.log("Edit note:", selectedNote?.id);
    };

    const handleDeleteNote = () => {
        if (selectedNote && confirm("Bạn có chắc muốn xóa ghi chú này?")) {
            setLocationNotes((prev) =>
                prev.filter((note) => note.id !== selectedNote.id)
            );
            setShowNoteDetails(false);
            setSelectedNote(null);
            console.log("Deleted note:", selectedNote.id);
        }
    };

    // Handle opening location form from preview
    const handleOpenLocationForm = () => {
        setShowLocationForm(true);
    };

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
            {selectedPlace && (
                <PlacePopup
                    place={selectedPlace}
                    onClose={() => setSelectedPlace(null)}
                    mapRef={map}
                />
            )}

            {selectedNote && !showNoteDetails && (
                <PlacePopup
                    note={selectedNote}
                    onClose={() => setSelectedNote(null)}
                    onViewDetails={handleViewNoteDetails}
                    mapRef={map}
                />
            )}

            {clickedLocation && !showLocationForm && (
                <PlacePopup
                    location={clickedLocation}
                    onClose={() => setClickedLocation(null)}
                    onAddNote={handleOpenLocationForm}
                    mapRef={map}
                />
            )}

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

            {selectedNote && showNoteDetails && (
                <NoteDetailsView
                    isOpen={showNoteDetails}
                    onClose={() => {
                        setShowNoteDetails(false);
                        setSelectedNote(null);
                    }}
                    note={selectedNote}
                    onEdit={handleEditNote}
                    onDelete={handleDeleteNote}
                />
            )}
        </div>
    );
}
