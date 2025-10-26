"use client";

import { useState, useCallback, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import { debounce } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    MapPin,
    Search,
    Menu,
    Loader2,
    Navigation,
    PlusCircle,
    Compass,
    X,
    Calendar,
} from "lucide-react";
import { useUIStore, useMapStore } from "@/lib/store";
import { getCurrentLocation, removeRouteFromMap } from "@/lib/geolocation";
import { toast } from "sonner";
import { LocationNoteForm } from "./location-note-form";
import { DirectionPopup } from "./direction-popup";

interface MapControlsProps {
    readonly mapRef?: React.RefObject<mapboxgl.Map | null>;
}

export function MapControls({ mapRef }: MapControlsProps) {
    const { sidebarOpen, setSidebarOpen, setShowMemoryLane } = useUIStore();
    const { setCenter, setZoom } = useMapStore();
    const [searchValue, setSearchValue] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<
        Array<{
            text: string;
            place_name: string;
            center: [number, number];
        }>
    >([]);

    // State for direction popup
    const [showDirectionPopup, setShowDirectionPopup] = useState(false);
    const [directionInfo, setDirectionInfo] = useState<{
        destination: {
            name: string;
            address: string;
            lat: number;
            lng: number;
        };
        routeInfo: {
            duration: number;
            distance: number;
        };
    } | null>(null);

    // State for add place functionality
    const [showPlaceForm, setShowPlaceForm] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<{
        lng: number;
        lat: number;
        address?: string;
    } | null>(null);

    // State for FAB group
    const [fabExpanded, setFabExpanded] = useState(false);

    // Search địa điểm thật qua Mapbox Geocoding API
    const searchPlaces = async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        try {
            const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

            // Try multiple search strategies
            const searches = [
                // 1. POI-focused search
                {
                    params: new URLSearchParams({
                        access_token: accessToken || "",
                        country: "vn",
                        language: "vi,en",
                        limit: "5",
                        proximity: "105.8542,21.0285",
                        types: "poi",
                        autocomplete: "true",
                        bbox: "105.0,20.5,106.5,21.5",
                    }),
                    label: "POI search",
                },
                // 2. Place search (broader)
                {
                    params: new URLSearchParams({
                        access_token: accessToken || "",
                        country: "vn",
                        language: "vi,en",
                        limit: "5",
                        proximity: "105.8542,21.0285",
                        types: "place",
                        autocomplete: "true",
                    }),
                    label: "Place search",
                },
                // 3. General search
                {
                    params: new URLSearchParams({
                        access_token: accessToken || "",
                        country: "vn",
                        language: "vi,en",
                        limit: "3",
                        proximity: "105.8542,21.0285",
                        autocomplete: "true",
                    }),
                    label: "General search",
                },
            ];

            const allResults: Array<{
                text: string;
                place_name: string;
                center: [number, number];
            }> = [];

            // Try each search strategy
            for (const search of searches) {
                const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${search.params}`;
                console.log(`🔍 ${search.label}:`, url);

                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.features && data.features.length > 0) {
                            console.log(
                                `✅ ${search.label} found ${data.features.length} results`
                            );
                            allResults.push(...data.features);
                        }
                    }
                } catch (searchError) {
                    console.warn(`⚠️ ${search.label} failed:`, searchError);
                }
            }

            // Remove duplicates and limit results
            const uniqueResults = allResults
                .filter(
                    (item, index, arr) =>
                        arr.findIndex(
                            (other) => other.place_name === item.place_name
                        ) === index
                )
                .slice(0, 8);

            console.log("🔍 Final search results:", uniqueResults);
            setSearchResults(uniqueResults);
        } catch (error) {
            console.error("Error searching places:", error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    // Debounced search to avoid too many API calls
    const debouncedSearch = useCallback((query: string) => {
        const debouncedFn = debounce(searchPlaces, 500);
        debouncedFn(query);
    }, []);

    const handleSearch = (value: string) => {
        setSearchValue(value);
        if (value.trim()) {
            debouncedSearch(value);
        } else {
            setSearchResults([]);
            setIsSearching(false);
        }
    };

    const handleSelectPlace = (place: {
        text: string;
        place_name: string;
        center: [number, number];
    }) => {
        const [lng, lat] = place.center;

        // Trigger programmatic map movement
        setCenter([lng, lat]);
        setZoom(16);

        setSearchValue(place.place_name);
        setSearchResults([]);
    };

    // Handle current location button
    const handleCurrentLocation = async () => {
        try {
            const userLocation = await getCurrentLocation();
            setCenter([userLocation.lng, userLocation.lat]);
            setZoom(16);
            setFabExpanded(false); // Collapse FAB after action
        } catch (error) {
            console.error("Could not get current location:", error);
            alert(
                "Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền truy cập vị trí."
            );
        }
    };

    // Handle add place button
    const handleAddPlace = async () => {
        try {
            // Get current location
            const userLocation = await getCurrentLocation();

            // Get address using reverse geocoding
            const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
            let address = "Vị trí hiện tại của bạn";

            try {
                const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${userLocation.lng},${userLocation.lat}.json?access_token=${accessToken}&language=vi`;
                const response = await fetch(geocodeUrl);

                if (response.ok) {
                    const data = await response.json();
                    if (data.features && data.features.length > 0) {
                        address = data.features[0].place_name;
                    }
                }
            } catch (geocodeError) {
                console.warn(
                    "Could not get address for current location:",
                    geocodeError
                );
            }

            // Set location data and show form
            setCurrentLocation({
                lng: userLocation.lng,
                lat: userLocation.lat,
                address: address,
            });
            setShowPlaceForm(true);

            // Collapse FAB after action
            setFabExpanded(false);

            toast.success("Đang mở form thêm địa điểm tại vị trí hiện tại");
        } catch (error) {
            console.error("Could not get current location:", error);
            toast.error(
                "Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền truy cập vị trí."
            );
        }
    };

    // Handle place form submission
    const handlePlaceSubmit = async (noteData: {
        category: string;
        placeName: string;
        visitTime: string;
        content?: string;
        mood?: "😍" | "😊" | "😐" | "🙁" | "😴";
        id?: string;
        lng: number;
        lat: number;
        address: string;
        timestamp: Date;
        images?: string[];
        coverImageIndex?: number;
    }) => {
        try {
            // The LocationNoteForm already handles creating the note via API
            // Just close the form and show success message
            setShowPlaceForm(false);
            setCurrentLocation(null);

            console.log("Place added successfully:", noteData.id);
            toast.success("Đã thêm địa điểm thành công!");

            // Trigger map to refresh location notes
            window.dispatchEvent(new CustomEvent("locationNoteAdded"));
        } catch (error) {
            console.error("Error handling place submission:", error);
            toast.error("Có lỗi xảy ra khi thêm địa điểm");
        }
    };

    // Handle clear route button
    const handleClearRoute = () => {
        console.log("🔴 handleClearRoute called", {
            hasMapRef: !!mapRef,
            hasMapRefCurrent: !!mapRef?.current,
        });

        if (mapRef?.current) {
            console.log("🗺️ Attempting to remove route from map...");
            const success = removeRouteFromMap(mapRef);
            console.log("🗺️ Remove route result:", success);

            if (success) {
                setShowDirectionPopup(false);
                setDirectionInfo(null);

                // Emit route cleared event
                window.dispatchEvent(new CustomEvent("routeCleared"));

                toast.success("Đã tắt chỉ đường");
            } else {
                toast.error("Không thể tắt chỉ đường");
            }
        } else {
            console.log("⚠️ mapRef not available, clearing UI state only");
            // If mapRef not available, still clear the UI state
            setShowDirectionPopup(false);
            setDirectionInfo(null);
            window.dispatchEvent(new CustomEvent("routeCleared"));
            toast.success("Đã tắt chỉ đường");
        }
    };

    // Listen for route events (independent of mapRef)
    useEffect(() => {
        // Listen for route creation events
        const handleRouteCreated = (event: CustomEvent) => {
            const { destination, routeInfo } = event.detail;
            setDirectionInfo({ destination, routeInfo });
            setShowDirectionPopup(true);
        };

        // Listen for route cleared events
        const handleRouteCleared = () => {
            setShowDirectionPopup(false);
            setDirectionInfo(null);
        };

        // Add event listeners immediately
        window.addEventListener(
            "routeCreated",
            handleRouteCreated as EventListener
        );
        window.addEventListener("routeCleared", handleRouteCleared);

        return () => {
            window.removeEventListener(
                "routeCreated",
                handleRouteCreated as EventListener
            );
            window.removeEventListener("routeCleared", handleRouteCleared);
        };
    }, []);

    // Close FAB when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            // Check if click is outside FAB group
            if (fabExpanded && !target.closest(".fab-group")) {
                setFabExpanded(false);
            }
        };

        if (fabExpanded) {
            document.addEventListener("click", handleClickOutside);
            return () =>
                document.removeEventListener("click", handleClickOutside);
        }
    }, [fabExpanded]);

    return (
        <>
            {/* Sidebar toggle - Enhanced */}
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="bg-white/95 hover:bg-white text-neutral-800 border border-neutral-300/50 hover:border-[#FF6B6B]/40 shadow-lg hover:shadow-xl pointer-events-auto transition-all duration-300 hover:scale-105 active:scale-95 backdrop-blur-sm rounded-xl"
                >
                    <Menu className="h-4 w-4" />
                </Button>
            </div>

            {/* Search control - Enhanced */}
            <div className="absolute top-3 left-16 z-10 pointer-events-none max-w-[70%]">
                <div className="relative pointer-events-auto">
                    <Card className="h-12 px-4 py-2 bg-white/95 shadow-xl border border-neutral-300/50 rounded-2xl backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                        <div className="flex items-center gap-3 h-full">
                            {isSearching ? (
                                <Loader2 className="h-4 w-4 text-[#FF6B6B] animate-spin flex-shrink-0" />
                            ) : (
                                <Search className="h-4 w-4 text-[#FF6B6B] flex-shrink-0" />
                            )}
                            <input
                                type="text"
                                placeholder="Tìm kiếm địa chỉ, địa điểm tại Việt Nam..."
                                value={searchValue}
                                onChange={(e) => handleSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (
                                        e.key === "Enter" &&
                                        searchResults.length > 0
                                    ) {
                                        handleSelectPlace(searchResults[0]);
                                    }
                                    if (e.key === "Escape") {
                                        setSearchResults([]);
                                    }
                                }}
                                className="flex-1 outline-none text-sm bg-transparent text-neutral-900 placeholder-neutral-500 min-h-[44px] flex items-center font-medium"
                            />
                            {searchValue && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                        setSearchValue("");
                                        setSearchResults([]);
                                    }}
                                    className="h-7 w-7 p-0 text-neutral-400 hover:text-[#FF6B6B] hover:bg-[#FF6B6B]/10 rounded-lg transition-all duration-200"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </Card>

                    {/* Search Results Dropdown - Enhanced */}
                    {searchResults.length > 0 && (
                        <Card className="absolute top-full mt-2 w-full bg-white/95 shadow-2xl border border-neutral-300/50 max-h-96 overflow-y-auto rounded-2xl backdrop-blur-md">
                            {searchResults.map((place, index) => (
                                <button
                                    key={place.place_name}
                                    onClick={() => handleSelectPlace(place)}
                                    onKeyDown={(e) => {
                                        if (
                                            e.key === "Enter" ||
                                            e.key === " "
                                        ) {
                                            e.preventDefault();
                                            handleSelectPlace(place);
                                        }
                                    }}
                                    className={`w-full p-4 text-left hover:bg-gradient-to-r hover:from-[#FF6B6B]/10 hover:to-[#FF8E53]/10 cursor-pointer border-b border-neutral-200/50 last:border-b-0 focus:outline-none focus:bg-[#FF6B6B]/10 transition-all duration-200 group ${index === 0 ? "first:rounded-t-2xl" : ""} ${index === searchResults.length - 1 ? "last:rounded-b-2xl" : ""}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6B6B]/20 to-[#FF8E53]/20 group-hover:from-[#FF6B6B]/30 group-hover:to-[#FF8E53]/30 transition-all duration-200">
                                            <MapPin className="h-4 w-4 text-[#FF6B6B] flex-shrink-0" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-sm text-neutral-900 truncate group-hover:text-[#FF6B6B] transition-colors duration-200">
                                                {place.text}
                                            </div>
                                            <div className="text-xs text-neutral-500 truncate mt-0.5">
                                                {place.place_name}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </Card>
                    )}
                </div>
            </div>

            {/* FAB Group - Enhanced with Pinory colors */}
            <div className="fab-group absolute bottom-10 right-4 z-10 flex flex-col items-end gap-3 pointer-events-none">
                {/* Secondary FABs - Only show when expanded with curved animation */}
                <div
                    className={`flex flex-col gap-3 transition-all duration-400 ease-out ${
                        fabExpanded
                            ? "opacity-100 translate-y-0 scale-100"
                            : "opacity-0 translate-y-6 scale-90 pointer-events-none"
                    }`}
                >
                    {/* Current Location FAB */}
                    <div
                        className={`transition-all duration-400 ease-out ${
                            fabExpanded
                                ? "translate-x-0 translate-y-0 rotate-0"
                                : "translate-x-8 translate-y-8 rotate-12"
                        }`}
                        style={{
                            transitionDelay: fabExpanded ? "100ms" : "0ms",
                        }}
                    >
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCurrentLocation}
                            className="w-12 h-12 rounded-full shadow-xl bg-white/95 hover:bg-white text-[#FF8E53] border-2 border-[#FF8E53]/30 hover:border-[#FF8E53] hover:shadow-[#FF8E53]/40 pointer-events-auto transition-all duration-300 hover:scale-110 active:scale-95 touch-manipulation backdrop-blur-sm"
                            title="Vị trí của tôi"
                        >
                            <Navigation className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Memory Lane FAB */}
                    <div
                        className={`transition-all duration-400 ease-out ${
                            fabExpanded
                                ? "translate-x-0 translate-y-0 rotate-0"
                                : "translate-x-6 translate-y-6 rotate-8"
                        }`}
                        style={{
                            transitionDelay: fabExpanded ? "150ms" : "0ms",
                        }}
                    >
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setShowMemoryLane(true);
                                setFabExpanded(false);
                            }}
                            className="w-12 h-12 rounded-full shadow-xl bg-white/95 hover:bg-white text-[#FFD6A5] border-2 border-[#FFD6A5]/30 hover:border-[#FFD6A5] hover:shadow-[#FFD6A5]/40 pointer-events-auto transition-all duration-300 hover:scale-110 active:scale-95 touch-manipulation backdrop-blur-sm"
                            title="Xem lại kỷ niệm"
                        >
                            <Calendar className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Add Place FAB */}
                    <div
                        className={`transition-all duration-400 ease-out ${
                            fabExpanded
                                ? "translate-x-0 translate-y-0 rotate-0"
                                : "translate-x-4 translate-y-4 rotate-4"
                        }`}
                        style={{
                            transitionDelay: fabExpanded ? "200ms" : "0ms",
                        }}
                    >
                        <Button
                            size="sm"
                            onClick={handleAddPlace}
                            className="w-12 h-12 rounded-full shadow-xl bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] hover:from-[#FF5555] hover:to-[#FF7A3D] text-white border-2 border-white hover:shadow-[#FF6B6B]/60 pointer-events-auto transition-all duration-300 hover:scale-110 active:scale-95 touch-manipulation"
                            title="Thêm ghi chú"
                        >
                            <PlusCircle className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Primary FAB - Always visible with enhanced gradient */}
                <Button
                    size="sm"
                    onClick={() => setFabExpanded(!fabExpanded)}
                    className={`w-14 h-14 md:w-14 md:h-14 rounded-full shadow-xl text-white border-2 border-white pointer-events-auto transition-all duration-300 hover:scale-110 active:scale-95 touch-manipulation relative overflow-hidden ${
                        fabExpanded
                            ? "bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 hover:shadow-red-600/60"
                            : "bg-gradient-to-br from-[#FF6B6B] to-[#FF8E53] hover:from-[#FF5555] hover:to-[#FF7A3D] hover:shadow-[#FF6B6B]/60"
                    }`}
                    title={fabExpanded ? "Đóng menu" : "Menu"}
                >
                    {/* Animated shimmer effect */}
                    {!fabExpanded && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] animate-shimmer"></div>
                    )}
                    {fabExpanded ? (
                        <X className="h-6 w-6 md:h-5 md:w-5 transition-all duration-300 relative z-10" />
                    ) : (
                        <Compass className="h-6 w-6 md:h-5 md:w-5 transition-all duration-300 relative z-10" />
                    )}
                </Button>
            </div>

            {/* Place Form Dialog */}
            {currentLocation && showPlaceForm && (
                <LocationNoteForm
                    isOpen={showPlaceForm}
                    onClose={() => {
                        setShowPlaceForm(false);
                        setCurrentLocation(null);
                    }}
                    location={currentLocation}
                    onSubmit={handlePlaceSubmit}
                />
            )}

            {/* Direction Popup */}
            <DirectionPopup
                isVisible={showDirectionPopup}
                destination={directionInfo?.destination}
                routeInfo={directionInfo?.routeInfo}
                onClose={handleClearRoute}
            />
        </>
    );
}
