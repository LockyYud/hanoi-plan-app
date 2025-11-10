"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    MapPin,
    Heart,
    Eye,
    Star,
    X,
    Navigation,
    Calendar,
    UserCircle2,
} from "lucide-react";
import { isValidImageUrl, ImageDisplay } from "@/lib/image-utils";
import { ImageLightbox } from "./image-lightbox";
import { cn } from "@/lib/utils";
import {
    getCurrentLocation,
    openExternalNavigation,
    getRoute,
} from "@/lib/geolocation";
import { toast } from "sonner";
import { Place } from "@/lib/types";
import Image from "next/image";

interface FriendLocationDetailsViewProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly locationNote: Place;
    readonly onAddToFavorites?: () => void;
}

export function FriendLocationDetailsView({
    isOpen,
    onClose,
    locationNote,
    onAddToFavorites,
}: FriendLocationDetailsViewProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showLightbox, setShowLightbox] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    const [isGettingDirections, setIsGettingDirections] = useState(false);

    const dragStartYRef = useRef(0);
    const currentYRef = useRef(0);
    const dragStartTimeRef = useRef(0);
    const lastUpdateTimeRef = useRef(0);
    const velocityRef = useRef(0);
    const rafIdRef = useRef<number | null>(null);

    const place = locationNote;
    const user = place.creator;
    const { rating, note, visitDate } = place;

    // API returns 'images' array or 'media' array
    const images =
        (place as any).images || place.media?.map((m) => m.url) || [];

    const formatVisitDate = (date: Date | string) => {
        try {
            const d = new Date(date);
            return d.toLocaleString("vi-VN", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
            });
        } catch {
            return "";
        }
    };

    // Detect mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(globalThis.innerWidth < 768);
        };
        checkMobile();
        globalThis.addEventListener("resize", checkMobile);
        return () => globalThis.removeEventListener("resize", checkMobile);
    }, []);

    // Mobile drag handlers
    const handleDragStart = (e: React.TouchEvent) => {
        e.stopPropagation();
        const touchY = e.touches[0].clientY;
        dragStartYRef.current = touchY;
        currentYRef.current = touchY;
        dragStartTimeRef.current = Date.now();
        lastUpdateTimeRef.current = Date.now();
        velocityRef.current = 0;
        setIsDragging(true);
        setDragOffset(0);
    };

    const handleDragMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        e.stopPropagation();

        const touchY = e.touches[0].clientY;
        const now = Date.now();
        const deltaTime = now - lastUpdateTimeRef.current;

        if (deltaTime > 0) {
            const deltaY = touchY - currentYRef.current;
            velocityRef.current = deltaY / deltaTime;
        }

        currentYRef.current = touchY;
        lastUpdateTimeRef.current = now;

        if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
        }

        rafIdRef.current = requestAnimationFrame(() => {
            const rawDeltaY = touchY - dragStartYRef.current;

            if (!isExpanded && rawDeltaY < -30) {
                setIsExpanded(true);
                setIsDragging(false);
                setDragOffset(0);
                if (rafIdRef.current) {
                    cancelAnimationFrame(rafIdRef.current);
                    rafIdRef.current = null;
                }
                return;
            }

            if (isExpanded && rawDeltaY > 40) {
                setIsExpanded(false);
                setIsDragging(false);
                setDragOffset(0);
                if (rafIdRef.current) {
                    cancelAnimationFrame(rafIdRef.current);
                    rafIdRef.current = null;
                }
                return;
            }

            if (!isExpanded && rawDeltaY > 60) {
                onClose();
                setIsDragging(false);
                setDragOffset(0);
                if (rafIdRef.current) {
                    cancelAnimationFrame(rafIdRef.current);
                    rafIdRef.current = null;
                }
            }
        });
    };

    const handleDragEnd = (e: React.TouchEvent) => {
        e.stopPropagation();
        if (!isDragging) return;

        if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }

        setIsDragging(false);
        setDragOffset(0);
        dragStartYRef.current = 0;
        currentYRef.current = 0;
        velocityRef.current = 0;
    };

    useEffect(() => {
        return () => {
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
            }
        };
    }, []);

    const handleGetDirections = async () => {
        setIsGettingDirections(true);

        try {
            toast.loading("Đang lấy vị trí hiện tại...", {
                id: "friend-directions",
            });

            const currentLocation = await getCurrentLocation();

            toast.loading("Đang tính toán tuyến đường...", {
                id: "friend-directions",
            });

            const destination = { lat: place.lat, lng: place.lng };
            const route = await getRoute(currentLocation, destination, {
                profile: "driving",
            });

            globalThis.dispatchEvent(
                new CustomEvent("showDirections", {
                    detail: {
                        destination: {
                            name: place.name,
                            address: place.address,
                            lat: place.lat,
                            lng: place.lng,
                        },
                        routeInfo: {
                            duration: route.duration,
                            distance: route.distance,
                        },
                        route: route,
                    },
                })
            );

            toast.success("Đã tìm thấy tuyến đường!", {
                id: "friend-directions",
            });

            openExternalNavigation(destination, currentLocation);
        } catch (error) {
            console.error("❌ Error getting directions:", error);
            toast.error("Không thể tính toán tuyến đường", {
                description:
                    error instanceof Error
                        ? error.message
                        : "Vui lòng thử lại sau",
                id: "friend-directions",
            });

            openExternalNavigation({ lat: place.lat, lng: place.lng });
        } finally {
            setIsGettingDirections(false);
        }
    };

    // MOBILE: Bottom Sheet UI
    if (isMobile && isOpen) {
        return (
            <>
                {/* Backdrop */}
                <button
                    type="button"
                    className="fixed inset-0 bg-black/50 z-40 cursor-default transition-opacity duration-300"
                    onClick={onClose}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") {
                            onClose();
                        }
                    }}
                    onTouchMove={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    style={{
                        touchAction: "none",
                        willChange: "opacity",
                    }}
                    aria-label="Đóng"
                />

                {/* Bottom Sheet */}
                <div
                    className={cn(
                        "fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-br from-[#0a0a0a] via-[#0C0C0C] to-[#0a0a0a] rounded-t-[32px] shadow-2xl overflow-hidden flex flex-col",
                        isExpanded ? "h-[90vh]" : "h-[50vh]"
                    )}
                    style={{
                        touchAction: "none",
                        transform: (() => {
                            if (!isDragging) return "translate3d(0, 0, 0)";
                            if (isExpanded)
                                return `translate3d(0, ${Math.max(0, dragOffset)}px, 0)`;
                            return `translate3d(0, ${dragOffset}px, 0)`;
                        })(),
                        transition: isDragging
                            ? "none"
                            : "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1), height 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
                        willChange: isDragging ? "transform" : "auto",
                    }}
                    onTouchMove={(e) => {
                        e.stopPropagation();
                    }}
                >
                    {/* Drag Handle */}
                    <button
                        type="button"
                        className="w-full py-2.5 flex justify-center cursor-grab active:cursor-grabbing flex-shrink-0"
                        onTouchStart={handleDragStart}
                        onTouchMove={handleDragMove}
                        onTouchEnd={handleDragEnd}
                        onClick={() => setIsExpanded(!isExpanded)}
                        aria-label={isExpanded ? "Thu gọn" : "Mở rộng"}
                    >
                        <div className="w-10 h-1 bg-neutral-600 rounded-full"></div>
                    </button>

                    {/* Friend Info Header with Purple Theme */}
                    <div
                        className="px-5 py-3 border-b border-purple-900/30 bg-purple-900/10 flex-shrink-0"
                        onTouchStart={handleDragStart}
                        onTouchMove={handleDragMove}
                        onTouchEnd={handleDragEnd}
                    >
                        <div className="flex items-center gap-3">
                            {user?.avatarUrl ? (
                                <Image
                                    src={user.avatarUrl}
                                    alt={user.name || user.email}
                                    width={40}
                                    height={40}
                                    className="rounded-full border-2 border-purple-500"
                                />
                            ) : (
                                <div className="w-10 h-10 rounded-full bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center">
                                    <UserCircle2 className="w-6 h-6 text-purple-400" />
                                </div>
                            )}
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-purple-400">
                                    {user?.name || user?.email}
                                </p>
                                <p className="text-xs text-purple-300/70">
                                    Friend's location
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClose();
                                }}
                                className="text-white bg-black/50 hover:bg-black/70 rounded-full w-8 h-8 p-0 backdrop-blur-md"
                            >
                                <X className="h-4 w-4" strokeWidth={2.5} />
                            </Button>
                        </div>
                    </div>

                    {/* Cover Image */}
                    {images.length > 0 && (
                        <div
                            className="mx-4 mb-3 h-44 bg-gradient-to-r from-purple-900/50 to-purple-800/50 relative overflow-hidden flex-shrink-0 rounded-2xl shadow-lg border border-purple-500/20"
                            onTouchStart={handleDragStart}
                            onTouchMove={handleDragMove}
                            onTouchEnd={handleDragEnd}
                        >
                            {isValidImageUrl(images[0]) ? (
                                <ImageDisplay
                                    src={images[0]}
                                    alt="Cover"
                                    className="w-full h-full object-cover pointer-events-none"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center pointer-events-none">
                                    <span className="text-4xl text-purple-300">
                                        📷
                                    </span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 to-transparent pointer-events-none"></div>
                        </div>
                    )}

                    {/* Place Info */}
                    <div
                        className="px-5 py-3 flex-shrink-0"
                        onTouchStart={handleDragStart}
                        onTouchMove={handleDragMove}
                        onTouchEnd={handleDragEnd}
                    >
                        <h2 className="text-lg font-bold text-[#EDEDED] mb-2">
                            {place.name}
                        </h2>
                        <p className="text-sm text-[#A0A0A0] flex items-start gap-1.5 mb-2">
                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-purple-400" />
                            <span className="line-clamp-2">
                                {place.address}
                            </span>
                        </p>
                        {rating && (
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="font-medium text-[#EDEDED]">
                                    {rating}/5
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Scrollable Content */}
                    <div
                        className="flex-1 overflow-y-auto px-5 py-3 space-y-4"
                        style={{ touchAction: isExpanded ? "pan-y" : "none" }}
                    >
                        {/* Note */}
                        {note && (
                            <div className="bg-purple-900/10 p-3 rounded-lg border border-purple-500/20">
                                <p className="text-sm text-[#EDEDED] italic">
                                    "{note}"
                                </p>
                            </div>
                        )}

                        {/* Visit Date */}
                        {visitDate && (
                            <div className="flex items-center gap-2 text-sm text-[#A0A0A0]">
                                <Calendar className="w-4 h-4 text-purple-400" />
                                <span>
                                    Visited on {formatVisitDate(visitDate)}
                                </span>
                            </div>
                        )}

                        {/* All Images Grid */}
                        {images.length > 1 && (
                            <div>
                                <h3 className="text-xs font-semibold text-purple-400 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                                    <Eye className="h-3.5 w-3.5" />
                                    Photos ({images.length})
                                </h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {images.map(
                                        (imageUrl: string, index: number) => (
                                            <button
                                                key={index}
                                                className="aspect-square bg-neutral-800 rounded-xl border border-purple-500/30 overflow-hidden hover:border-purple-500/60 transition-colors"
                                                onClick={() => {
                                                    setCurrentImageIndex(index);
                                                    setShowLightbox(true);
                                                }}
                                            >
                                                {isValidImageUrl(imageUrl) ? (
                                                    <ImageDisplay
                                                        src={imageUrl}
                                                        alt={`Photo ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="text-2xl text-purple-300">
                                                            📷
                                                        </span>
                                                    </div>
                                                )}
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="sticky bottom-0 bg-gradient-to-t from-[#0a0a0a] via-[#0C0C0C]/95 to-transparent backdrop-blur-xl border-t border-purple-900/30 px-5 py-3 flex-shrink-0">
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={handleGetDirections}
                                disabled={isGettingDirections}
                                className="flex-1 h-11 bg-gradient-to-br from-blue-900/40 to-cyan-900/40 hover:from-blue-800/50 hover:to-cyan-800/50 border-blue-700/50 text-blue-300 font-semibold text-sm rounded-xl"
                            >
                                <Navigation
                                    className={`h-4 w-4 mr-1.5 ${isGettingDirections ? "animate-spin" : ""}`}
                                />
                                Directions
                            </Button>
                            <Button
                                variant="outline"
                                onClick={onAddToFavorites}
                                className="flex-1 h-11 bg-gradient-to-br from-purple-900/40 to-purple-800/40 hover:from-purple-800/50 hover:to-purple-700/50 border-purple-700/50 text-purple-300 font-semibold text-sm rounded-xl"
                            >
                                <Heart className="h-4 w-4 mr-1.5" />
                                Add to Favorites
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Lightbox */}
                {images.length > 0 && (
                    <ImageLightbox
                        images={images}
                        currentIndex={currentImageIndex}
                        isOpen={showLightbox}
                        onClose={() => setShowLightbox(false)}
                        onNext={() => {
                            setCurrentImageIndex((prev) =>
                                prev === images.length - 1 ? 0 : prev + 1
                            );
                        }}
                        onPrevious={() => {
                            setCurrentImageIndex((prev) =>
                                prev === 0 ? images.length - 1 : prev - 1
                            );
                        }}
                    />
                )}
            </>
        );
    }

    // DESKTOP: Dialog
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 bg-[#0C0C0C] border border-purple-800/50 shadow-2xl flex flex-col rounded-2xl">
                <DialogTitle className="sr-only">
                    Friend's location: {place.name}
                </DialogTitle>

                {/* Header with purple theme */}
                <div className="relative bg-gradient-to-r from-purple-900/80 to-purple-800/80 border-b border-purple-700/50 px-6 py-4 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        {user?.avatarUrl ? (
                            <Image
                                src={user.avatarUrl}
                                alt={user.name || user.email}
                                width={40}
                                height={40}
                                className="rounded-full border-2 border-purple-400"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-purple-500/20 border-2 border-purple-400 flex items-center justify-center">
                                <UserCircle2 className="w-6 h-6 text-purple-300" />
                            </div>
                        )}
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-purple-300">
                                {user?.name || user?.email}
                            </p>
                            <p className="text-xs text-purple-200/70">
                                Shared this location
                            </p>
                        </div>
                    </div>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto bg-[#0C0C0C] custom-scrollbar">
                    <div className="space-y-4 p-6">
                        {/* Cover Image */}
                        {images.length > 0 && (
                            <div className="relative h-48 bg-gradient-to-r from-purple-900/30 to-purple-800/30 rounded-xl overflow-hidden border border-purple-500/20">
                                {isValidImageUrl(images[0]) ? (
                                    <ImageDisplay
                                        src={images[0]}
                                        alt="Cover"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-4xl text-purple-300">
                                            📷
                                        </span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 to-transparent"></div>
                            </div>
                        )}

                        {/* Place Info */}
                        <div className="space-y-3">
                            <h2 className="text-xl font-bold text-[#EDEDED]">
                                {place.name}
                            </h2>
                            <p className="text-sm text-[#A0A0A0] flex items-start gap-2">
                                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-purple-400" />
                                <span>{place.address}</span>
                            </p>
                            {rating && (
                                <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    <span className="font-medium text-[#EDEDED]">
                                        {rating}/5
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Note */}
                        {note && (
                            <div className="bg-purple-900/10 p-4 rounded-lg border border-purple-500/20">
                                <p className="text-sm text-[#EDEDED] italic">
                                    "{note}"
                                </p>
                            </div>
                        )}

                        {/* Visit Date */}
                        {visitDate && (
                            <div className="flex items-center gap-2 text-sm text-[#A0A0A0] bg-neutral-900/50 p-3 rounded-lg">
                                <Calendar className="w-4 h-4 text-purple-400" />
                                <span>
                                    Visited on {formatVisitDate(visitDate)}
                                </span>
                            </div>
                        )}

                        {/* All Images */}
                        {images.length > 1 && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-purple-400 flex items-center gap-2">
                                    <Eye className="h-4 w-4" />
                                    Photos ({images.length})
                                </h3>
                                <div className="grid grid-cols-3 gap-3">
                                    {images.map(
                                        (imageUrl: string, index: number) => (
                                            <button
                                                key={index}
                                                className="aspect-square bg-neutral-800 rounded-lg border border-purple-500/30 overflow-hidden hover:border-purple-500/60 transition-colors"
                                                onClick={() => {
                                                    setCurrentImageIndex(index);
                                                    setShowLightbox(true);
                                                }}
                                            >
                                                {isValidImageUrl(imageUrl) ? (
                                                    <ImageDisplay
                                                        src={imageUrl}
                                                        alt={`Photo ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <span className="text-2xl text-purple-300">
                                                            📷
                                                        </span>
                                                    </div>
                                                )}
                                            </button>
                                        )
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="sticky bottom-0 bg-gradient-to-r from-purple-900/80 to-purple-800/80 backdrop-blur-xl border-t border-purple-700/50 p-4 flex-shrink-0">
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={handleGetDirections}
                            disabled={isGettingDirections}
                            className="flex-1 h-11 bg-blue-600/20 hover:bg-blue-600/30 border-blue-600/40 text-blue-300 font-semibold rounded-lg"
                        >
                            <Navigation
                                className={`h-4 w-4 mr-1.5 ${isGettingDirections ? "animate-spin" : ""}`}
                            />
                            Get Directions
                        </Button>
                        <Button
                            variant="outline"
                            onClick={onAddToFavorites}
                            className="flex-1 h-11 bg-purple-600/20 hover:bg-purple-600/30 border-purple-600/40 text-purple-300 font-semibold rounded-lg"
                        >
                            <Heart className="h-4 w-4 mr-1.5" />
                            Add to Favorites
                        </Button>
                    </div>
                </div>
            </DialogContent>

            {/* Lightbox */}
            {images.length > 0 && (
                <ImageLightbox
                    images={images}
                    currentIndex={currentImageIndex}
                    isOpen={showLightbox}
                    onClose={() => setShowLightbox(false)}
                    onNext={() => {
                        setCurrentImageIndex((prev) =>
                            prev === images.length - 1 ? 0 : prev + 1
                        );
                    }}
                    onPrevious={() => {
                        setCurrentImageIndex((prev) =>
                            prev === 0 ? images.length - 1 : prev - 1
                        );
                    }}
                />
            )}
        </Dialog>
    );
}
