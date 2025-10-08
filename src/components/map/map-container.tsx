"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { flushSync } from "react-dom";
import { useSession } from "next-auth/react";
import mapboxgl from "mapbox-gl";
import {
  useMapStore,
  useUIStore,
  usePlaceStore,
  type LocationNote,
} from "@/lib/store";
import { PlacePopup } from "./place-popup";
import { MapControls } from "./map-controls";
import { LocationNoteForm } from "./location-note-form";
import { NoteDetailsView } from "./note-details-view";
import { CategoryType } from "@prisma/client";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react"; // Added for error UI
import { getCurrentLocation } from "@/lib/geolocation";
import {
  createMapPinElement,
  destroyMapPinElement,
  type ReactMapPinElement,
} from "./marker-helper";

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
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingNote, setEditingNote] = useState<{
    id: string;
    lng: number;
    lat: number;
    address: string;
    content: string;
    mood?: string;
    timestamp: Date;
    images?: string[];
  } | null>(null);

  const { center, zoom, setCenter, setZoom, setBounds } = useMapStore();
  const { sidebarOpen } = useUIStore();
  const { selectedNote, setSelectedNote } = usePlaceStore();

  // State for unified location notes system
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
      hasImages?: boolean;
    }>
  >([]);

  // Load location notes from API
  const loadLocationNotes = async () => {
    try {
      // Only fetch if user is logged in
      if (!session) {
        console.log("🚫 Not logged in, skipping location notes fetch");
        setLocationNotes([]);
        return;
      }

      console.log("🔍 Loading location notes for user:", session?.user?.email);

      const response = await fetch("/api/location-notes?includeImages=true", {
        method: "GET",
        credentials: "include", // 🔑 CRITICAL: Include cookies/session
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const notes = await response.json();
        console.log(
          "🔄 API returned notes:",
          notes.map((n: LocationNote) => ({
            id: n.id,
            mood: n.mood,
            content: n.content?.substring(0, 20),
            images: n.images?.length || 0,
          }))
        );

        // Add hasImages flag based on images array
        const notesWithFlags = notes.map((note: LocationNote) => ({
          ...note,
          hasImages: note.images && note.images.length > 0,
        }));

        setLocationNotes(notesWithFlags);
        console.log("📍 Loaded", notesWithFlags.length, "location notes");
      } else if (response.status === 401) {
        console.log("� Unauthorized - user session may have expired");
        setLocationNotes([]);
      } else {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
    } catch (error) {
      console.error("Error loading location notes:", error);
      setLocationNotes([]);
    }
  };

  // State for details view (unified with places)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Check if Mapbox token is available
  const hasMapboxToken =
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN &&
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN !== "your-mapbox-token-here";

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
      map.current?.addControl(new mapboxgl.NavigationControl(), "top-right");
    });

    map.current.on("moveend", () => {
      if (!map.current || isUserInteracting.current) return;

      const newCenter = map.current.getCenter();
      const newZoom = map.current.getZoom();
      const bounds = map.current.getBounds();

      setCenter([newCenter.lng, newCenter.lat]);
      setZoom(newZoom);

      if (bounds) {
        setBounds({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        });
      }
    });

    map.current.on("error", (error) => {
      console.error("Map error:", error);
      setMapError("Lỗi tải bản đồ. Vui lòng kiểm tra kết nối internet.");
    });

    // Add click handler to add new places
    map.current.on("click", async (e) => {
      const { lng, lat } = e.lngLat;
      console.log("🗺️ Map clicked at:", { lng, lat });

      // Clear selected note when clicking on map
      console.log("🗺️ Clearing selectedNote due to map click");
      setSelectedNote(null);

      // Get address using reverse geocoding
      try {
        const accessToken =
          mapboxgl.accessToken || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
        if (!accessToken) {
          throw new Error("Mapbox access token not available");
        }

        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${accessToken}&language=vi,en&country=vn`
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMapboxToken]); // Only depend on token - avoid re-initializing map when store values change

  // Load location notes on component mount and when session changes
  useEffect(() => {
    if (mapLoaded) {
      loadLocationNotes();
    }
  }, [mapLoaded, session]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debug selectedNote changes
  useEffect(() => {
    console.log(
      "📍 selectedNote changed:",
      selectedNote
        ? {
            id: selectedNote.id,
            content: selectedNote.content?.substring(0, 20),
          }
        : "null"
    );
  }, [selectedNote]);

  // Create marker click handler that doesn't change with selectedNote
  const handleMarkerClick = useCallback(
    (note: LocationNote) => {
      console.log(
        "🎯 Marker clicked, setting selectedNote:",
        note.content?.substring(0, 20)
      );
      setSelectedNote(note);
      console.log(
        "🎯 After setSelectedNote, current selectedNote should be:",
        note.id
      );
    },
    [setSelectedNote]
  );

  // Debug useEffect for state changes
  useEffect(() => {
    console.log("🔍 State changes:", {
      selectedNote: selectedNote
        ? {
            id: selectedNote.id,
            content: selectedNote.content?.substring(0, 20),
          }
        : null,
      clickedLocation: !!clickedLocation,
      showLocationForm,
      showDetailsDialog,
    });
  }, [selectedNote, clickedLocation, showLocationForm, showDetailsDialog]);

  // Add location note markers
  useEffect(() => {
    if (!map.current || !mapLoaded) {
      console.log("🗺️ Map not ready for markers:", {
        mapExists: !!map.current,
        mapLoaded,
      });
      return;
    }

    console.log(
      "🗺️ Adding markers for",
      locationNotes.length,
      "location notes"
    );

    if (locationNotes.length === 0) {
      console.log("⚠️ No location notes to display on map");
      return;
    }

    // Remove existing markers (including React markers)
    const existingMarkers = document.querySelectorAll(
      ".place-marker, .react-map-pin"
    );
    console.log("🧹 Removing", existingMarkers.length, "existing markers");
    existingMarkers.forEach((marker) => {
      // Clean up React roots if any
      const reactMarker = marker as ReactMapPinElement;
      if (reactMarker._reactRoot) {
        destroyMapPinElement(reactMarker);
      }
      marker.remove();
    });

    // Add new markers using React components
    locationNotes.forEach((note) => {
      console.log(
        "📍 Creating marker for note:",
        note.content?.substring(0, 20),
        "at",
        note.lat,
        note.lng,
        "images:",
        note.images?.length || 0
      );

      // Determine if this marker is selected
      const isSelected = selectedNote && selectedNote.id === note.id;

      // Create React marker element
      const markerElement = createMapPinElement({
        category: "cafe" as CategoryType, // Default category for location notes
        note: note,
        mood: note.mood,
        isSelected: !!isSelected,
        onClick: () => handleMarkerClick(note),
      });

      new mapboxgl.Marker(markerElement)
        .setLngLat([note.lng, note.lat])
        .addTo(map.current!);
    });

    console.log(
      "✅ Successfully added",
      locationNotes.length,
      "markers to map"
    );

    // Auto focus on first result if there's a search
    if (locationNotes.length > 0 && locationNotes.length <= 5) {
      const bounds = new mapboxgl.LngLatBounds();
      locationNotes.forEach((note) => {
        bounds.extend([note.lng, note.lat]);
      });

      if (locationNotes.length === 1) {
        // Single result - fly to it
        map.current?.flyTo({
          center: [locationNotes[0].lng, locationNotes[0].lat],
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
  }, [locationNotes, mapLoaded, selectedNote, handleMarkerClick]);

  // Location note markers are now the main marker system
  // This useEffect is disabled to prevent duplicate markers
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    console.log("🔄 Location notes are the unified marker system");

    // Remove any old location note markers if they exist
    const existingNoteMarkers = document.querySelectorAll(
      ".location-note-marker"
    );
    existingNoteMarkers.forEach((marker) => marker.remove());

    // Note: locationNotes are now the primary marker system
  }, [mapLoaded]);

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

  // Fly to selected note
  useEffect(() => {
    if (!map.current || !selectedNote) return;

    map.current.flyTo({
      center: [selectedNote.lng, selectedNote.lat],
      zoom: 16,
      duration: 1000,
    });
  }, [selectedNote]);

  // Handle adding location note
  const handleAddLocationNote = async (noteData: {
    id?: string;
    lng: number;
    lat: number;
    address: string;
    content?: string;
    mood?: string;
    images?: string[];
    category?: string;
    placeName?: string;
    visitTime?: string;
    timestamp?: Date;
    coverImageIndex?: number;
  }) => {
    try {
      console.log("📝 Adding location note to local state:", noteData);

      // Ensure we have a valid ID from the form's API call
      if (!noteData.id) {
        console.error("❌ Note ID is missing, cannot add to local state");
        throw new Error("Note ID is required");
      }

      // Create the note object for local state
      const savedNote = {
        id: noteData.id,
        lng: noteData.lng,
        lat: noteData.lat,
        address: noteData.address,
        content: noteData.content || "",
        mood: noteData.mood,
        images: noteData.images || [],
        timestamp: noteData.timestamp || new Date(),
        hasImages: (noteData.images || []).length > 0,
      };

      // Add to local state immediately for instant UI update
      console.log(
        "📍 Adding note to local state for immediate marker display:",
        {
          id: savedNote.id,
          content: savedNote.content?.substring(0, 20),
          coordinates: [savedNote.lng, savedNote.lat],
        }
      );

      // Use flushSync to ensure immediate state update
      flushSync(() => {
        setLocationNotes((prev) => {
          const updated = [...prev, savedNote];
          console.log("📍 Updated locationNotes count:", updated.length);
          return updated;
        });
      });

      // Close forms
      setClickedLocation(null);
      setShowLocationForm(false);

      // Dispatch event to update sidebar
      window.dispatchEvent(new CustomEvent("locationNoteAdded"));

      console.log("✅ Location note added to local state and sidebar notified");
    } catch (error: unknown) {
      console.error("❌ Error adding location note to local state:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      alert(`Có lỗi xảy ra khi thêm ghi chú: ${errorMessage}`);
    }
  };

  // Handle editing location note
  const handleEditLocationNote = async (noteData: {
    category?: string;
    content?: string;
    placeName?: string;
    visitTime?: string;
    mood?: string;
    id?: string;
    lng: number;
    lat: number;
    address: string;
    timestamp?: Date;
    images?: string[];
    coverImageIndex?: number;
  }) => {
    try {
      console.log("Editing location note:", noteData);

      if (!noteData.id) {
        throw new Error("Note ID is required for editing");
      }

      // Update via API
      const response = await fetch("/api/location-notes", {
        method: "PUT",
        credentials: "include", // 🔑 Include session
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: noteData.id,
          lng: noteData.lng,
          lat: noteData.lat,
          address: noteData.address,
          content: noteData.content,
          mood: noteData.mood,
          categoryIds: noteData.category ? [noteData.category] : [], // Convert single category to array for API
          images: noteData.images || [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update note");
      }

      const updatedNote = await response.json();

      // Update local state
      console.log("📝 Updating note in local state:", updatedNote);
      setLocationNotes((prev) =>
        prev.map((note) => (note.id === updatedNote.id ? updatedNote : note))
      );

      // Close edit form
      setShowEditForm(false);
      setEditingNote(null);

      // Update selected note with new data so details view shows updated info
      if (selectedNote && selectedNote.id === updatedNote.id) {
        setSelectedNote({
          ...selectedNote,
          content: updatedNote.content,
          mood: updatedNote.mood,
          timestamp: updatedNote.timestamp,
          images: updatedNote.images,
        });
      }

      // Dispatch event to update sidebar
      window.dispatchEvent(new CustomEvent("locationNoteUpdated"));

      console.log("✅ Location note updated and sidebar notified");
    } catch (error: unknown) {
      console.error("Error updating location note:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      alert(`Có lỗi xảy ra khi cập nhật ghi chú: ${errorMessage}`);
    }
  };

  // Simplified note actions (unified with places)

  // Handle opening location form from preview
  const handleOpenLocationForm = () => {
    setShowLocationForm(true);
  };

  // Add or update user location marker
  const updateUserLocationMarker = useCallback(async () => {
    if (!map.current || !session) return;

    // Create user location marker element (Google Maps style)
    const createUserLocationMarker = () => {
      // Main container with pulse animation
      const markerElement = document.createElement("div");
      markerElement.className = "user-location-marker";
      markerElement.style.cssText = `
              width: 40px;
              height: 40px;
              position: relative;
              cursor: pointer;
              pointer-events: auto;
          `;

      // Pulse background circle (animated)
      const pulseCircle = document.createElement("div");
      pulseCircle.className = "user-location-pulse";
      pulseCircle.style.cssText = `
              position: absolute;
              top: 50%;
              left: 50%;
              width: 40px;
              height: 40px;
              background: rgba(66, 133, 244, 0.3);
              border-radius: 50%;
              transform: translate(-50%, -50%);
              animation: userLocationPulse 2s infinite ease-out;
          `;

      // Accuracy circle (static, larger)
      const accuracyCircle = document.createElement("div");
      accuracyCircle.className = "user-location-accuracy";
      accuracyCircle.style.cssText = `
              position: absolute;
              top: 50%;
              left: 50%;
              width: 30px;
              height: 30px;
              background: rgba(66, 133, 244, 0.2);
              border: 2px solid rgba(66, 133, 244, 0.5);
              border-radius: 50%;
              transform: translate(-50%, -50%);
          `;

      // Main dot with user avatar or icon
      const mainDot = document.createElement("div");
      mainDot.className = "user-location-dot";
      mainDot.style.cssText = `
              position: absolute;
              top: 50%;
              left: 50%;
              width: 20px;
              height: 20px;
              background: #4285f4;
              border: 3px solid white;
              border-radius: 50%;
              transform: translate(-50%, -50%);
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              z-index: 3;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
          `;

      // User avatar or default icon inside the dot
      if (session?.user?.image) {
        const img = document.createElement("img");
        img.src = session.user.image;
        img.style.cssText = `
                  width: 14px;
                  height: 14px;
                  border-radius: 50%;
                  object-fit: cover;
                  display: block;
              `;
        img.onerror = () => {
          // Fallback to white dot if image fails
          mainDot.style.background = "#4285f4";
        };
        mainDot.appendChild(img);
      }

      // Add CSS animation keyframes to document
      if (!document.querySelector("#user-location-styles")) {
        const style = document.createElement("style");
        style.id = "user-location-styles";
        style.textContent = `
          @keyframes userLocationPulse {
            0% {
              transform: translate(-50%, -50%) scale(0.8);
              opacity: 1;
            }
            100% {
              transform: translate(-50%, -50%) scale(2.5);
              opacity: 0;
            }
          }
          
          .user-location-marker:hover .user-location-dot {
            transform: translate(-50%, -50%) scale(1.2);
            transition: transform 0.2s ease;
          }

          .user-location-marker:hover .user-location-accuracy {
            border-color: rgba(66, 133, 244, 0.8);
            background: rgba(66, 133, 244, 0.3);
            transition: all 0.2s ease;
          }

          .user-location-dot {
            transition: transform 0.2s ease;
          }
        `;
        document.head.appendChild(style);
      }

      // Assemble the marker
      markerElement.appendChild(pulseCircle);
      markerElement.appendChild(accuracyCircle);
      markerElement.appendChild(mainDot);

      // Click handler
      markerElement.addEventListener("click", (e) => {
        e.stopPropagation();
        console.log("📍 User location marker clicked");

        // Add click animation
        mainDot.style.transform = "translate(-50%, -50%) scale(0.8)";
        setTimeout(() => {
          mainDot.style.transform = "translate(-50%, -50%) scale(1)";
          mainDot.style.transition = "transform 0.2s ease";
        }, 100);
      });

      return markerElement;
    };

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
          console.log("📍 User location unchanged, keeping existing marker");
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

      console.log("✅ User location marker created with Google Maps style");
    } catch (error) {
      console.error("❌ Could not get user location:", error);
    }
  }, [session]);

  // Add user location marker when user logs in
  useEffect(() => {
    if (mapLoaded && session) {
      updateUserLocationMarker();
    } else if (!session && userLocationMarker.current) {
      // Remove marker when user logs out
      userLocationMarker.current.remove();
      userLocationMarker.current = null;
    }
  }, [mapLoaded, session, updateUserLocationMarker]);

  // Handle map resize when sidebar toggles
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Add a small delay to allow CSS transition to complete
    const timeoutId = setTimeout(() => {
      console.log("🔄 Resizing map after sidebar toggle");
      map.current?.resize();
    }, 350); // Slightly longer than the 300ms transition

    return () => clearTimeout(timeoutId);
  }, [sidebarOpen, mapLoaded]);

  // Add ResizeObserver as additional safeguard for map container resizing
  useEffect(() => {
    if (!map.current || !mapLoaded || !mapContainer.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (map.current) {
        console.log("🔄 Map container size changed, resizing map");
        map.current.resize();
      }
    });

    resizeObserver.observe(mapContainer.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [mapLoaded]);

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
        <MapControls mapRef={map} />
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} suppressHydrationWarning>
      <div ref={mapContainer} className="w-full h-full relative z-0" />
      <MapControls mapRef={map} />
      {/* Unified popup system - only 2 types: My Notes or New Location */}
      {selectedNote && (
        <PlacePopup
          note={selectedNote}
          mapRef={
            map.current ? (map as React.RefObject<mapboxgl.Map>) : undefined
          }
          onClose={() => setSelectedNote(null)}
          onViewDetails={() => {
            console.log(
              "View details for note:",
              selectedNote.content?.substring(0, 20)
            );
            setShowDetailsDialog(true);
          }}
          onDelete={async () => {
            if (confirm("Bạn có chắc muốn xóa ghi chú này?")) {
              try {
                const response = await fetch(
                  `/api/location-notes?id=${selectedNote.id}`,
                  {
                    method: "DELETE",
                    credentials: "include", // 🔑 Include session
                  }
                );

                if (!response.ok) {
                  throw new Error("Failed to delete");
                }

                console.log(
                  "Deleted note:",
                  selectedNote.content?.substring(0, 20)
                );

                // Update local state to remove the deleted note
                setLocationNotes((prev) =>
                  prev.filter((note) => note.id !== selectedNote.id)
                );

                setSelectedNote(null);
                // Trigger refresh of sidebar and map markers
                window.dispatchEvent(new CustomEvent("locationNoteUpdated"));
              } catch (error) {
                console.error("Error deleting:", error);
                alert("Không thể xóa ghi chú. Vui lòng thử lại.");
              }
            }
          }}
        />
      )}

      {clickedLocation && !showLocationForm && !selectedNote && (
        <PlacePopup
          location={{
            lng: clickedLocation.lng,
            lat: clickedLocation.lat,
            address: clickedLocation.address || "",
          }}
          mapRef={
            map.current ? (map as React.RefObject<mapboxgl.Map>) : undefined
          }
          onClose={() => setClickedLocation(null)}
          onAddNote={handleOpenLocationForm}
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

      {editingNote && showEditForm && (
        <LocationNoteForm
          isOpen={showEditForm}
          onClose={() => {
            setShowEditForm(false);
            setEditingNote(null);
          }}
          location={{
            lng: editingNote.lng,
            lat: editingNote.lat,
            address: editingNote.address,
          }}
          existingNote={{
            id: editingNote.id,
            content: editingNote.content,
            mood: editingNote.mood,
            images: editingNote.images,
          }}
          onSubmit={handleEditLocationNote}
        />
      )}

      {selectedNote && showDetailsDialog && (
        <NoteDetailsView
          isOpen={showDetailsDialog}
          onClose={() => {
            setShowDetailsDialog(false);
            setSelectedNote(null);
          }}
          note={selectedNote}
          onEdit={() => {
            // All selected notes are location notes with content
            setEditingNote(selectedNote);
            setShowEditForm(true);
          }}
          onDelete={() =>
            console.log("Delete note:", selectedNote.content?.substring(0, 20))
          }
        />
      )}
    </div>
  );
}
