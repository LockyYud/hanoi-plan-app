"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, MapPin, Route, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrentLocation } from "@/lib/geolocation";
import { toast } from "sonner";

interface FloatingActionButtonProps {
    readonly onCreateNote: (location: {
        lng: number;
        lat: number;
        address?: string;
    }) => void;
    readonly onCreateJourney: () => void;
}

export function FloatingActionButton({
    onCreateNote,
    onCreateJourney,
}: FloatingActionButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            // Only trigger if not typing in an input
            if (
                event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            if (event.key === "n" || event.key === "N") {
                event.preventDefault();
                handleCreateNoteAtLocation();
            } else if (event.key === "j" || event.key === "J") {
                event.preventDefault();
                onCreateJourney();
                setIsOpen(false);
            } else if (event.key === "Escape" && isOpen) {
                event.preventDefault();
                setIsOpen(false);
            }
        };

        document.addEventListener("keydown", handleKeyPress);
        return () => {
            document.removeEventListener("keydown", handleKeyPress);
        };
    }, [isOpen, onCreateJourney]);

    const handleCreateNoteAtLocation = useCallback(async () => {
        setIsGettingLocation(true);
        setIsOpen(false);

        try {
            toast.loading("Đang lấy vị trí của bạn...", { id: "get-location" });

            const location = await getCurrentLocation();

            // Reverse geocoding to get address
            const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
            if (!accessToken) {
                throw new Error("Mapbox token not available");
            }

            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${location.lng},${location.lat}.json?access_token=${accessToken}&language=vi,en&country=vn`
            );

            if (!response.ok) {
                throw new Error("Geocoding failed");
            }

            const data = await response.json();
            const address =
                data.features?.[0]?.place_name ||
                `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;

            toast.success("Đã lấy vị trí!", { id: "get-location" });

            onCreateNote({
                lng: location.lng,
                lat: location.lat,
                address,
            });
        } catch (error) {
            console.error("Error getting location:", error);
            toast.error("Không thể lấy vị trí", {
                description:
                    error instanceof Error ? error.message : "Vui lòng thử lại",
                id: "get-location",
            });
        } finally {
            setIsGettingLocation(false);
        }
    }, [onCreateNote]);

    const handleToggle = () => {
        setIsOpen((prev) => !prev);
    };

    const handleCreateJourney = () => {
        onCreateJourney();
        setIsOpen(false);
    };

    return (
        <>
            {/* Backdrop with blur effect */}
            {isOpen && (
                <button
                    type="button"
                    aria-label="Đóng menu"
                    className="fixed inset-0 z-40 transition-all duration-300 backdrop-blur-[2px] bg-black/20 border-0 cursor-default"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* FAB Container */}
            <div
                ref={containerRef}
                className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-2 sm:gap-3"
            >
                {/* Speed Dial Options */}
                <div
                    className={cn(
                        "flex flex-col gap-3 transition-all duration-300 ease-out",
                        isOpen
                            ? "opacity-100 translate-y-0 pointer-events-auto"
                            : "opacity-0 translate-y-4 pointer-events-none"
                    )}
                >
                    {/* Option 1: Create Note at Current Location */}
                    <button
                        onClick={handleCreateNoteAtLocation}
                        disabled={isGettingLocation}
                        className={cn(
                            "group flex items-center gap-2 sm:gap-3 transition-all duration-200",
                            isOpen
                                ? "animate-fade-in-up delay-75"
                                : "animate-fade-out-down"
                        )}
                        style={{
                            animationDelay: isOpen ? "50ms" : "0ms",
                        }}
                        title="Ghi chú tại vị trí hiện tại (phím N)"
                    >
                        {/* Label - Hidden on mobile */}
                        <div className="hidden sm:block bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                            <span className="text-sm font-medium text-neutral-800">
                                Ghi chú tại đây
                            </span>
                            <span className="ml-2 text-xs text-neutral-500">
                                N
                            </span>
                        </div>

                        {/* Button */}
                        <div
                            className={cn(
                                "w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200",
                                "bg-white hover:bg-neutral-50 hover:shadow-xl hover:scale-110",
                                isGettingLocation &&
                                    "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <MapPin
                                className={cn(
                                    "h-5 w-5 sm:h-6 sm:w-6 text-blue-600",
                                    isGettingLocation && "animate-pulse"
                                )}
                            />
                        </div>
                    </button>

                    {/* Option 2: Create Journey */}
                    <button
                        onClick={handleCreateJourney}
                        className={cn(
                            "group flex items-center gap-2 sm:gap-3 transition-all duration-200",
                            isOpen
                                ? "animate-fade-in-up delay-100"
                                : "animate-fade-out-down"
                        )}
                        style={{
                            animationDelay: isOpen ? "100ms" : "0ms",
                        }}
                        title="Tạo hành trình mới (phím J)"
                    >
                        {/* Label - Hidden on mobile */}
                        <div className="hidden sm:block bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                            <span className="text-sm font-medium text-neutral-800">
                                Tạo hành trình
                            </span>
                            <span className="ml-2 text-xs text-neutral-500">
                                J
                            </span>
                        </div>

                        {/* Button */}
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white hover:bg-neutral-50 shadow-lg flex items-center justify-center transition-all duration-200 hover:shadow-xl hover:scale-110">
                            <Route className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                        </div>
                    </button>
                </div>

                {/* Main FAB Button */}
                <button
                    onClick={handleToggle}
                    className={cn(
                        "w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 relative overflow-hidden group",
                        "bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53]",
                        "hover:shadow-2xl hover:scale-105",
                        "active:scale-95",
                        isOpen && "rotate-45"
                    )}
                    title={isOpen ? "Đóng menu" : "Tạo mới"}
                    aria-label={isOpen ? "Đóng menu" : "Tạo mới"}
                    aria-expanded={isOpen}
                >
                    {/* Pulse effect when closed */}
                    {!isOpen && (
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] animate-ping opacity-20" />
                    )}

                    {/* Icon */}
                    <div className="relative z-10">
                        {isOpen ? (
                            <X className="h-6 w-6 sm:h-7 sm:w-7 text-white transition-transform duration-300" />
                        ) : (
                            <Plus className="h-6 w-6 sm:h-7 sm:w-7 text-white transition-transform duration-300" />
                        )}
                    </div>

                    {/* Hover glow effect */}
                    <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                </button>
            </div>

            {/* Global styles for animations */}
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes fade-in-up {
                        from {
                            opacity: 0;
                            transform: translateY(16px);
                        }
                        to {
                            opacity: 1;
                            transform: translateY(0);
                        }
                    }

                    @keyframes fade-out-down {
                        from {
                            opacity: 1;
                            transform: translateY(0);
                        }
                        to {
                            opacity: 0;
                            transform: translateY(16px);
                        }
                    }

                    .animate-fade-in-up {
                        animation: fade-in-up 0.3s ease-out forwards;
                    }

                    .animate-fade-out-down {
                        animation: fade-out-down 0.2s ease-in forwards;
                    }
                `,
                }}
            />
        </>
    );
}
