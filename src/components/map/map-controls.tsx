"use client";

import { useState, useCallback, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import { debounce } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    MapPin,
    Plus,
    Users,
    Search,
    Menu,
    Loader2,
    Navigation,
    NavigationOff,
} from "lucide-react";
import { useUIStore, useMapStore } from "@/lib/store";
import {
    getCurrentLocation,
    hasActiveRoute,
    removeRouteFromMap,
} from "@/lib/geolocation";
import { toast } from "sonner";

interface MapControlsProps {
    readonly mapRef?: React.RefObject<mapboxgl.Map>;
}

export function MapControls({ mapRef }: MapControlsProps) {
    const { sidebarOpen, setSidebarOpen } = useUIStore();
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
    const [showClearRoute, setShowClearRoute] = useState(false);

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
        } catch (error) {
            console.error("Could not get current location:", error);
            alert(
                "Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền truy cập vị trí."
            );
        }
    };

    // Handle add place button
    const handleAddPlace = () => {
        alert(
            "Chức năng thêm địa điểm sẽ được phát triển trong phiên bản tiếp theo."
        );
    };

    // Handle create group button
    const handleCreateGroup = () => {
        alert(
            "Chức năng tạo nhóm sẽ được phát triển trong phiên bản tiếp theo."
        );
    };

    // Handle clear route button
    const handleClearRoute = () => {
        if (mapRef) {
            const success = removeRouteFromMap(mapRef);
            if (success) {
                setShowClearRoute(false);
                toast.success("Đã tắt chỉ đường");
            } else {
                toast.error("Không thể tắt chỉ đường");
            }
        }
    };

    // Check for active route periodically
    useEffect(() => {
        if (!mapRef) return;

        const checkRoute = () => {
            const routeExists = hasActiveRoute(mapRef);
            setShowClearRoute(routeExists);
        };

        // Check immediately
        checkRoute();

        // Check every 1 second
        const interval = setInterval(checkRoute, 1000);

        return () => clearInterval(interval);
    }, [mapRef]);

    return (
        <>
            {/* Sidebar toggle */}
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-blue-300 shadow-md pointer-events-auto transition-all duration-200 hover:scale-105 active:scale-95"
                >
                    <Menu className="h-4 w-4" />
                </Button>
            </div>

            {/* Search control */}
            <div className="absolute top-4 left-16 right-4 md:right-20 z-10 pointer-events-none">
                <div className="relative pointer-events-auto">
                    <Card className="p-3 md:p-3 sm:p-2 bg-white shadow-lg border border-gray-200 rounded-xl">
                        <div className="flex items-center gap-3">
                            {isSearching ? (
                                <Loader2 className="h-4 w-4 text-blue-500 animate-spin flex-shrink-0" />
                            ) : (
                                <Search className="h-4 w-4 text-gray-500 flex-shrink-0" />
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
                                className="flex-1 outline-none text-sm bg-transparent text-gray-900 placeholder-gray-500"
                            />
                            {searchValue && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                        setSearchValue("");
                                        setSearchResults([]);
                                    }}
                                    className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
                                >
                                    ×
                                </Button>
                            )}
                        </div>
                    </Card>

                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && (
                        <Card className="absolute top-full mt-1 w-full bg-white shadow-xl border border-gray-200 max-h-64 overflow-y-auto">
                            {searchResults.map((place) => (
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
                                    className="w-full p-3 text-left hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-blue-50 focus:border-blue-200"
                                >
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm text-gray-900 truncate">
                                                {place.text}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">
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

            {/* Action buttons - Mobile optimized FAB */}
            <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-3 pointer-events-none">
                {/* Clear route button - only shown when route is active */}
                {showClearRoute && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearRoute}
                        className="w-12 h-12 md:w-12 md:h-12 rounded-full shadow-lg bg-red-50 hover:bg-red-100 text-red-600 border-2 border-red-200 hover:border-red-400 pointer-events-auto transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation"
                        title="Tắt chỉ đường"
                    >
                        <NavigationOff className="h-5 w-5" />
                    </Button>
                )}

                {/* Primary FAB - Add Place */}
                <Button
                    size="sm"
                    onClick={handleAddPlace}
                    className="w-14 h-14 md:w-12 md:h-12 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white border-2 border-white pointer-events-auto transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation"
                    title="Thêm địa điểm"
                >
                    <Plus className="h-6 w-6 md:h-5 md:w-5" />
                </Button>

                {/* Secondary FABs */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateGroup}
                    className="w-12 h-12 md:w-12 md:h-12 rounded-full shadow-lg bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 hover:border-blue-300 pointer-events-auto transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation"
                    title="Tạo nhóm"
                >
                    <Users className="h-5 w-5" />
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCurrentLocation}
                    className="w-12 h-12 md:w-12 md:h-12 rounded-full shadow-lg bg-white hover:bg-blue-50 text-blue-600 border-2 border-blue-200 hover:border-blue-400 pointer-events-auto transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation"
                    title="Vị trí của tôi"
                >
                    <Navigation className="h-5 w-5" />
                </Button>
            </div>
        </>
    );
}
