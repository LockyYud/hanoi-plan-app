"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    MapPin,
    Clock,
    Edit,
    Trash2,
    Heart,
    Eye,
    Tag,
    CalendarDays,
    X,
    Navigation,
    Share2,
} from "lucide-react";
import { isValidImageUrl, ImageDisplay } from "@/lib/image-utils";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { SmartImageGallery } from "./smart-image-gallery";
import { SharePinoryDialog } from "../share/share-pinory-dialog";
import { cn } from "@/lib/utils";
import {
    getCurrentLocation,
    openExternalNavigation,
    getRoute,
} from "@/lib/geolocation";
import { toast } from "sonner";
import type { Pinory } from "@/lib/types";

interface PinoryDetailsViewProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly pinory: Pinory;
    readonly onEdit?: () => void;
    readonly onDelete?: () => void;
}

export function PinoryDetailsView({
    isOpen,
    onClose,
    pinory,
    onEdit,
    onDelete,
}: PinoryDetailsViewProps) {
    const [fullPinory, setFullPinory] = useState<Pinory | null>(null);
    const [isLoadingImages, setIsLoadingImages] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showLightbox, setShowLightbox] = useState(false);
    const [showShareDialog, setShowShareDialog] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    const [isGettingDirections, setIsGettingDirections] = useState(false);

    // Use refs for intermediate drag values to avoid re-renders
    const dragStartYRef = useRef(0);
    const currentYRef = useRef(0);
    const dragStartTimeRef = useRef(0);
    const lastUpdateTimeRef = useRef(0);
    const velocityRef = useRef(0);
    const rafIdRef = useRef<number | null>(null);

    const loadFullPinory = useCallback(async () => {
        setIsLoadingImages(true);
        setLoadError(null);
        try {
            console.log(`🔄 Loading images for pinory ${pinory.id}...`);
            console.log(`🔄 Request URL: /api/location-notes/${pinory.id}`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

            const response = await fetch(`/api/location-notes/${pinory.id}`, {
                signal: controller.signal,
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include", // 🔑 Include session
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                const pinory = data.pinory || data; // API trả về { place: {...} }
                console.log(
                    `✅ Loaded place with ${pinory.media?.length || 0} media items`
                );

                // Transform Place model to Pinory interface
                const imageUrls = pinory.media?.map((m: any) => m.url) || [];
                console.log(
                    `📸 Processing ${imageUrls.length} images:`,
                    imageUrls
                );

                const transformedPinory: Pinory = {
                    id: pinory.id,
                    lng: pinory.lng,
                    lat: pinory.lat,
                    address: pinory.address,
                    content: pinory.content || "",
                    name: pinory.name,
                    mood: pinory.mood, // This might not exist in Place model
                    timestamp: new Date(pinory.createdAt),
                    placeName: pinory.name,
                    visitTime: pinory.visitDate,
                    category: pinory.category,
                    categoryName: pinory.categoryModel?.name,
                    images: imageUrls,
                    hasImages: (pinory.media?.length || 0) > 0,
                    coverImageIndex: pinory.coverImageIndex || 0,
                };

                console.log("✅ Transformed note:", {
                    id: transformedPinory.id,
                    imageCount: transformedPinory.images?.length,
                    hasImages: transformedPinory.hasImages,
                    firstImageUrl: transformedPinory.images?.[0],
                });

                setFullPinory(transformedPinory);
            } else {
                const errorData = await response.text();
                console.error(
                    `❌ Failed to load note: ${response.status} ${response.statusText}`
                );
                console.error(`❌ Error details:`, errorData);

                // Set user-friendly error message
                let userError = `Lỗi tải ghi chú (${response.status})`;

                // Try to parse as JSON for better error info
                try {
                    const errorJson = JSON.parse(errorData);
                    console.error(`❌ Parsed error:`, errorJson);
                    userError = errorJson.error || userError;
                } catch {
                    // If parsing fails, use raw error response
                    console.error(`❌ Raw error response:`, errorData);
                }

                setLoadError(userError);
            }
        } catch (error: unknown) {
            if (error instanceof Error && error.name === "AbortError") {
                console.error("❌ Request timeout loading note images (60s)");
                console.log(
                    "💡 Tip: Images are very large. Consider using compression."
                );
                setLoadError("Image loading timed out. Please try again.");
            } else {
                console.error("❌ Error loading note images:", error);
                setLoadError("Unknown error while loading pinory.");
            }
        } finally {
            setIsLoadingImages(false);
        }
    }, [pinory.id]);

    // Load full note with images when dialog opens (only if images not already loaded)
    useEffect(() => {
        // Only make API call if dialog is open, note has images, but they're not already loaded
        if (
            isOpen &&
            pinory.id &&
            pinory.hasImages &&
            !pinory.images?.length &&
            !fullPinory?.images?.length
        ) {
            console.log("✅ Images not yet loaded, fetching from API...");
            loadFullPinory();
        } else if (isOpen && pinory.images?.length) {
            console.log(
                "✅ Images already provided in note data, no API call needed"
            );
            // Images are already loaded in the note prop, use them directly
            setFullPinory(pinory);
        } else if (!isOpen) {
            // Reset state when dialog closes
            setFullPinory(null);
            setLoadError(null);
        } else if (isOpen) {
            console.log("❌ Conditions not met for loading images");
        }
    }, [
        isOpen,
        pinory.id,
        pinory.hasImages,
        pinory.images?.length,
        fullPinory?.images?.length,
        loadFullPinory,
        pinory,
    ]);

    // Use fullNote if available, otherwise use the basic note
    const displayPinory = fullPinory || pinory;

    // Refresh note when content changes (after edit)
    useEffect(() => {
        if (isOpen && pinory.id && pinory.content !== displayPinory.content) {
            console.log(
                "📝 Note content changed, clearing cache to force refresh"
            );
            setFullPinory(null);
            // If note already has images, use them; otherwise load from API
            if (pinory.images?.length) {
                setFullPinory(pinory);
            } else if (pinory.hasImages) {
                loadFullPinory();
            }
        }
    }, [isOpen, pinory, displayPinory.content, loadFullPinory]);

    const formatDateTime = (date: Date) => {
        return new Date(date).toLocaleString("vi-VN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatVisitTime = (visitTime: string) => {
        try {
            const date = new Date(visitTime);
            return date.toLocaleString("vi-VN", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return visitTime;
        }
    };

    const moodLabels: { [key: string]: string } = {
        "😊": "Happy",
        "😍": "Love it",
        "😎": "Relaxed",
        "🤔": "Thoughtful",
        "😴": "Peaceful",
        "😋": "Delicious",
        "🥳": "Excited",
        "😤": "Disappointed",
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

    // Handle ESC key for dialog (lightbox handles its own ESC)
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === "Escape" && isOpen && !showLightbox) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEsc);
            return () => document.removeEventListener("keydown", handleEsc);
        }
    }, [isOpen, showLightbox, onClose]);

    // Mobile drag handlers - Optimized for smooth 60fps
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

        // Calculate velocity (pixels per millisecond)
        if (deltaTime > 0) {
            const deltaY = touchY - currentYRef.current;
            velocityRef.current = deltaY / deltaTime;
        }

        currentYRef.current = touchY;
        lastUpdateTimeRef.current = now;

        // Use requestAnimationFrame for smooth 60fps updates
        if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
        }

        rafIdRef.current = requestAnimationFrame(() => {
            const rawDeltaY = touchY - dragStartYRef.current;

            // Đang collapsed và vuốt lên -> expand ngay lập tức, không visual drag
            if (!isExpanded && rawDeltaY < -30) {
                // Quick expand threshold
                setIsExpanded(true);
                setIsDragging(false);
                setDragOffset(0);
                if (rafIdRef.current) {
                    cancelAnimationFrame(rafIdRef.current);
                    rafIdRef.current = null;
                }
                return;
            }

            // Đang expanded và vuốt xuống -> collapse ngay lập tức
            if (isExpanded && rawDeltaY > 40) {
                // Quick collapse threshold
                setIsExpanded(false);
                setIsDragging(false);
                setDragOffset(0);
                if (rafIdRef.current) {
                    cancelAnimationFrame(rafIdRef.current);
                    rafIdRef.current = null;
                }
                return;
            }

            // Đang collapsed và vuốt xuống -> đóng ngay lập tức
            if (!isExpanded && rawDeltaY > 60) {
                // Quick close threshold
                onClose();
                setIsDragging(false);
                setDragOffset(0);
                if (rafIdRef.current) {
                    cancelAnimationFrame(rafIdRef.current);
                    rafIdRef.current = null;
                }
            }

            // Nếu chưa đạt threshold, không có visual drag effect
            // Component sẽ snap ngay khi đạt threshold ở trên
        });
    };

    const handleDragEnd = (e: React.TouchEvent) => {
        e.stopPropagation();

        if (!isDragging) return;

        // Cancel any pending animation frame
        if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }

        // Actions đã được xử lý trong handleDragMove với snap thresholds
        // Chỉ cần reset states
        setIsDragging(false);
        setDragOffset(0);
        dragStartYRef.current = 0;
        currentYRef.current = 0;
        velocityRef.current = 0;
    };

    // Cleanup animation frame on unmount
    useEffect(() => {
        return () => {
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
            }
        };
    }, []);

    // Handle get directions
    const handleGetDirections = async () => {
        setIsGettingDirections(true);

        try {
            toast.loading("Getting current location...", {
                id: "note-directions",
            });

            const currentLocation = await getCurrentLocation();

            toast.loading("Calculating route...", {
                id: "note-directions",
            });

            // Calculate route using Mapbox Directions API
            const destination = { lat: pinory.lat, lng: pinory.lng };
            const route = await getRoute(currentLocation, destination, {
                profile: "driving",
            });

            console.log("🗺️ Note Details: Route calculated:", route);

            // Dispatch event to show direction popup on map
            globalThis.dispatchEvent(
                new CustomEvent("showDirections", {
                    detail: {
                        destination: {
                            name: pinory.content || "Pinory",
                            address: pinory.address || "",
                            lat: pinory.lat,
                            lng: pinory.lng,
                        },
                        routeInfo: {
                            duration: route.duration, // in seconds
                            distance: route.distance, // in meters
                        },
                        route: route, // Pass full route object for drawing on map
                    },
                })
            );

            toast.success("Route found!", {
                id: "note-directions",
            });

            // Also open external navigation app for actual navigation
            openExternalNavigation(destination, currentLocation);
        } catch (error) {
            console.error("❌ Error getting directions:", error);
            toast.error("Could not calculate route", {
                description:
                    error instanceof Error
                        ? error.message
                        : "Please try again later",
                id: "note-directions",
            });

            // Fallback: open without current location
            openExternalNavigation({ lat: pinory.lat, lng: pinory.lng });
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
                        // Ngăn scroll map khi touch vào backdrop
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    style={{
                        touchAction: "none",
                        willChange: "opacity",
                    }}
                    aria-label="Close"
                />

                {/* Bottom Sheet */}
                <div
                    className={cn(
                        "fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-[32px] shadow-2xl overflow-hidden flex flex-col",
                        isExpanded ? "h-[80vh]" : "h-[50vh]"
                    )}
                    style={{
                        touchAction: "none",
                        // Use translate3d for hardware acceleration
                        transform: (() => {
                            if (!isDragging) return "translate3d(0, 0, 0)";
                            if (isExpanded)
                                return `translate3d(0, ${Math.max(0, dragOffset)}px, 0)`; // Expanded: chỉ cho kéo xuống
                            return `translate3d(0, ${dragOffset}px, 0)`; // Collapsed: cho kéo cả 2 hướng
                        })(),
                        // Better spring animation with cubic-bezier
                        transition: isDragging
                            ? "none"
                            : "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1), height 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
                        // Enable hardware acceleration
                        willChange: isDragging ? "transform" : "auto",
                    }}
                    onTouchMove={(e) => {
                        // Ngăn scroll của map khi touch vào bottom sheet
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
                        aria-label={isExpanded ? "Collapse" : "Expand"}
                    >
                        <div className="w-10 h-1 bg-muted rounded-full"></div>
                    </button>

                    {/* Smart Image Display - Context-aware based on image count */}
                    {/* Smart Image Display - Adaptive State */}
                    {displayPinory.images &&
                        displayPinory.images.length > 0 && (
                            <div className="mx-4 mb-3 relative">
                                {/* 2+ ảnh & expanded: Ẩn carousel vì gallery đầy đủ ở trong content */}
                                {!(
                                    displayPinory.images.length >= 2 &&
                                    isExpanded
                                ) && (
                                    <>
                                        {/* 1 ảnh: Cover lớn đơn giản */}
                                        {displayPinory.images.length === 1 && (
                                            <button
                                                type="button"
                                                className="w-full h-56 bg-secondary relative overflow-hidden flex-shrink-0 rounded-2xl shadow-lg"
                                                onTouchStart={handleDragStart}
                                                onTouchMove={handleDragMove}
                                                onTouchEnd={handleDragEnd}
                                                onClick={() => {
                                                    setCurrentImageIndex(0);
                                                    setShowLightbox(true);
                                                }}
                                                aria-label="View photo"
                                            >
                                                {isValidImageUrl(
                                                    displayPinory.images[0]
                                                ) ? (
                                                    <ImageDisplay
                                                        src={
                                                            displayPinory
                                                                .images[0]
                                                        }
                                                        alt="Cover"
                                                        className="w-full h-full object-contain pointer-events-none bg-background"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center pointer-events-none">
                                                        <span className="text-4xl text-muted-foreground">
                                                            📷
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/15 pointer-events-none"></div>
                                            </button>
                                        )}

                                        {/* 2+ ảnh: Carousel Swipe */}
                                        {displayPinory.images.length >= 2 && (
                                            <div className="relative">
                                                <div
                                                    className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-2 pb-2"
                                                    style={{
                                                        scrollBehavior:
                                                            "smooth",
                                                    }}
                                                >
                                                    {displayPinory.images.map(
                                                        (image, index) => (
                                                            <button
                                                                key={`${displayPinory.id || pinory.id}-carousel-${index}`}
                                                                type="button"
                                                                className="flex-shrink-0 w-full h-56 bg-secondary relative overflow-hidden rounded-2xl shadow-lg snap-center"
                                                                onClick={() => {
                                                                    setCurrentImageIndex(
                                                                        index
                                                                    );
                                                                    setShowLightbox(
                                                                        true
                                                                    );
                                                                }}
                                                                aria-label={`Xem ảnh ${index + 1}`}
                                                            >
                                                                {isValidImageUrl(
                                                                    image
                                                                ) ? (
                                                                    <ImageDisplay
                                                                        src={
                                                                            image
                                                                        }
                                                                        alt={`Ảnh ${index + 1}`}
                                                                        className="w-full h-full object-contain pointer-events-none bg-background"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center pointer-events-none">
                                                                        <span className="text-4xl text-muted-foreground">
                                                                            📷
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                <div className="absolute inset-0 bg-black/15 pointer-events-none"></div>

                                                                {/* Badge vị trí ảnh */}
                                                                <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-lg pointer-events-none">
                                                                    <span className="text-white text-sm font-medium">
                                                                        {index +
                                                                            1}
                                                                        /
                                                                        {
                                                                            displayPinory
                                                                                .images
                                                                                ?.length
                                                                        }
                                                                    </span>
                                                                </div>
                                                            </button>
                                                        )
                                                    )}
                                                </div>

                                                {/* Dots indicator */}
                                                <div className="flex justify-center gap-1.5 mt-2">
                                                    {displayPinory.images.map(
                                                        (image, index) => (
                                                            <div
                                                                key={`${displayPinory.id || pinory.id}-dot-${image.slice(-10)}`}
                                                                className="w-1.5 h-1.5 rounded-full bg-white/40"
                                                            />
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* Close button - always visible */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onClose();
                                    }}
                                    className="absolute top-3 right-3 text-white bg-black/50 hover:bg-black/70 rounded-full w-8 h-8 p-0 backdrop-blur-md z-10"
                                >
                                    <X className="h-4 w-4" strokeWidth={2.5} />
                                </Button>
                            </div>
                        )}

                    {/* Header Info */}
                    <div
                        className="px-5 py-3 flex-shrink-0 relative"
                        onTouchStart={handleDragStart}
                        onTouchMove={handleDragMove}
                        onTouchEnd={handleDragEnd}
                    >
                        {/* Close button khi không có ảnh hoặc 2+ ảnh & expanded */}
                        {/* {(!displayPinory.images ||
                            displayPinory.images.length === 0 ||
                            (displayPinory.images.length >= 2 &&
                                isExpanded)) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClose();
                                }}
                                className="absolute top-3 right-3 text-muted-foreground hover:text-white bg-secondary/80 hover:bg-accent rounded-full w-8 h-8 p-0 z-10"
                            >
                                <X className="h-4 w-4" strokeWidth={2.5} />
                            </Button>
                        )} */}

                        <div className="flex items-start gap-2.5">
                            <div className="flex-1 min-w-0 pr-10">
                                {/* Hiển thị nội dung trước */}
                                <h2 className="text-base font-semibold text-muted-foreground mb-1 leading-tight">
                                    {displayPinory.placeName ||
                                        "Location pinory"}
                                </h2>
                                <p className="text-xs text-[#888] flex items-center gap-1.5 leading-relaxed">
                                    <MapPin className="h-3 w-3 flex-shrink-0" />
                                    <span className="line-clamp-1">
                                        {pinory.address}
                                    </span>
                                </p>
                                {displayPinory.visitTime && (
                                    <p className="text-xs text-[#888] mt-1 flex items-center gap-1.5">
                                        <Clock className="h-2.5 w-2.5 flex-shrink-0" />
                                        {formatVisitTime(
                                            displayPinory.visitTime
                                        )}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div
                        className="flex-1 overflow-y-auto px-5 py-3 space-y-4"
                        style={{ touchAction: isExpanded ? "pan-y" : "none" }}
                        onTouchStart={(e) => {
                            // Nếu chưa expanded, intercept touch để expand
                            if (!isExpanded) {
                                handleDragStart(e);
                                return;
                            }

                            // Nếu đã expanded, check scroll position
                            const target = e.currentTarget;
                            const isAtTop = target.scrollTop === 0;

                            // Nếu ở top -> cho phép drag để collapse
                            if (isAtTop) {
                                // Store this info for touch move
                                target.dataset.allowDrag = "true";
                            } else {
                                target.dataset.allowDrag = "false";
                            }
                        }}
                        onTouchMove={(e) => {
                            // Nếu chưa expanded, dùng drag handler
                            if (!isExpanded) {
                                handleDragMove(e);
                                return;
                            }

                            const target = e.currentTarget;
                            const allowDrag =
                                target.dataset.allowDrag === "true";
                            const isAtTop = target.scrollTop <= 1; // Small tolerance for precision

                            // Nếu đang ở top và được phép drag
                            if (allowDrag && isAtTop) {
                                // Check if dragging down
                                const touchY = e.touches[0].clientY;
                                const startY = dragStartYRef.current || touchY;
                                if (touchY > startY + 5) {
                                    // 5px threshold
                                    // Dragging down from top -> handle as drag to collapse
                                    e.preventDefault();
                                    handleDragMove(e);
                                    return;
                                }
                            }

                            // Otherwise allow normal scroll
                            e.stopPropagation();
                        }}
                        onTouchEnd={(e) => {
                            if (!isExpanded) {
                                handleDragEnd(e);
                            }
                            delete e.currentTarget.dataset.allowDrag;
                        }}
                    >
                        {/* Tags */}
                        {(displayPinory.categoryName || displayPinory.mood) && (
                            <div className="flex flex-wrap gap-2">
                                {displayPinory.categoryName && (
                                    <div className="flex items-center gap-1.5 bg-purple-900/30 text-purple-400 px-2.5 py-1 rounded-full border border-purple-800">
                                        <Tag className="h-3 w-3" />
                                        <span className="text-xs font-medium">
                                            {displayPinory.categoryName}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 2+ ảnh: Smart Gallery khi expanded (Adaptive State) */}
                        {isExpanded &&
                            displayPinory.images &&
                            displayPinory.images.length >= 2 && (
                                <div className="space-y-2">
                                    <SmartImageGallery
                                        images={displayPinory.images}
                                        pinoryId={displayPinory.id || pinory.id}
                                        onImageClick={(index) => {
                                            setCurrentImageIndex(index);
                                            setShowLightbox(true);
                                        }}
                                        variant="mobile"
                                    />
                                </div>
                            )}

                        {/* Text Content */}
                        {displayPinory.content && (
                            <div>
                                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                    {displayPinory.content}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="sticky bottom-0 bg-card/95 backdrop-blur-xl border-t border-border/50 px-5 py-3 flex-shrink-0">
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={handleGetDirections}
                                disabled={isGettingDirections}
                                className="flex-1 h-11 bg-blue-900/50 hover:bg-blue-800/60 border-blue-700/50 text-blue-300 font-semibold text-sm rounded-xl"
                            >
                                <Navigation
                                    className={`h-4 w-4 mr-1.5 ${isGettingDirections ? "animate-spin" : ""}`}
                                />
                                Directions
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowShareDialog(true)}
                                className="flex-1 h-11 bg-green-900/50 hover:bg-green-800/60 border-green-700/50 text-green-300 font-semibold text-sm rounded-xl"
                            >
                                <Share2 className="h-4 w-4 mr-1.5" />
                                Share
                            </Button>
                            <Button
                                variant="outline"
                                onClick={onEdit}
                                className="h-11 px-3.5 bg-brand/25 hover:bg-brand/35 border-brand/40 text-brand-accent rounded-xl"
                                title="Edit"
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    if (
                                        globalThis.confirm(
                                            "Are you sure you want to delete this pinory?"
                                        )
                                    ) {
                                        onDelete?.();
                                    }
                                }}
                                className="h-11 px-3.5 bg-red-600 hover:bg-red-700 rounded-xl"
                                title="Delete pinory"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Lightbox */}
                <ImageLightbox
                    images={displayPinory.images || []}
                    currentIndex={currentImageIndex}
                    isOpen={showLightbox}
                    onClose={() => setShowLightbox(false)}
                    onNext={() => {
                        setCurrentImageIndex((prev) =>
                            prev === (displayPinory.images?.length || 1) - 1
                                ? 0
                                : prev + 1
                        );
                    }}
                    onPrevious={() => {
                        setCurrentImageIndex((prev) =>
                            prev === 0
                                ? (displayPinory.images?.length || 1) - 1
                                : prev - 1
                        );
                    }}
                    title={displayPinory.name}
                />

                {/* Share Dialog */}
                <SharePinoryDialog
                    open={showShareDialog}
                    onOpenChange={setShowShareDialog}
                    pinory={{
                        id: displayPinory.id,
                        name:
                            displayPinory.name ||
                            displayPinory.placeName ||
                            "Location",
                        address: displayPinory.address,
                    }}
                />
            </>
        );
    }

    // DESKTOP: Original Dialog
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0 bg-background border border-border shadow-2xl flex flex-col rounded-2xl">
                {/* Accessible title for screen readers */}
                <DialogTitle className="sr-only">
                    Pinory details:{" "}
                    {displayPinory.placeName ||
                        displayPinory.content?.slice(0, 50) ||
                        "Location pinory"}
                </DialogTitle>

                {/* Modern Header */}
                <div className="relative bg-card/80 border-b border-border/50 px-6 py-5 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        {/* Title with emoji */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg">
                                <span className="text-xl">
                                    {displayPinory.mood || "📍"}
                                </span>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-foreground">
                                    {displayPinory.placeName ||
                                        "Location pinory"}
                                </h2>
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                    <MapPin className="h-3 w-3 flex-shrink-0" />
                                    <span className="line-clamp-1">
                                        {pinory.address}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scrollable content area */}
                <div className="flex-1 overflow-y-auto bg-background custom-scrollbar">
                    <div className="space-y-5 p-6">
                        {/* Content Section - Facebook Post Style */}
                        {(displayPinory.hasImages ||
                            (displayPinory.images &&
                                displayPinory.images.length > 0)) && (
                            <>
                                {(() => {
                                    if (loadError) {
                                        return (
                                            <div className="flex flex-col items-center justify-center py-10 text-red-400">
                                                <div className="w-14 h-14 bg-red-900/20 rounded-xl flex items-center justify-center mb-3 border border-red-800/50">
                                                    <div className="text-2xl">
                                                        ⚠️
                                                    </div>
                                                </div>
                                                <span className="text-sm font-medium mb-3">
                                                    {loadError}
                                                </span>
                                                <Button
                                                    onClick={loadFullPinory}
                                                    variant="outline"
                                                    size="sm"
                                                    className="bg-red-900/20 hover:bg-red-900/30 text-red-400 border-red-800/50 rounded-lg"
                                                >
                                                    Thử lại
                                                </Button>
                                            </div>
                                        );
                                    }

                                    if (isLoadingImages) {
                                        return (
                                            <div className="flex flex-col items-center justify-center py-10">
                                                <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                                                <span className="text-sm font-medium text-foreground mb-1">
                                                    Loading images...
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    Please wait a moment
                                                </span>
                                            </div>
                                        );
                                    }

                                    if (
                                        displayPinory.images &&
                                        displayPinory.images.length > 0
                                    ) {
                                        return (
                                            <>
                                                {displayPinory.images.length >
                                                    0 && (
                                                    <div className="flex items-center justify-between mb-3">
                                                        <span className="text-xs text-muted-foreground">
                                                            {
                                                                displayPinory
                                                                    .images
                                                                    .length
                                                            }{" "}
                                                            photos
                                                        </span>
                                                    </div>
                                                )}
                                                {/* Smart Adaptive Layout Gallery */}
                                                <SmartImageGallery
                                                    images={
                                                        displayPinory.images
                                                    }
                                                    pinoryId={displayPinory.id}
                                                    onImageClick={(index) => {
                                                        setCurrentImageIndex(
                                                            index
                                                        );
                                                        setShowLightbox(true);
                                                    }}
                                                    className="mb-4"
                                                />
                                            </>
                                        );
                                    }
                                    if (displayPinory.hasImages) {
                                        return (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <Eye className="h-8 w-8 mx-auto mb-2" />
                                                <div className="text-sm">
                                                    Has images but failed to
                                                    load
                                                </div>
                                            </div>
                                        );
                                    }

                                    return null;
                                })()}
                            </>
                        )}

                        {/* Text Content Below Images */}
                        {displayPinory.content && (
                            <div className="relative pt-2 border-t border-border/50">
                                <p className="text-foreground whitespace-pre-wrap leading-relaxed text-base">
                                    {displayPinory.content}
                                </p>
                            </div>
                        )}

                        {/* Metadata Tags */}
                        {(displayPinory.categoryName ||
                            displayPinory.visitTime) && (
                            <div className="space-y-3 p-5 bg-card/50 rounded-xl border border-border/50">
                                <div className="flex items-center gap-2">
                                    <div className="h-1 w-1 rounded-full bg-blue-500"></div>
                                    <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                                        <Tag className="h-4 w-4" />
                                        Information
                                    </h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {/* Category */}
                                    {displayPinory.categoryName && (
                                        <div className="flex items-center gap-1.5 bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/30 text-sm">
                                            <Tag className="h-3.5 w-3.5" />
                                            <span>
                                                {displayPinory.categoryName}
                                            </span>
                                        </div>
                                    )}

                                    {/* Visit Time */}
                                    {displayPinory.visitTime && (
                                        <div className="flex items-center gap-1.5 bg-secondary text-muted-foreground px-3 py-1.5 rounded-lg border border-border text-sm">
                                            <CalendarDays className="h-3.5 w-3.5" />
                                            <span>
                                                {formatVisitTime(
                                                    displayPinory.visitTime
                                                )}
                                            </span>
                                        </div>
                                    )}

                                    {/* Mood */}
                                    {pinory.mood && (
                                        <div className="flex items-center gap-1.5 bg-secondary text-muted-foreground px-3 py-1.5 rounded-lg border border-border text-sm">
                                            <span className="text-base">
                                                {pinory.mood}
                                            </span>
                                            <span>
                                                {moodLabels[pinory.mood] ||
                                                    "Other"}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Timestamp */}
                        <div className="p-4 bg-card/30 rounded-lg border border-border/50">
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <Clock className="h-4 w-4" />
                                <span>
                                    Created {formatDateTime(pinory.timestamp)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons Footer */}
                <div className="sticky bottom-0 bg-card/80 backdrop-blur-xl border-t border-border/50 p-4 flex-shrink-0">
                    <div className="flex gap-2.5">
                        <Button
                            variant="outline"
                            onClick={handleGetDirections}
                            disabled={isGettingDirections}
                            className="flex-1 h-11 bg-blue-600/20 hover:bg-blue-600/30 border-blue-600/40 hover:border-blue-600/60 text-blue-300 hover:text-blue-200 font-semibold rounded-lg transition-all"
                        >
                            <Navigation
                                className={`h-4 w-4 mr-1.5 ${isGettingDirections ? "animate-spin" : ""}`}
                            />
                            Directions
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setShowShareDialog(true)}
                            className="flex-1 h-11 bg-green-600/20 hover:bg-green-600/30 border-green-600/40 hover:border-green-600/60 text-green-300 hover:text-green-200 font-semibold rounded-lg transition-all"
                        >
                            <Share2 className="h-4 w-4 mr-1.5" />
                            Share
                        </Button>
                        <Button
                            variant="outline"
                            onClick={onEdit}
                            className="h-11 px-4 bg-secondary/80 hover:bg-accent border-border hover:border-border text-foreground font-semibold rounded-lg transition-all"
                            title="Edit"
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (
                                    globalThis.confirm(
                                        "Are you sure you want to delete this pinory?"
                                    )
                                ) {
                                    onDelete?.();
                                }
                            }}
                            className="h-11 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </DialogContent>

            <ImageLightbox
                images={displayPinory.images || []}
                currentIndex={currentImageIndex}
                isOpen={showLightbox}
                onClose={() => setShowLightbox(false)}
                onNext={() => {
                    setCurrentImageIndex((prev) =>
                        prev === (displayPinory.images?.length || 1) - 1
                            ? 0
                            : prev + 1
                    );
                }}
                onPrevious={() => {
                    setCurrentImageIndex((prev) =>
                        prev === 0
                            ? (displayPinory.images?.length || 1) - 1
                            : prev - 1
                    );
                }}
                title={displayPinory.name}
            />

            {/* Share Dialog */}
            <SharePinoryDialog
                open={showShareDialog}
                onOpenChange={setShowShareDialog}
                pinory={{
                    id: displayPinory.id,
                    name:
                        displayPinory.name ||
                        displayPinory.placeName ||
                        "Location",
                    address: displayPinory.address,
                }}
            />
        </Dialog>
    );
}
