"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    MapPin,
    Clock,
    Edit,
    Trash2,
    Share,
    BookOpen,
    Heart,
    Eye,
} from "lucide-react";
import { isValidImageUrl, ImageDisplay } from "@/lib/image-utils";

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
                credentials: "same-origin", // Ensure cookies are sent
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

    // Load full note with images when dialog opens
    useEffect(() => {
        console.log("🔍 Note details useEffect:", {
            isOpen,
            noteId: note.id,
            hasImages: note.hasImages,
            fullNoteExists: !!fullNote?.images?.length,
            shouldLoad:
                isOpen &&
                note.id &&
                note.hasImages &&
                !fullNote?.images?.length,
        });

        if (isOpen && note.id && note.hasImages && !fullNote?.images?.length) {
            console.log("✅ Conditions met, loading full note...");
            loadFullNote();
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
        fullNote?.images?.length,
        loadFullNote,
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
            if (note.hasImages) {
                loadFullNote();
            }
        }
    }, [
        isOpen,
        note.id,
        note.content,
        displayNote.content,
        note.hasImages,
        loadFullNote,
    ]);

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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 bg-gradient-to-br from-white to-gray-50/50 border-0 shadow-2xl flex flex-col">
                {/* Header with gradient background */}
                <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-6 pb-8 flex-shrink-0">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <DialogHeader className="relative z-10">
                        <DialogTitle className="flex items-center gap-3 text-xl font-bold text-white">
                            <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                                <BookOpen className="h-6 w-6" />
                            </div>
                            Ghi chú địa điểm
                        </DialogTitle>
                    </DialogHeader>

                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
                </div>

                {/* Scrollable content area */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                        {/* Time & Location Card */}
                        <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100/50 shadow-sm hover:shadow-md transition-all duration-200">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-8 translate-x-8"></div>
                            <div className="relative space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <Clock className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-blue-900">
                                            Thời gian
                                        </div>
                                        <div className="text-sm text-blue-700">
                                            {formatDateTime(note.timestamp)}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg mt-0.5">
                                        <MapPin className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-blue-900 mb-1">
                                            Địa chỉ
                                        </div>
                                        <div className="text-sm text-blue-700 break-words leading-relaxed">
                                            {note.address}
                                        </div>
                                        <div className="text-xs text-blue-500 mt-1 font-mono">
                                            {note.lng.toFixed(6)},{" "}
                                            {note.lat.toFixed(6)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mood Card */}
                        {note.mood && (
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-100/50 shadow-sm hover:shadow-md transition-all duration-200">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="text-4xl transform hover:scale-110 transition-transform duration-200">
                                            {note.mood}
                                        </div>
                                        <div className="absolute -inset-2 bg-amber-200/30 rounded-full -z-10"></div>
                                    </div>
                                    <div>
                                        <div className="text-base font-semibold text-amber-900 mb-1">
                                            Tâm trạng lúc đó
                                        </div>
                                        <div className="text-sm text-amber-700 font-medium">
                                            {moodLabels[note.mood] || "Khác"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Content Card */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                            <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-5 py-3 border-b border-gray-100">
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Heart className="h-4 w-4 text-gray-600" />
                                    Nội dung ghi chú
                                </h3>
                            </div>
                            <div className="p-5">
                                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-sm">
                                    {displayNote.content}
                                </p>
                            </div>
                        </div>

                        {/* Images Section */}
                        {(displayNote.hasImages ||
                            (displayNote.images &&
                                displayNote.images.length > 0)) && (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                                <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-5 py-3 border-b border-gray-100">
                                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                        <Eye className="h-4 w-4 text-gray-600" />
                                        Hình ảnh{" "}
                                        {displayNote.images &&
                                            displayNote.images.length > 0 && (
                                                <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                                    {displayNote.images
                                                        ?.length || 0}
                                                </span>
                                            )}
                                    </h3>
                                </div>
                                <div className="p-5">
                                    {(() => {
                                        if (loadError) {
                                            return (
                                                <div className="flex flex-col items-center justify-center py-12 text-red-500">
                                                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                                        <div className="text-2xl">
                                                            ⚠️
                                                        </div>
                                                    </div>
                                                    <span className="text-sm text-center font-medium">
                                                        {loadError}
                                                    </span>
                                                    <button
                                                        onClick={loadFullNote}
                                                        className="mt-3 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm rounded-lg transition-colors font-medium"
                                                    >
                                                        Thử lại
                                                    </button>
                                                </div>
                                            );
                                        }

                                        if (isLoadingImages) {
                                            return (
                                                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                                    <div className="relative mb-4">
                                                        <div className="animate-spin h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full"></div>
                                                        <div className="absolute inset-0 animate-ping h-8 w-8 border border-blue-300 rounded-full"></div>
                                                    </div>
                                                    <span className="text-sm text-center font-medium">
                                                        Đang tải ảnh...
                                                    </span>
                                                    <span className="text-xs text-gray-400 mt-1">
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
                                                <div className="grid grid-cols-2 gap-4">
                                                    {displayNote.images.map(
                                                        (image, index) => (
                                                            <div
                                                                key={`image-${displayNote.id}-${index}`}
                                                                className="group relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
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
                                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                                                                        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            #
                                                                            {index +
                                                                                1}
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                                        <div className="text-center">
                                                                            <div className="text-3xl mb-2">
                                                                                📷
                                                                            </div>
                                                                            <div className="text-xs font-medium">
                                                                                Ảnh
                                                                                lỗi
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            );
                                        }

                                        if (displayNote.hasImages) {
                                            return (
                                                <div className="text-center py-8 text-gray-500">
                                                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                        <Eye className="h-5 w-5" />
                                                    </div>
                                                    <div className="text-sm font-medium">
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
                    </div>
                </div>

                {/* Action Buttons - Fixed at bottom */}
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-t border-gray-100 p-4 flex-shrink-0">
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={onEdit}
                            className="flex-1 h-11 bg-white hover:bg-blue-50 border-blue-200 text-blue-700 hover:text-blue-800 font-medium shadow-sm hover:shadow transition-all duration-200"
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            Chỉnh sửa
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (navigator.share) {
                                    navigator.share({
                                        title: "Ghi chú địa điểm",
                                        text: note.content,
                                        url: window.location.href,
                                    });
                                }
                            }}
                            className="flex-1 h-11 bg-white hover:bg-green-50 border-green-200 text-green-700 hover:text-green-800 font-medium shadow-sm hover:shadow transition-all duration-200"
                        >
                            <Share className="h-4 w-4 mr-2" />
                            Chia sẻ
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={onDelete}
                            className="h-11 px-4 bg-red-500 hover:bg-red-600 text-white font-medium shadow-sm hover:shadow transition-all duration-200"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
