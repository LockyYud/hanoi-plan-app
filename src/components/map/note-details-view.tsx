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
    Star,
    X,
    Navigation,
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

interface LocationNote {
    id: string;
    lng: number;
    lat: number;
    address: string;
    content: string;
    mood?: string;
    timestamp: Date;
    images?: string[];
    hasImages?: boolean;
    placeName?: string;
    visitTime?: string;
    category?: string;
    categoryName?: string;
    coverImageIndex?: number;
    visibility?: string;
}

interface NoteDetailsViewProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly note: LocationNote;
    readonly onEdit?: () => void;
    readonly onDelete?: () => void;
}

export function NoteDetailsView({
    isOpen,
    onClose,
    note,
    onEdit,
    onDelete,
}: NoteDetailsViewProps) {
    const [fullNote, setFullNote] = useState<LocationNote | null>(null);
    const [isLoadingImages, setIsLoadingImages] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showLightbox, setShowLightbox] = useState(false);
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

    const loadFullNote = useCallback(async () => {
        setIsLoadingImages(true);
        setLoadError(null);
        try {
            console.log(`🔄 Loading images for note ${note.id}...`);
            console.log(`🔄 Request URL: /api/location-notes/${note.id}`);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

            const response = await fetch(`/api/location-notes/${note.id}`, {
                signal: controller.signal,
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include", // 🔑 Include session
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                const place = data.place || data; // API trả về { place: {...} }
                console.log(
                    `✅ Loaded place with ${place.media?.length || 0} media items`
                );

                // Transform Place model to LocationNote interface
                const imageUrls = place.media?.map((m: any) => m.url) || [];
                console.log(
                    `📸 Processing ${imageUrls.length} images:`,
                    imageUrls
                );

                const transformedNote: LocationNote = {
                    id: place.id,
                    lng: place.lng,
                    lat: place.lat,
                    address: place.address,
                    content: place.note || "",
                    mood: place.mood, // This might not exist in Place model
                    timestamp: new Date(place.createdAt),
                    placeName: place.name,
                    visitTime: place.visitDate,
                    category: place.category,
                    categoryName: place.categoryModel?.name,
                    images: imageUrls,
                    hasImages: (place.media?.length || 0) > 0,
                    coverImageIndex: place.coverImageIndex || 0,
                };

                console.log("✅ Transformed note:", {
                    id: transformedNote.id,
                    imageCount: transformedNote.images?.length,
                    hasImages: transformedNote.hasImages,
                    firstImageUrl: transformedNote.images?.[0],
                });

                setFullNote(transformedNote);
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
                setLoadError("Hết thời gian chờ tải ảnh. Vui lòng thử lại.");
            } else {
                console.error("❌ Error loading note images:", error);
                setLoadError("Lỗi không xác định khi tải ghi chú.");
            }
        } finally {
            setIsLoadingImages(false);
        }
    }, [note.id]);

    // Load full note with images when dialog opens (only if images not already loaded)
    useEffect(() => {
        console.log("🔍 Note details useEffect:", {
            isOpen,
            noteId: note.id,
            hasImages: note.hasImages,
            imagesAlreadyLoaded: !!note.images?.length,
            fullNoteExists: !!fullNote?.images?.length,
            shouldLoad:
                isOpen &&
                note.id &&
                note.hasImages &&
                !note.images?.length &&
                !fullNote?.images?.length,
        });

        // Only make API call if dialog is open, note has images, but they're not already loaded
        if (
            isOpen &&
            note.id &&
            note.hasImages &&
            !note.images?.length &&
            !fullNote?.images?.length
        ) {
            console.log("✅ Images not yet loaded, fetching from API...");
            loadFullNote();
        } else if (isOpen && note.images?.length) {
            console.log(
                "✅ Images already provided in note data, no API call needed"
            );
            // Images are already loaded in the note prop, use them directly
            setFullNote(note);
        } else if (!isOpen) {
            // Reset state when dialog closes
            setFullNote(null);
            setLoadError(null);
        } else if (isOpen) {
            console.log("❌ Conditions not met for loading images");
        }
    }, [
        isOpen,
        note.id,
        note.hasImages,
        note.images?.length,
        fullNote?.images?.length,
        loadFullNote,
        note,
    ]);

    // Use fullNote if available, otherwise use the basic note
    const displayNote = fullNote || note;

    // Refresh note when content changes (after edit)
    useEffect(() => {
        if (isOpen && note.id && note.content !== displayNote.content) {
            console.log(
                "📝 Note content changed, clearing cache to force refresh"
            );
            setFullNote(null);
            // If note already has images, use them; otherwise load from API
            if (note.images?.length) {
                setFullNote(note);
            } else if (note.hasImages) {
                loadFullNote();
            }
        }
    }, [isOpen, note, displayNote.content, loadFullNote]);

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
        "😊": "Vui vẻ",
        "😍": "Yêu thích",
        "😎": "Thư giãn",
        "🤔": "Suy nghĩ",
        "😴": "Bình thản",
        "😋": "Ngon miệng",
        "🥳": "Vui nhộn",
        "😤": "Không hài lòng",
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
            toast.loading("Đang lấy vị trí hiện tại...", {
                id: "note-directions",
            });

            const currentLocation = await getCurrentLocation();

            toast.loading("Đang tính toán tuyến đường...", {
                id: "note-directions",
            });

            // Calculate route using Mapbox Directions API
            const destination = { lat: note.lat, lng: note.lng };
            const route = await getRoute(currentLocation, destination, {
                profile: "driving",
            });

            console.log("🗺️ Note Details: Route calculated:", route);

            // Dispatch event to show direction popup on map
            globalThis.dispatchEvent(
                new CustomEvent("showDirections", {
                    detail: {
                        destination: {
                            name: note.content || "Ghi chú",
                            address: note.address || "",
                            lat: note.lat,
                            lng: note.lng,
                        },
                        routeInfo: {
                            duration: route.duration, // in seconds
                            distance: route.distance, // in meters
                        },
                        route: route, // Pass full route object for drawing on map
                    },
                })
            );

            toast.success("Đã tìm thấy tuyến đường!", {
                id: "note-directions",
            });

            // Also open external navigation app for actual navigation
            openExternalNavigation(destination, currentLocation);
        } catch (error) {
            console.error("❌ Error getting directions:", error);
            toast.error("Không thể tính toán tuyến đường", {
                description:
                    error instanceof Error
                        ? error.message
                        : "Vui lòng thử lại sau",
                id: "note-directions",
            });

            // Fallback: open without current location
            openExternalNavigation({ lat: note.lat, lng: note.lng });
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
                        aria-label={isExpanded ? "Thu gọn" : "Mở rộng"}
                    >
                        <div className="w-10 h-1 bg-neutral-600 rounded-full"></div>
                    </button>

                    {/* Cover Image */}
                    {displayNote.images && displayNote.images.length > 0 && (
                        <div
                            className="mx-4 mb-3 h-44 bg-gradient-to-r from-neutral-800 to-neutral-900 relative overflow-hidden flex-shrink-0 rounded-2xl shadow-lg"
                            onTouchStart={handleDragStart}
                            onTouchMove={handleDragMove}
                            onTouchEnd={handleDragEnd}
                        >
                            {isValidImageUrl(
                                displayNote.images[
                                    displayNote.coverImageIndex || 0
                                ]
                            ) ? (
                                <ImageDisplay
                                    src={
                                        displayNote.images[
                                            displayNote.coverImageIndex || 0
                                        ]
                                    }
                                    alt="Cover"
                                    className="w-full h-full object-cover pointer-events-none"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center pointer-events-none">
                                    <span className="text-4xl text-[#A0A0A0]">
                                        📷
                                    </span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>

                            {/* Close button */}
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
                        className="px-5 py-3 flex-shrink-0"
                        onTouchStart={handleDragStart}
                        onTouchMove={handleDragMove}
                        onTouchEnd={handleDragEnd}
                    >
                        <div className="flex items-start gap-2.5">
                            <span className="text-2xl flex-shrink-0 leading-none">
                                {displayNote.mood || "📍"}
                            </span>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg font-bold text-[#EDEDED] mb-1 leading-tight">
                                    {displayNote.placeName ||
                                        "Ghi chú địa điểm"}
                                </h2>
                                <p className="text-xs text-[#A0A0A0] flex items-center gap-1.5 leading-relaxed">
                                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                                    <span className="line-clamp-1">
                                        {note.address}
                                    </span>
                                </p>
                                {displayNote.visitTime && (
                                    <p className="text-xs text-[#A0A0A0] mt-1 flex items-center gap-1.5">
                                        <Clock className="h-3 w-3 flex-shrink-0" />
                                        {formatVisitTime(displayNote.visitTime)}
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
                        {(displayNote.categoryName || displayNote.mood) && (
                            <div className="flex flex-wrap gap-2">
                                {displayNote.categoryName && (
                                    <div className="flex items-center gap-1.5 bg-purple-900/30 text-purple-400 px-2.5 py-1 rounded-full border border-purple-800">
                                        <Tag className="h-3 w-3" />
                                        <span className="text-xs font-medium">
                                            {displayNote.categoryName}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Content */}
                        {displayNote.content && (
                            <div>
                                <h3 className="text-xs font-semibold text-[#A0A0A0] mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                                    <Heart className="h-3.5 w-3.5" />
                                    Nội dung
                                </h3>
                                <p className="text-sm text-[#EDEDED] leading-relaxed whitespace-pre-wrap">
                                    {displayNote.content}
                                </p>
                            </div>
                        )}

                        {/* All Images Grid */}
                        {displayNote.images &&
                            displayNote.images.length > 0 && (
                                <div>
                                    <h3 className="text-xs font-semibold text-[#A0A0A0] mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                                        <Eye className="h-3.5 w-3.5" />
                                        Hình ảnh ({displayNote.images.length})
                                    </h3>
                                    <div className="grid grid-cols-3 gap-2">
                                        {displayNote.images.map(
                                            (image, index) => (
                                                <button
                                                    key={`${displayNote.id || note.id}-img-${index}-${image.substring(0, 20)}`}
                                                    className="aspect-square bg-neutral-800 rounded-xl border border-neutral-700 overflow-hidden hover:border-neutral-600 transition-colors"
                                                    onClick={() => {
                                                        setCurrentImageIndex(
                                                            index
                                                        );
                                                        setShowLightbox(true);
                                                    }}
                                                >
                                                    {isValidImageUrl(image) ? (
                                                        <ImageDisplay
                                                            src={image}
                                                            alt={`Ảnh ${index + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <span className="text-2xl text-[#A0A0A0]">
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
                    <div className="sticky bottom-0 bg-gradient-to-t from-[#0a0a0a] via-[#0C0C0C]/95 to-transparent backdrop-blur-xl border-t border-neutral-800/50 px-5 py-3 flex-shrink-0">
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
                                Chỉ đường
                            </Button>
                            <Button
                                variant="outline"
                                onClick={onEdit}
                                className="flex-1 h-11 bg-gradient-to-br from-[#FF6B6B]/20 to-[#FF8E53]/20 hover:from-[#FF6B6B]/30 hover:to-[#FF8E53]/30 border-[#FF6B6B]/40 text-[#FFD6A5] font-semibold text-sm rounded-xl"
                            >
                                <Edit className="h-4 w-4 mr-1.5" />
                                Chỉnh sửa
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    if (
                                        globalThis.confirm(
                                            "Bạn có chắc muốn xóa ghi chú này?"
                                        )
                                    ) {
                                        onDelete?.();
                                    }
                                }}
                                className="h-11 px-3.5 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl"
                                title="Xóa ghi chú"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Lightbox */}
                <ImageLightbox
                    images={displayNote.images || []}
                    currentIndex={currentImageIndex}
                    isOpen={showLightbox}
                    onClose={() => setShowLightbox(false)}
                    onNext={() => {
                        setCurrentImageIndex((prev) =>
                            prev === (displayNote.images?.length || 1) - 1
                                ? 0
                                : prev + 1
                        );
                    }}
                    onPrevious={() => {
                        setCurrentImageIndex((prev) =>
                            prev === 0
                                ? (displayNote.images?.length || 1) - 1
                                : prev - 1
                        );
                    }}
                />
            </>
        );
    }

    // DESKTOP: Original Dialog
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0 bg-[#0C0C0C] border border-neutral-800 shadow-2xl flex flex-col rounded-2xl">
                {/* Accessible title for screen readers */}
                <DialogTitle className="sr-only">
                    Chi tiết ghi chú:{" "}
                    {displayNote.placeName ||
                        displayNote.content?.slice(0, 50) ||
                        "Ghi chú địa điểm"}
                </DialogTitle>

                {/* Modern Header */}
                <div className="relative bg-neutral-900/80 border-b border-neutral-800/50 px-6 py-5 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        {/* Title with emoji */}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                                <span className="text-xl">
                                    {displayNote.mood || "📍"}
                                </span>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-[#EDEDED]">
                                    {displayNote.placeName ||
                                        "Ghi chú địa điểm"}
                                </h2>
                                <p className="text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5">
                                    <MapPin className="h-3 w-3 flex-shrink-0" />
                                    <span className="line-clamp-1">
                                        {note.address}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Scrollable content area */}
                <div className="flex-1 overflow-y-auto bg-[#0C0C0C] custom-scrollbar">
                    <div className="space-y-5 p-6">
                        {/* Images Section */}
                        {(displayNote.hasImages ||
                            (displayNote.images &&
                                displayNote.images.length > 0)) && (
                            <div className="space-y-3 p-5 bg-neutral-900/50 rounded-xl border border-neutral-800/50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-1 w-1 rounded-full bg-blue-500"></div>
                                        <h3 className="text-base font-semibold text-[#EDEDED] flex items-center gap-2">
                                            <Eye className="h-4 w-4" />
                                            Hình ảnh
                                        </h3>
                                    </div>
                                    {displayNote.images &&
                                        displayNote.images.length > 0 && (
                                            <span className="px-2.5 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-lg font-medium border border-blue-500/30">
                                                {displayNote.images.length} ảnh
                                            </span>
                                        )}
                                </div>

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
                                                    onClick={loadFullNote}
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
                                                <span className="text-sm font-medium text-[#EDEDED] mb-1">
                                                    Đang tải ảnh...
                                                </span>
                                                <span className="text-xs text-neutral-400">
                                                    Vui lòng đợi trong giây lát
                                                </span>
                                            </div>
                                        );
                                    }

                                    if (
                                        displayNote.images &&
                                        displayNote.images.length > 0
                                    ) {
                                        return (
                                            <div className="grid grid-cols-2 gap-3">
                                                {displayNote.images.map(
                                                    (image, index) => {
                                                        const isCoverImage =
                                                            index ===
                                                            (displayNote.coverImageIndex ||
                                                                0);
                                                        return (
                                                            <button
                                                                key={`image-${displayNote.id}-${index}`}
                                                                className="group relative aspect-square bg-neutral-800/80 rounded-xl border border-neutral-700/50 overflow-hidden hover:border-blue-500/50 transition-all duration-200 cursor-pointer"
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
                                                                    <>
                                                                        <ImageDisplay
                                                                            src={
                                                                                image
                                                                            }
                                                                            alt={`Ảnh ${index + 1}`}
                                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                                                        />
                                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200"></div>

                                                                        {/* Hover hint */}
                                                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                                            <div className="bg-black/80 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm backdrop-blur-sm">
                                                                                <Eye className="h-3.5 w-3.5" />
                                                                                <span>
                                                                                    Xem
                                                                                </span>
                                                                            </div>
                                                                        </div>

                                                                        {/* Cover badge */}
                                                                        {isCoverImage && (
                                                                            <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 shadow-lg">
                                                                                <Star className="h-3 w-3" />
                                                                                Cover
                                                                            </div>
                                                                        )}

                                                                        {/* Image counter */}
                                                                        {displayNote.images &&
                                                                            displayNote
                                                                                .images
                                                                                .length >
                                                                                1 && (
                                                                                <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded-md text-xs font-medium backdrop-blur-sm">
                                                                                    {index +
                                                                                        1}{" "}
                                                                                    /{" "}
                                                                                    {
                                                                                        displayNote
                                                                                            .images
                                                                                            .length
                                                                                    }
                                                                                </div>
                                                                            )}
                                                                    </>
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                                                        <div className="text-center">
                                                                            <div className="text-3xl mb-1">
                                                                                📷
                                                                            </div>
                                                                            <div className="text-xs">
                                                                                Ảnh
                                                                                lỗi
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </button>
                                                        );
                                                    }
                                                )}
                                            </div>
                                        );
                                    }

                                    if (displayNote.hasImages) {
                                        return (
                                            <div className="text-center py-8 text-neutral-400">
                                                <Eye className="h-8 w-8 mx-auto mb-2" />
                                                <div className="text-sm">
                                                    Có ảnh nhưng chưa tải được
                                                </div>
                                            </div>
                                        );
                                    }

                                    return null;
                                })()}
                            </div>
                        )}

                        {/* Content Section */}
                        {displayNote.content && (
                            <div className="space-y-3 p-5 bg-neutral-900/50 rounded-xl border border-neutral-800/50">
                                <div className="flex items-center gap-2">
                                    <div className="h-1 w-1 rounded-full bg-blue-500"></div>
                                    <h3 className="text-base font-semibold text-[#EDEDED] flex items-center gap-2">
                                        <Heart className="h-4 w-4" />
                                        Nội dung ghi chú
                                    </h3>
                                </div>
                                <div className="relative">
                                    <p className="text-[#EDEDED] whitespace-pre-wrap leading-relaxed text-base">
                                        {displayNote.content}
                                    </p>
                                    <div className="absolute bottom-0 right-0 text-xs text-neutral-500">
                                        {displayNote.content.length}/280
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Metadata Tags */}
                        {(displayNote.categoryName ||
                            displayNote.visitTime) && (
                            <div className="space-y-3 p-5 bg-neutral-900/50 rounded-xl border border-neutral-800/50">
                                <div className="flex items-center gap-2">
                                    <div className="h-1 w-1 rounded-full bg-blue-500"></div>
                                    <h3 className="text-base font-semibold text-[#EDEDED] flex items-center gap-2">
                                        <Tag className="h-4 w-4" />
                                        Thông tin
                                    </h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {/* Category */}
                                    {displayNote.categoryName && (
                                        <div className="flex items-center gap-1.5 bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/30 text-sm">
                                            <Tag className="h-3.5 w-3.5" />
                                            <span>
                                                {displayNote.categoryName}
                                            </span>
                                        </div>
                                    )}

                                    {/* Visit Time */}
                                    {displayNote.visitTime && (
                                        <div className="flex items-center gap-1.5 bg-neutral-800 text-neutral-300 px-3 py-1.5 rounded-lg border border-neutral-700 text-sm">
                                            <CalendarDays className="h-3.5 w-3.5" />
                                            <span>
                                                {formatVisitTime(
                                                    displayNote.visitTime
                                                )}
                                            </span>
                                        </div>
                                    )}

                                    {/* Mood */}
                                    {note.mood && (
                                        <div className="flex items-center gap-1.5 bg-neutral-800 text-neutral-300 px-3 py-1.5 rounded-lg border border-neutral-700 text-sm">
                                            <span className="text-base">
                                                {note.mood}
                                            </span>
                                            <span>
                                                {moodLabels[note.mood] ||
                                                    "Khác"}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Timestamp */}
                        <div className="p-4 bg-neutral-900/30 rounded-lg border border-neutral-800/50">
                            <div className="flex items-center gap-2 text-neutral-400 text-sm">
                                <Clock className="h-4 w-4" />
                                <span>
                                    Tạo lúc {formatDateTime(note.timestamp)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons Footer */}
                <div className="sticky bottom-0 bg-neutral-900/80 backdrop-blur-xl border-t border-neutral-800/50 p-4 flex-shrink-0">
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
                            Chỉ đường
                        </Button>
                        <Button
                            variant="outline"
                            onClick={onEdit}
                            className="flex-1 h-11 bg-neutral-800/80 hover:bg-neutral-700 border-neutral-700 hover:border-neutral-600 text-[#EDEDED] font-semibold rounded-lg transition-all"
                        >
                            <Edit className="h-4 w-4 mr-1.5" />
                            Chỉnh sửa
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (
                                    globalThis.confirm(
                                        "Bạn có chắc muốn xóa ghi chú này?"
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
                images={displayNote.images || []}
                currentIndex={currentImageIndex}
                isOpen={showLightbox}
                onClose={() => setShowLightbox(false)}
                onNext={() => {
                    setCurrentImageIndex((prev) =>
                        prev === (displayNote.images?.length || 1) - 1
                            ? 0
                            : prev + 1
                    );
                }}
                onPrevious={() => {
                    setCurrentImageIndex((prev) =>
                        prev === 0
                            ? (displayNote.images?.length || 1) - 1
                            : prev - 1
                    );
                }}
            />
        </Dialog>
    );
}
