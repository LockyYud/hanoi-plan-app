"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    MapPin,
    Clock,
    Edit,
    Trash2,
    Share,
    Heart,
    Eye,
    Tag,
    CalendarDays,
    Star,
    X,
    ChevronRight,
    ChevronDown,
    Navigation,
} from "lucide-react";
import { isValidImageUrl, ImageDisplay } from "@/lib/image-utils";
import { ImageLightbox } from "./image-lightbox";
import { cn } from "@/lib/utils";
import { getCurrentLocation, openExternalNavigation } from "@/lib/geolocation";
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
                const noteWithImages = await response.json();
                console.log(
                    `✅ Loaded note with ${noteWithImages.images?.length || 0} images`
                );
                setFullNote(noteWithImages);
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

            toast.success("Đã tìm thấy vị trí của bạn!", {
                id: "note-directions",
            });

            // Open external navigation app
            const destination = { lat: note.lat, lng: note.lng };
            openExternalNavigation(destination, currentLocation);
        } catch (error) {
            console.error("❌ Error getting directions:", error);
            toast.error("Không thể lấy vị trí hiện tại", {
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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 bg-gradient-to-br from-[#0a0a0a] via-[#0C0C0C] to-[#0a0a0a] border border-neutral-700/50 shadow-2xl flex flex-col backdrop-blur-xl">
                {/* Accessible title for screen readers */}
                <DialogTitle className="sr-only">
                    Chi tiết ghi chú:{" "}
                    {displayNote.placeName ||
                        displayNote.content?.slice(0, 50) ||
                        "Ghi chú địa điểm"}
                </DialogTitle>

                {/* Compact Header - Enhanced */}
                <div className="relative bg-gradient-to-r from-neutral-900/90 to-neutral-800/90 border-b border-neutral-700/50 px-6 py-4 flex-shrink-0">
                    {/* Decorative gradient line */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FF6B6B] via-[#FF8E53] to-[#FFD6A5]"></div>

                    <div className="flex items-center justify-between">
                        {/* Breadcrumb */}
                        <div
                            className="flex items-center gap-2 text-[#A0A0A0]"
                            style={{ fontSize: "var(--text-sm)" }}
                        >
                            <MapPin
                                className="h-4 w-4 text-[#FF6B6B]"
                                strokeWidth={2}
                            />
                            <span>Địa điểm</span>
                            <ChevronRight className="h-3 w-3" strokeWidth={2} />
                            <span className="text-[#EDEDED] font-semibold">
                                {displayNote.placeName || "Ghi chú"}
                            </span>
                        </div>

                        {/* Close Button - Enhanced */}
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-red-600/20 to-red-700/20 hover:from-red-600/40 hover:to-red-700/40 border border-red-700/50 hover:border-red-600 transition-all duration-200 hover:scale-105"
                            aria-label="Đóng modal"
                        >
                            <X
                                className="h-5 w-5 text-red-400 hover:text-red-300"
                                strokeWidth={2}
                            />
                        </button>
                    </div>
                </div>

                {/* Scrollable content area */}
                <div className="flex-1 overflow-y-auto bg-[#0C0C0C]">
                    <div className="space-y-4">
                        {/* HERO: Images Section - Full width gallery */}
                        {(displayNote.hasImages ||
                            (displayNote.images &&
                                displayNote.images.length > 0)) && (
                            <div className="bg-[#111111] border-b border-neutral-800">
                                <div className="p-4 pb-3">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-semibold text-[#EDEDED] flex items-center gap-2">
                                            <Eye
                                                className="h-4 w-4 text-[#A0A0A0]"
                                                strokeWidth={1.5}
                                            />
                                            Hình ảnh
                                        </h3>
                                        {displayNote.images &&
                                            displayNote.images.length > 0 && (
                                                <span
                                                    className="px-3 py-1.5 bg-gradient-to-r from-[#FF6B6B]/20 to-[#FF8E53]/20 text-[#FFD6A5] rounded-xl font-bold border border-[#FF6B6B]/40 shadow-lg"
                                                    style={{
                                                        fontSize:
                                                            "var(--text-xs)",
                                                    }}
                                                >
                                                    📷{" "}
                                                    {displayNote.images
                                                        ?.length || 0}{" "}
                                                    ảnh
                                                </span>
                                            )}
                                    </div>
                                </div>

                                <div className="px-4 pb-4">
                                    {(() => {
                                        if (loadError) {
                                            return (
                                                <div className="flex flex-col items-center justify-center py-12 text-red-400">
                                                    <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mb-4 border border-red-800">
                                                        <div className="text-2xl">
                                                            ⚠️
                                                        </div>
                                                    </div>
                                                    <span
                                                        className="text-center font-medium"
                                                        style={{
                                                            fontSize:
                                                                "var(--text-sm)",
                                                        }}
                                                    >
                                                        {loadError}
                                                    </span>
                                                    <button
                                                        onClick={loadFullNote}
                                                        className="mt-3 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors font-medium border border-red-800"
                                                        style={{
                                                            fontSize:
                                                                "var(--text-sm)",
                                                        }}
                                                    >
                                                        Thử lại
                                                    </button>
                                                </div>
                                            );
                                        }

                                        if (isLoadingImages) {
                                            return (
                                                <div className="flex flex-col items-center justify-center py-12 text-[#A0A0A0]">
                                                    <div className="relative mb-4">
                                                        <div className="animate-spin h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full"></div>
                                                        <div className="absolute inset-0 animate-ping h-8 w-8 border border-blue-400/30 rounded-full"></div>
                                                    </div>
                                                    <span
                                                        className="text-center font-medium text-[#EDEDED]"
                                                        style={{
                                                            fontSize:
                                                                "var(--text-sm)",
                                                        }}
                                                    >
                                                        Đang tải ảnh...
                                                    </span>
                                                    <span
                                                        className="text-[#A0A0A0] mt-1"
                                                        style={{
                                                            fontSize:
                                                                "var(--text-xs)",
                                                        }}
                                                    >
                                                        Có thể mất vài giây do
                                                        ảnh lớn
                                                    </span>
                                                </div>
                                            );
                                        }

                                        if (
                                            displayNote.images &&
                                            displayNote.images.length > 0
                                        ) {
                                            return (
                                                <div className="space-y-3">
                                                    {/* Main image carousel */}
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {displayNote.images.map(
                                                            (image, index) => {
                                                                const isCoverImage =
                                                                    index ===
                                                                    (displayNote.coverImageIndex ||
                                                                        0);
                                                                return (
                                                                    <button
                                                                        key={`image-${displayNote.id}-${index}`}
                                                                        className="group relative aspect-[4/3] bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-lg border border-neutral-700 overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer w-full hover:border-neutral-600"
                                                                        onClick={() => {
                                                                            setCurrentImageIndex(
                                                                                index
                                                                            );
                                                                            setShowLightbox(
                                                                                true
                                                                            );
                                                                        }}
                                                                        aria-label={`Xem ảnh ${index + 1} trong lightbox`}
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
                                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                                />
                                                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>

                                                                                {/* Zoom overlay hint */}
                                                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                                                    <div
                                                                                        className="bg-black/80 text-white px-4 py-2 rounded-lg flex items-center gap-2 border border-neutral-600"
                                                                                        style={{
                                                                                            fontSize:
                                                                                                "var(--text-sm)",
                                                                                        }}
                                                                                    >
                                                                                        <Eye
                                                                                            className="h-4 w-4"
                                                                                            strokeWidth={
                                                                                                1.5
                                                                                            }
                                                                                        />
                                                                                        <span>
                                                                                            Xem
                                                                                            chi
                                                                                            tiết
                                                                                        </span>
                                                                                    </div>
                                                                                </div>

                                                                                {/* Cover badge */}
                                                                                {isCoverImage && (
                                                                                    <div
                                                                                        className="absolute top-3 left-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-2 rounded-lg font-bold shadow-lg"
                                                                                        style={{
                                                                                            fontSize:
                                                                                                "var(--text-sm)",
                                                                                        }}
                                                                                    >
                                                                                        <Star
                                                                                            className="h-4 w-4 inline mr-2"
                                                                                            strokeWidth={
                                                                                                1.5
                                                                                            }
                                                                                        />
                                                                                        Ảnh
                                                                                        bìa
                                                                                    </div>
                                                                                )}

                                                                                {/* Image counter */}
                                                                                {displayNote.images &&
                                                                                    displayNote
                                                                                        .images
                                                                                        .length >
                                                                                        1 && (
                                                                                        <div
                                                                                            className="absolute bottom-3 right-3 bg-black/80 text-white px-3 py-2 rounded-lg font-medium border border-neutral-600"
                                                                                            style={{
                                                                                                fontSize:
                                                                                                    "var(--text-sm)",
                                                                                            }}
                                                                                        >
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
                                                                            <div className="w-full h-full flex items-center justify-center text-[#A0A0A0]">
                                                                                <div className="text-center">
                                                                                    <div className="text-3xl mb-2">
                                                                                        📷
                                                                                    </div>
                                                                                    <div
                                                                                        className="font-medium"
                                                                                        style={{
                                                                                            fontSize:
                                                                                                "var(--text-xs)",
                                                                                        }}
                                                                                    >
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
                                                </div>
                                            );
                                        }

                                        if (displayNote.hasImages) {
                                            return (
                                                <div className="text-center py-8 text-[#A0A0A0]">
                                                    <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-3 border border-neutral-700">
                                                        <Eye
                                                            className="h-5 w-5"
                                                            strokeWidth={1.5}
                                                        />
                                                    </div>
                                                    <div
                                                        className="font-medium"
                                                        style={{
                                                            fontSize:
                                                                "var(--text-sm)",
                                                        }}
                                                    >
                                                        Có ảnh nhưng chưa tải
                                                        được
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return null;
                                    })()}
                                </div>
                            </div>
                        )}

                        <div className="px-6 space-y-4">
                            {/* PRIORITY 1: Content Card - Enhanced */}
                            <div className="bg-[#111111] rounded-xl border border-neutral-800 shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-neutral-800 to-neutral-900 px-6 py-4 border-b border-neutral-700">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-[#EDEDED] flex items-center gap-2">
                                            <Heart
                                                className="h-5 w-5 text-[#A0A0A0]"
                                                strokeWidth={1.5}
                                            />
                                            Nội dung ghi chú
                                        </h3>
                                    </div>
                                </div>
                                <div className="p-6 relative">
                                    {displayNote.content ? (
                                        <>
                                            <p
                                                className="text-[#EDEDED] whitespace-pre-wrap leading-relaxed"
                                                style={{
                                                    fontSize:
                                                        "var(--text-base)",
                                                    lineHeight: "1.6",
                                                }}
                                            >
                                                {displayNote.content}
                                            </p>
                                            {/* Character counter in bottom right */}
                                            <div
                                                className="absolute bottom-3 right-4 text-[#A0A0A0] opacity-60"
                                                style={{
                                                    fontSize: "var(--text-xs)",
                                                }}
                                            >
                                                {displayNote.content.length}/280
                                            </div>
                                        </>
                                    ) : (
                                        <p
                                            className="text-[#A0A0A0] italic text-center py-8"
                                            style={{
                                                fontSize: "var(--text-base)",
                                            }}
                                        >
                                            Không có nội dung ghi chú
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* PRIORITY 2: Tags & Mood - Compact chips */}
                            <div className="flex flex-wrap gap-2">
                                {/* Place Name Chip */}
                                {displayNote.placeName && (
                                    <div className="flex items-center gap-2 bg-green-900/30 text-green-400 px-3 py-2 rounded-full border border-green-800">
                                        <Star
                                            className="h-4 w-4"
                                            strokeWidth={1.5}
                                        />
                                        <span
                                            className="font-medium"
                                            style={{
                                                fontSize: "var(--text-sm)",
                                            }}
                                        >
                                            {displayNote.placeName}
                                        </span>
                                    </div>
                                )}

                                {/* Category Chip */}
                                {displayNote.categoryName && (
                                    <div className="flex items-center gap-2 bg-purple-900/30 text-purple-400 px-3 py-2 rounded-full border border-purple-800">
                                        <Tag
                                            className="h-4 w-4"
                                            strokeWidth={1.5}
                                        />
                                        <span
                                            className="font-medium"
                                            style={{
                                                fontSize: "var(--text-sm)",
                                            }}
                                        >
                                            {displayNote.categoryName}
                                        </span>
                                    </div>
                                )}

                                {/* Visit Time Chip */}
                                {displayNote.visitTime && (
                                    <div className="flex items-center gap-2 bg-cyan-900/30 text-cyan-400 px-3 py-2 rounded-full border border-cyan-800">
                                        <CalendarDays
                                            className="h-4 w-4"
                                            strokeWidth={1.5}
                                        />
                                        <span
                                            className="font-medium"
                                            style={{
                                                fontSize: "var(--text-sm)",
                                            }}
                                        >
                                            {formatVisitTime(
                                                displayNote.visitTime
                                            )}
                                        </span>
                                    </div>
                                )}

                                {/* Mood Chip */}
                                {note.mood && (
                                    <div className="flex items-center gap-2 bg-amber-900/30 text-amber-400 px-3 py-2 rounded-full border border-amber-800">
                                        <span className="text-lg">
                                            {note.mood}
                                        </span>
                                        <span
                                            className="font-medium"
                                            style={{
                                                fontSize: "var(--text-sm)",
                                            }}
                                        >
                                            {moodLabels[note.mood] || "Khác"}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* PRIORITY 3: Minimal Metadata - Single row */}
                            <div className="bg-[#111111] rounded-lg p-4 border border-neutral-800">
                                <div
                                    className="flex items-center justify-between text-[#A0A0A0]"
                                    style={{ fontSize: "var(--text-sm)" }}
                                >
                                    <div className="flex items-center gap-2">
                                        <Clock
                                            className="h-4 w-4"
                                            strokeWidth={1.5}
                                        />
                                        <span>
                                            Tạo lúc{" "}
                                            {formatDateTime(note.timestamp)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin
                                            className="h-4 w-4"
                                            strokeWidth={1.5}
                                        />
                                        <span>Vị trí đã lưu</span>
                                    </div>
                                </div>

                                {/* Expandable technical details */}
                                <details className="mt-3 group">
                                    <summary
                                        className="cursor-pointer text-[#A0A0A0] hover:text-[#EDEDED] flex items-center gap-2 transition-colors"
                                        style={{ fontSize: "var(--text-xs)" }}
                                    >
                                        <span>Chi tiết kỹ thuật</span>
                                        <ChevronDown
                                            className="h-3 w-3 transition-transform group-open:rotate-180"
                                            strokeWidth={1.5}
                                        />
                                    </summary>
                                    <div className="mt-2 pt-2 border-t border-neutral-700 space-y-1">
                                        <div
                                            className="text-[#A0A0A0]"
                                            style={{
                                                fontSize: "var(--text-xs)",
                                            }}
                                        >
                                            <strong className="text-[#EDEDED]">
                                                Địa chỉ:
                                            </strong>{" "}
                                            {note.address}
                                        </div>
                                        <div
                                            className="text-[#A0A0A0] font-mono"
                                            style={{
                                                fontSize: "var(--text-xs)",
                                            }}
                                        >
                                            <strong className="text-[#EDEDED]">
                                                Tọa độ:
                                            </strong>{" "}
                                            {note.lng.toFixed(6)},{" "}
                                            {note.lat.toFixed(6)}
                                        </div>
                                        <div
                                            className="text-[#A0A0A0]"
                                            style={{
                                                fontSize: "var(--text-xs)",
                                            }}
                                        >
                                            <strong className="text-[#EDEDED]">
                                                ID:
                                            </strong>{" "}
                                            {note.id}
                                        </div>
                                    </div>
                                </details>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons - Sticky Footer - Enhanced */}
                <div className="sticky bottom-0 bg-gradient-to-r from-neutral-900/95 via-neutral-800/95 to-neutral-900/95 backdrop-blur-xl border-t border-neutral-700/50 p-4 flex-shrink-0 shadow-2xl">
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={onEdit}
                            className="flex-1 h-11 bg-gradient-to-br from-[#FF6B6B]/20 to-[#FF8E53]/20 hover:from-[#FF6B6B]/30 hover:to-[#FF8E53]/30 border-[#FF6B6B]/40 hover:border-[#FF6B6B]/60 text-[#FFD6A5] hover:text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                        >
                            <Edit className="h-4 w-4 mr-2" strokeWidth={2} />
                            Chỉnh sửa
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (navigator.share) {
                                    navigator.share({
                                        title: "Ghi chú địa điểm",
                                        text:
                                            note.content ||
                                            displayNote.placeName ||
                                            "Ghi chú địa điểm",
                                        url: globalThis.location.href,
                                    });
                                }
                            }}
                            className="flex-1 h-11 bg-gradient-to-br from-green-900/40 to-emerald-900/40 hover:from-green-800/50 hover:to-emerald-800/50 border-green-700/50 hover:border-green-600 text-green-300 hover:text-green-200 font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                        >
                            <Share className="h-4 w-4 mr-2" strokeWidth={2} />
                            Chia sẻ
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (
                                    globalThis.confirm(
                                        "Bạn có chắc muốn xóa ghi chú này không? Hành động này không thể hoàn tác."
                                    )
                                ) {
                                    onDelete?.();
                                }
                            }}
                            className="h-11 px-4 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-200"
                        >
                            <Trash2 className="h-4 w-4" strokeWidth={2} />
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
